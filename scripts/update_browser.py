"""Reproduce a legacy cache and verify the live recovery route without changing browser trust."""
import json,sys,termios,urllib.request,urllib.error
from pathlib import Path
from playwright.sync_api import sync_playwright
cfg=termios.tcgetattr(sys.stdin.fileno());cfg[3]&=~termios.ECHO;termios.tcsetattr(sys.stdin.fileno(),termios.TCSANOW,cfg)
print('Ready for private Site access (hidden).',flush=True)
token=json.loads(sys.stdin.readline())['token']
origin='https://starbucks-genie-preview-astrid-20261111.steelyflag.chatgpt.site'
art=Path(__file__).resolve().parents[1]/'artifacts';art.mkdir(exist_ok=True)
legacy_worker="""self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open('workbox-precache-legacy-test').then(c=>c.put('/index.html',new Response('<!doctype html><h1>Legacy menu</h1><p>123 modeled entries</p>',{headers:{'Content-Type':'text/html'}}))))});self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{if(e.request.mode==='navigate'&&!new URL(e.request.url).pathname.startsWith('/api/'))e.respondWith(caches.open('workbox-precache-legacy-test').then(c=>c.match('/index.html')))})"""
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args): return None
opener=urllib.request.build_opener(NoRedirect)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    context=browser.new_context(service_workers='allow',viewport={'width':1440,'height':1100})
    use_legacy=True
    def route(r):
        if use_legacy and r.request.url == origin+'/api/legacy-test':
            r.fulfill(status=200,headers={'Content-Type':'text/html'},body='<!doctype html><title>Legacy cache test</title>');return
        if use_legacy and r.request.url == origin+'/sw.js':
            r.fulfill(status=200,headers={'Content-Type':'application/javascript','Service-Worker-Allowed':'/'},body=legacy_worker);return
        req=urllib.request.Request(r.request.url,headers={'OAI-Sites-Authorization':'Bearer '+token,'User-Agent':'Mozilla/5.0','Accept-Encoding':'identity'})
        try: response=opener.open(req,timeout=30)
        except urllib.error.HTTPError as error: response=error
        body=response.read()
        if response.status >= 400: print('Site HTTP',response.status,r.request.url.split('?')[0],body[:400].decode(errors='replace').replace(token,'[redacted]'),flush=True)
        r.fulfill(status=response.status,headers={k:v for k,v in response.headers.items() if k.lower() not in ['content-length','transfer-encoding','set-cookie']},body=body)
    context.route(origin+'/**',route)
    page=context.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(origin+'/customize');page.get_by_role('region',name='Start with a drink').wait_for()
    page.get_by_role('combobox',name='Base',exact=True).select_option('iced-latte')
    page.get_by_role('combobox',name='Milk',exact=True).select_option('2121965')
    page.get_by_role('textbox',name='Order name (optional)').fill('Keep this almond latte')
    page.get_by_role('button',name='Save order',exact=True).click()
    before=page.evaluate("({orders:localStorage.getItem('genie-saved-orders'),last:localStorage.getItem('genie-last-recipe'),draft:sessionStorage.getItem('genie-active-draft')})")
    page.evaluate("navigator.serviceWorker.getRegistrations().then(rs=>Promise.all(rs.map(r=>r.unregister())))")
    page.goto(origin+'/api/legacy-test')
    page.evaluate("navigator.serviceWorker.register('/sw.js', {updateViaCache:'imports'}).then(()=>navigator.serviceWorker.ready)")
    page.wait_for_function('!!navigator.serviceWorker.controller')
    page.goto(origin+'/customize');page.get_by_role('heading',name='Legacy menu').wait_for()
    assert page.get_by_role('region',name='Start with a drink').count()==0
    page.screenshot(path=str(art/'legacy-cache-before.png'))
    # The production recovery page, not the test fixture, performs the migration.
    use_legacy=False
    page.goto(origin+'/api/refresh')
    page.wait_for_url('**/customize?release=menu26-update1',timeout=30000)
    starter=page.get_by_role('region',name='Start with a drink');starter.wait_for()
    assert '26 US drinks' in starter.inner_text()
    assert page.get_by_role('combobox',name='Base',exact=True).locator('option').count()==26
    assert page.get_by_role('combobox',name='Base',exact=True).input_value()=='iced-latte'
    assert page.get_by_role('combobox',name='Milk',exact=True).input_value()=='2121965'
    assert page.get_by_role('textbox',name='Order name (optional)').input_value()=='Keep this almond latte'
    after=page.evaluate("({orders:localStorage.getItem('genie-saved-orders'),last:localStorage.getItem('genie-last-recipe'),draft:sessionStorage.getItem('genie-active-draft')})")
    assert before==after,(before,after)
    assert not page.evaluate("caches.has('workbox-precache-legacy-test')")
    starter.screenshot(path=str(art/'menu-restored-after-cache-recovery.png'))
    page.reload();starter.wait_for()
    assert page.get_by_role('combobox',name='Base',exact=True).input_value()=='iced-latte'
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.get_by_role('combobox',name='Base',exact=True).select_option('cold-brew')
    page.get_by_role('combobox',name='Syrup',exact=True).select_option('111')
    page.locator('.drink-viewport').scroll_into_view_if_needed()
    page.wait_for_function("document.querySelector('.drink-canvas')?.dataset.bottleVisible==='true'")
    assert page.locator('.drink-canvas').get_attribute('data-syrup-flavor')=='111'
    assert not errors,errors
    print(json.dumps({'status':'passed','checks':['real legacy cache reproduced','API recovery bypasses legacy navigation fallback','26 starting drinks restored','saved orders and session draft preserved','reload preserves customized Latte','mobile layout','syrup bottle retained'],'errors':errors}),flush=True)
    context.close();browser.close()
