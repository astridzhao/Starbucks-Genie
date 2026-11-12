import json,sys,termios,urllib.request,urllib.error,time
from pathlib import Path
from playwright.sync_api import sync_playwright
settings=termios.tcgetattr(sys.stdin.fileno());settings[3]&=~termios.ECHO;termios.tcsetattr(sys.stdin.fileno(),termios.TCSANOW,settings)
print('Ready for private access (hidden).',flush=True);token=json.loads(sys.stdin.readline())['token']
origin='https://starbucks-genie-preview-astrid-20261111.steelyflag.chatgpt.site'
art=Path(__file__).resolve().parents[1] / 'artifacts';art.mkdir(exist_ok=True)
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args):return None
opener=urllib.request.build_opener(NoRedirect)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
 context=browser.new_context(viewport={'width':1440,'height':1100},service_workers='block',record_video_dir=str(art/'3d-video'),record_video_size={'width':1440,'height':1100})
 def route(r):
  req=urllib.request.Request(r.request.url,headers={'OAI-Sites-Authorization':'Bearer '+token,'User-Agent':'Mozilla/5.0','Accept-Encoding':'identity'})
  try:res=opener.open(req,timeout=30)
  except urllib.error.HTTPError as e:res=e
  r.fulfill(status=res.status,headers={k:v for k,v in res.headers.items() if k.lower() not in ['content-length','transfer-encoding','set-cookie']},body=res.read())
 context.route(origin+'/**',route);page=context.new_page();errors=[];console=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda msg:console.append(msg.text) if msg.type=='error' else None)
 page.goto(origin+'/customize');page.get_by_role('heading',name='Your cup, your way.').wait_for()
 stage=page.locator('.drink-viewport');stage.scroll_into_view_if_needed()
 try:page.wait_for_function("document.querySelector('.drink-canvas')?.dataset.renderer==='webgl'",timeout=30000)
 except:
  print(json.dumps({'errors':errors,'console':console}),flush=True);raise
 canvas=page.locator('.drink-canvas')
 page.wait_for_function("document.querySelector('.drink-canvas')?.dataset.settled==='true'")
 stage.screenshot(path=str(art/'3d-black.png'))
 count=canvas.get_attribute('data-frame-count');page.wait_for_timeout(600);assert canvas.get_attribute('data-frame-count')==count,'Renderer did not stop while idle'
 page.get_by_role('combobox',name='Syrup',exact=True).select_option('111');stage.scroll_into_view_if_needed()
 page.wait_for_function("document.querySelector('.drink-canvas')?.dataset.bottleVisible==='true'")
 assert canvas.get_attribute('data-syrup-flavor')=='111'
 page.wait_for_function("Number(document.querySelector('.drink-canvas').dataset.maxPumpTravel)<-.015")
 stage.screenshot(path=str(art/'syrup-vanilla-press.png'))
 page.wait_for_function("document.querySelector('.drink-canvas').dataset.settled==='true'")
 stage.screenshot(path=str(art/'syrup-vanilla-idle.png'))
 page.get_by_role('button',name='Increase syrup pumps',exact=True).click()
 page.get_by_role('button',name='Increase syrup pumps',exact=True).click()
 stage.scroll_into_view_if_needed()
 assert canvas.get_attribute('data-pump-count')=='2'
 page.wait_for_function("document.querySelector('.drink-canvas').dataset.pumpIndex==='2'")
 stage.screenshot(path=str(art/'syrup-second-pump.png'))
 page.wait_for_function("document.querySelector('.drink-canvas').dataset.settled==='true'")
 page.get_by_role('button',name='Replay syrup animation',exact=True).click();stage.scroll_into_view_if_needed()
 assert canvas.get_attribute('data-pump-count')=='3'
 page.wait_for_function("document.querySelector('.drink-canvas').dataset.pumpIndex==='3'")
 page.get_by_role('combobox',name='Syrup',exact=True).select_option('96');stage.scroll_into_view_if_needed()
 page.wait_for_function("document.querySelector('.drink-canvas').dataset.syrupFlavor==='96'")
 stage.screenshot(path=str(art/'syrup-hazelnut.png'))
 page.get_by_role('combobox',name='Syrup',exact=True).select_option('');stage.scroll_into_view_if_needed()
 page.wait_for_function("document.querySelector('.drink-canvas').dataset.bottleVisible==='false'")
 page.get_by_role('combobox',name='Milk / creamer',exact=True).select_option('50');stage.scroll_into_view_if_needed();page.wait_for_timeout(450)
 stage.screenshot(path=str(art/'3d-milk-pour.png'));page.wait_for_timeout(1100);stage.screenshot(path=str(art/'3d-milk-cloud.png'));page.wait_for_function("document.querySelector('.drink-canvas').dataset.settled==='true'");stage.screenshot(path=str(art/'3d-milk-settled.png'))
 page.get_by_role('combobox',name='Cold foam',exact=True).select_option('2123166');stage.scroll_into_view_if_needed();page.wait_for_timeout(1100);stage.screenshot(path=str(art/'3d-foam.png'))
 page.get_by_role('button',name='Mix drink',exact=True).click();page.wait_for_timeout(500);stage.screenshot(path=str(art/'3d-mixing.png'));page.wait_for_timeout(3000);stage.screenshot(path=str(art/'3d-mixed.png'))
 bounds=[]
 for size in ['Tall','Grande','Venti','Trenta']:
  page.get_by_role('combobox',name='Size',exact=True).select_option(size);stage.scroll_into_view_if_needed();page.wait_for_timeout(700)
  bounds.append([float(canvas.get_attribute('data-projected-width')),float(canvas.get_attribute('data-projected-height'))])
 assert all(a[0]<b[0] and a[1]<b[1] for a,b in zip(bounds,bounds[1:])),bounds
 page.get_by_role('combobox',name='Base',exact=True).select_option('iced-latte');stage.scroll_into_view_if_needed();page.wait_for_timeout(1000);stage.screenshot(path=str(art/'3d-latte.png'))
 page.get_by_role('combobox',name='Base',exact=True).select_option('latte');stage.scroll_into_view_if_needed();page.wait_for_timeout(1000);stage.screenshot(path=str(art/'3d-hot.png'));assert canvas.get_attribute('data-ice-count')=='0'
 page.set_viewport_size({'width':390,'height':844});page.get_by_role('combobox',name='Base',exact=True).select_option('cold-brew');page.get_by_role('combobox',name='Milk / creamer',exact=True).select_option('50');stage.scroll_into_view_if_needed();page.wait_for_timeout(1800);page.locator('.preview-panel').screenshot(path=str(art/'3d-mobile.png'))
 assert stage.bounding_box()['height']>=200
 page.get_by_role('button',name='Enlarge cup',exact=True).click();page.wait_for_timeout(350)
 assert stage.bounding_box()['height']>=330
 page.locator('.preview-panel').screenshot(path=str(art/'3d-mobile-expanded.png'))
 page.get_by_role('button',name='Compact cup',exact=True).click()
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.emulate_media(reduced_motion='reduce');page.get_by_role('button',name='Mix drink',exact=True).click();page.wait_for_timeout(300)
 page.set_viewport_size({'width':320,'height':568});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 print(json.dumps({'status':'passed','bounds':bounds,'errors':errors,'console':console,'frames':canvas.get_attribute('data-frame-count')}),flush=True)
 assert not errors,errors
 context.close();browser.close()
