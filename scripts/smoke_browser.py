from playwright.sync_api import sync_playwright
import json
import os
from pathlib import Path
import shutil
import sys
import termios
import urllib.request
import urllib.error
from urllib.parse import urlparse

BASE_URL = os.getenv('GENIE_PREVIEW_URL', 'http://localhost:4173').rstrip('/')
ARTIFACT_DIR = Path(__file__).resolve().parents[1] / 'artifacts'
ARTIFACT_DIR.mkdir(exist_ok=True)
private_token = None
if '--private-site' in sys.argv:
    settings = termios.tcgetattr(sys.stdin.fileno()); settings[3] &= ~termios.ECHO
    termios.tcsetattr(sys.stdin.fileno(), termios.TCSANOW, settings)
    print('Ready for private Site access JSON on stdin (hidden).', flush=True)
    private_token = json.loads(sys.stdin.readline())['token']
    if urlparse(BASE_URL).hostname != 'starbucks-genie-preview-astrid-20261111.steelyflag.chatgpt.site':
        raise ValueError('Service credential is scoped to the existing private Site')

def set_pumps(page, target):
    current = int(page.get_by_label('Syrup pumps', exact=True).inner_text())
    action = 'Increase' if target > current else 'Decrease'
    for _ in range(abs(target - current)):
        page.get_by_role('button', name=f'{action} syrup pumps', exact=True).click()

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.getenv('BROWSER_PATH') or shutil.which('chromium'), headless=True, args=['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    context = browser.new_context(viewport={'width': 1440, 'height': 1100}, service_workers='block' if private_token else 'allow')
    if private_token:
        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, *args): return None
        verified_http = urllib.request.build_opener(NoRedirect)
        def authorize_site(route):
            # Python uses the managed environment CA bundle. Fulfill with the live
            # HTTPS response rather than disabling Chromium's TLS verification.
            request = urllib.request.Request(route.request.url, method=route.request.method,
                headers={'OAI-Sites-Authorization': 'Bearer ' + private_token,
                         'User-Agent': route.request.headers.get('user-agent', 'Mozilla/5.0'),
                         'Accept-Encoding': 'identity'})
            try: response = verified_http.open(request, timeout=30)
            except urllib.error.HTTPError as error: response = error
            headers = {key: value for key, value in response.headers.items()
                       if key.lower() not in {'content-length', 'transfer-encoding', 'set-cookie'}}
            route.fulfill(status=response.status, headers=headers, body=response.read())
        context.route(BASE_URL + '/**', authorize_site)
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE_URL + '/customize')
    page.get_by_role('heading', name='Your cup, your way.').wait_for()
    starter = page.get_by_role('region', name='Start with a drink')
    starter.get_by_role('searchbox', name='Find a starting drink').fill('latte')
    starter.locator('.starter-card').filter(has_text='Iced Caffè Latte').click()
    assert page.get_by_role('combobox', name='Base', exact=True).input_value() == 'iced-latte'
    assert page.get_by_role('combobox', name='Milk', exact=True).input_value() == '63'
    assert page.get_by_role('combobox', name='Milk amount', exact=True).count() == 0
    assert page.get_by_label('Shots quantity', exact=True).inner_text() == '2'
    assert '130' in page.locator('.nutrition-summary').inner_text()
    assert 'Official standard recipe' in page.locator('.nutrition-summary').inner_text()
    page.get_by_role('combobox', name='Milk', exact=True).select_option('2121965')
    assert 'Estimated total' in page.locator('.nutrition-summary').inner_text()
    page.get_by_role('textbox', name='Order name (optional)').fill('Morning almond latte')
    page.get_by_role('button', name='Save order', exact=True).click()
    page.get_by_role('combobox', name='Base', exact=True).select_option('iced-macchiato')
    assert page.get_by_label('Syrup pumps', exact=True).inner_text() == '3'
    page.get_by_role('combobox', name='Size', exact=True).select_option('Tall')
    assert page.get_by_label('Syrup pumps', exact=True).inner_text() == '2'
    page.get_by_role('textbox', name='Order name (optional)').fill('Afternoon macchiato')
    page.get_by_role('button', name='Save order', exact=True).click()
    page.reload()
    page.get_by_text('Saved orders · 2', exact=True).click()
    page.get_by_role('button', name='Morning almond latte', exact=True).click()
    assert page.get_by_role('combobox', name='Milk', exact=True).input_value() == '2121965'
    assert 'mL' not in page.locator('.order-text').inner_text()
    page.set_viewport_size({'width': 390, 'height': 844})
    page.get_by_role('combobox', name='Base', exact=True).select_option('latte')
    page.get_by_role('combobox', name='Size', exact=True).select_option('Venti')
    assert '20 fl oz' in page.locator('.cup-caption').inner_text()
    assert (page.locator('.drink-canvas').get_attribute('data-ice-count') == '0') if page.locator('.drink-canvas').count() else (page.locator('.natural-ice').count() == 0)
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Hot latte mobile overflow'
    page.screenshot(path=str(ARTIFACT_DIR / 'classic-latte-mobile.png'), full_page=True)
    page.get_by_role('combobox', name='Base', exact=True).select_option('nitro')
    assert page.get_by_role('combobox', name='Size', exact=True).input_value() == 'Grande'
    assert (page.locator('.drink-canvas').get_attribute('data-ice-count') == '0') if page.locator('.drink-canvas').count() else (page.locator('.natural-ice').count() == 0)
    page.get_by_role('combobox', name='Base', exact=True).select_option('cold-brew')
    page.set_viewport_size({'width': 1440, 'height': 1100})
    starter.get_by_role('searchbox', name='Find a starting drink').fill('')
    assert page.get_by_role('combobox', name='Base', exact=True).input_value() == 'cold-brew'
    cup_bounds = []
    for size in ['Tall', 'Grande', 'Venti', 'Trenta']:
        page.get_by_role('combobox', name='Size', exact=True).select_option(size)
        page.wait_for_timeout(500)
        if page.locator('.drink-canvas').count():
            page.locator('.drink-viewport').scroll_into_view_if_needed()
            page.wait_for_timeout(300)
            canvas = page.locator('.drink-canvas')
            cup_bounds.append({'width': float(canvas.get_attribute('data-projected-width')), 'height': float(canvas.get_attribute('data-projected-height'))})
        else:
            cup_bounds.append(page.locator('.cup-size-geometry').bounding_box())
    assert all(a['height'] < b['height'] and a['width'] < b['width'] for a, b in zip(cup_bounds, cup_bounds[1:])), cup_bounds
    page.get_by_role('combobox', name='Size', exact=True).select_option('Grande')
    page.get_by_role('combobox', name='Syrup', exact=True).select_option('111')
    set_pumps(page, 2)
    assert page.get_by_label('Syrup pumps', exact=True).inner_text() == '2'
    page.get_by_role('combobox', name='Milk / creamer', exact=True).select_option('50')
    page.get_by_role('combobox', name='Milk amount', exact=True).select_option('regular')
    assert '1/2 Inch Splash' in page.locator('.order-text').inner_text()
    assert 'mL' not in page.locator('.order-text').inner_text()
    assert '~75' in page.locator('.nutrition-summary').inner_text()
    assert page.get_by_role('img', name='Animated Cold Brew with milk', exact=False).count() == 1
    foam_section = page.get_by_role('region', name='Cold foam options', exact=True)
    foam_section.get_by_role('button', name='Nondairy', exact=True).click()
    assert all('Nondairy' in name for name in page.get_by_role('combobox', name='Cold foam', exact=True).locator('option').all_text_contents()[1:])
    foam_section.get_by_role('button', name='Protein', exact=True).click()
    assert all('Protein' in name for name in page.get_by_role('combobox', name='Cold foam', exact=True).locator('option').all_text_contents()[1:])
    foam_section.get_by_role('button', name='Cold foam', exact=True).click()
    page.get_by_role('combobox', name='Cold foam', exact=True).select_option('2123166')
    assert 'Estimated total' in page.locator('.nutrition-summary').inner_text()
    assert 'Planning range' in page.locator('.nutrition-summary').inner_text()
    page.get_by_role('button', name='Save order', exact=True).click()
    page.get_by_role('button', name='Reset', exact=True).click()
    page.get_by_role('button', name='Load saved', exact=True).click()
    assert page.get_by_role('combobox', name='Cold foam', exact=True).input_value() == '2123166'
    page.get_by_role('button', name='Vanilla, Light', exact=False).click()
    assert '~13' in page.locator('.nutrition-summary').inner_text()
    context.grant_permissions(['clipboard-read', 'clipboard-write'])
    page.get_by_role('button', name='Copy order', exact=True).click()
    assert 'Sugar-Free Vanilla Syrup' in page.evaluate('navigator.clipboard.readText()')
    page.wait_for_timeout(4200)
    page.screenshot(path=str(ARTIFACT_DIR / 'builder-desktop.png'), full_page=True)
    page.set_viewport_size({'width': 390, 'height': 844})
    page.screenshot(path=str(ARTIFACT_DIR / 'builder-mobile.png'), full_page=True)
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Mobile horizontal overflow'
    for path in ('/menu', '/menu/hotcoffee', '/trending', '/menu/refresher/pink-cloud', '/missing'):
        page.goto(BASE_URL + path)
        page.wait_for_load_state('networkidle')
        assert page.locator('main').count() == 1
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Mobile overflow: ' + path
    page.goto(BASE_URL + '/customize')
    if not private_token:
        page.evaluate('navigator.serviceWorker.ready')
        page.reload()
        page.get_by_role('heading', name='Your cup, your way.').wait_for()
        context.set_offline(True)
        page.goto(BASE_URL + '/customize')
        page.get_by_role('heading', name='Your cup, your way.').wait_for()
        page.get_by_role('combobox', name='Base', exact=True).select_option('americano')
        assert '15' in page.locator('.nutrition-summary').inner_text()
        context.set_offline(False)
    page.get_by_text('Try a verified cold foam recipe', exact=True).click()
    page.get_by_role('button', name='Chocolate Cream Cold Brew', exact=False).click()
    assert '240' in page.locator('.nutrition-summary').inner_text()
    assert 'Official matched recipe' in page.locator('.nutrition-summary').inner_text()
    assert page.get_by_role('link', name='Open Starbucks menu').get_attribute('href') == 'https://www.starbucks.com/menu/product/2123644/iced'
    set_pumps(page, 1)
    assert 'Estimated total' in page.locator('.nutrition-summary').inner_text()
    assert 'Planning range' in page.locator('.nutrition-summary').inner_text()
    set_pumps(page, 2)
    page.screenshot(path=str(ARTIFACT_DIR / 'builder-official-foam.png'), full_page=True)
    page.get_by_text('Ingredient calorie guide', exact=False).click()
    page.get_by_role('searchbox', name='Find an ingredient').fill('pistachio')
    assert page.locator('.library-table tbody tr').count() > 0
    assert page.locator('.library-table tbody').inner_text().count('low confidence') > 0
    with page.expect_download() as download:
        page.get_by_role('button', name='Download estimate table').click()
    download.value.save_as(str(ARTIFACT_DIR / 'ingredient-estimates.csv'))
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Ingredient guide mobile overflow'
    page.get_by_role('button', name='Reset', exact=True).click()
    page.locator('.mobile-build-bar').get_by_role('button', name='Add extras', exact=False).click()
    extras = page.get_by_role('region', name='Extra customizations', exact=True)
    extras.get_by_role('button', name='Add Mocha Sauce', exact=True).click()
    extras.get_by_role('button', name='Increase Mocha Sauce', exact=True).click()
    extras.get_by_role('button', name='Syrups', exact=True).click()
    extras.get_by_role('button', name='Add Hazelnut Syrup', exact=True).click()
    extras.get_by_role('button', name='Increase Hazelnut Syrup', exact=True).click()
    assert extras.get_by_label('Hazelnut Syrup quantity', exact=True).inner_text() == '2'
    extras.get_by_role('button', name='Remove Hazelnut Syrup', exact=True).click()
    extras.get_by_role('button', name='Toppings', exact=True).click()
    assert extras.get_by_role('button', name='Add Caramel Drizzle', exact=True).count() == 0
    extras.get_by_role('button', name='Drizzle', exact=True).click()
    assert extras.get_by_role('button', name='Add Cookie Crumble Topping', exact=True).count() == 0
    assert extras.get_by_role('button', name='Add Caramel Drizzle', exact=True).count() == 1
    extras.get_by_role('button', name='Add Caramel Drizzle', exact=True).click()
    extras.get_by_role('button', name='Amount for Caramel Drizzle', exact=True).click()
    extras.get_by_role('group', name='Portion for Caramel Drizzle', exact=True).get_by_role('button', name='extra', exact=True).click()
    assert 'Extra Caramel Drizzle' in page.locator('.order-text').inner_text()
    extras.get_by_role('button', name='Toppings', exact=True).click()
    extras.get_by_role('button', name='Add Cookie Crumble Topping', exact=True).click()
    assert (int(page.locator('.drink-canvas').get_attribute('data-toppings')) > 0) if page.locator('.drink-canvas').count() else (page.locator('.topping-dot').count() > 0)
    assert '2 × Mocha Sauce' in page.locator('.order-text').inner_text()
    page.get_by_role('button', name='Done choosing extras', exact=True).click()
    page.get_by_role('button', name='Save order', exact=True).click()
    page.get_by_role('button', name='Reset', exact=True).click()
    page.get_by_role('button', name='Load saved', exact=True).click()
    page.locator('.mobile-build-bar').get_by_role('button', name='Add extras', exact=False).click()
    extras.get_by_role('searchbox', name='Search extra ingredients').fill('mocha')
    assert extras.get_by_label('Mocha Sauce quantity', exact=True).inner_text() == '2'
    extras.get_by_role('button', name='Clear ingredient search', exact=True).click()
    extras.get_by_role('button', name='All', exact=True).click()
    page.get_by_role('button', name='Done choosing extras', exact=True).click()
    page.set_viewport_size({'width': 1440, 'height': 1100})
    page.wait_for_timeout(1200)
    extras.screenshot(path=str(ARTIFACT_DIR / 'ingredient-picker-redesign.png'))
    page.set_viewport_size({'width': 390, 'height': 844})
    page.get_by_role('combobox', name='Base', exact=True).select_option('green-tea')
    assert extras.get_by_role('button', name='Increase Mocha Sauce', exact=True).count() == 0
    assert 'Mocha Sauce' not in page.locator('.order-text').inner_text()
    page.locator('.mobile-build-bar').get_by_role('button', name='Add extras', exact=False).click()
    extras.get_by_role('searchbox', name='Search extra ingredients').fill('dragonfruit')
    extras.get_by_role('button', name='Add Dragonfruit Fruit Inclusions', exact=True).click()
    assert (int(page.locator('.drink-canvas').get_attribute('data-fruit')) > 0) if page.locator('.drink-canvas').count() else (page.locator('.mix-in').count() > 0)
    extras.get_by_role('searchbox', name='Search extra ingredients').fill('pearls')
    add_pearls = extras.get_by_role('button', name='Add Pomegranate Pearls', exact=True)
    add_pearls.focus()
    add_pearls.press('Enter')
    increase_pearls = extras.get_by_role('button', name='Increase Pomegranate Pearls', exact=True)
    assert increase_pearls.evaluate('(el) => el === document.activeElement'), 'Keyboard focus lost after adding'
    increase_pearls.press('Space')
    assert extras.get_by_label('Pomegranate Pearls quantity', exact=True).inner_text() == '2'
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Extras mobile overflow'
    assert increase_pearls.bounding_box()['width'] >= 44
    assert increase_pearls.bounding_box()['height'] >= 44
    assert extras.get_by_role('searchbox').evaluate('(el)=>getComputedStyle(el).fontSize') == '16px'
    assert page.evaluate('document.body.style.overflow') == 'hidden'
    page.screenshot(path=str(ARTIFACT_DIR / 'mobile-extras-sheet.png'))
    page.set_viewport_size({'width': 390, 'height': 500})
    done = page.get_by_role('button', name='Done choosing extras', exact=True)
    assert done.bounding_box()['y'] + done.bounding_box()['height'] <= 500
    page.set_viewport_size({'width': 390, 'height': 844})
    page.keyboard.press('Escape')
    assert page.get_by_role('dialog').count() == 0
    assert page.evaluate('document.body.style.overflow') != 'hidden'
    page.locator('.mobile-build-bar').get_by_role('button', name='View recipe', exact=True).click()
    assert page.get_by_role('region', name='Your recipe', exact=True).evaluate('(el)=>el===document.activeElement')
    page.wait_for_function("document.querySelector('.recipe-panel').getBoundingClientRect().top >= 0 && document.querySelector('.recipe-panel').getBoundingClientRect().top < 300")
    bar = page.locator('.mobile-build-bar').bounding_box()
    assert bar['y'] + bar['height'] <= 844
    page.screenshot(path=str(ARTIFACT_DIR / 'mobile-recipe-actions.png'))
    page.set_viewport_size({'width': 320, 'height': 568})
    if not page.evaluate('document.documentElement.scrollWidth <= innerWidth'):
        print('Overflow details:', json.dumps(page.evaluate("""() => ({width:innerWidth, scroll:document.documentElement.scrollWidth, offenders:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+1}).map(e=>({tag:e.tagName,class:typeof e.className==='string'?e.className:e.tagName,text:e.textContent.slice(0,75),right:e.getBoundingClientRect().right})).slice(-25)})""")), flush=True)
        page.screenshot(path=str(ARTIFACT_DIR / 'overflow-320.png'), full_page=True)
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), '320px viewport overflow'
    page.locator('.mobile-build-bar').get_by_role('button', name='Add extras', exact=False).click()
    assert page.get_by_role('dialog', name='Make it extra', exact=True).count() == 1
    assert page.get_by_role('button', name='Done choosing extras').bounding_box()['x'] >= 0
    page.get_by_role('button', name='Done choosing extras').click()
    page.evaluate("localStorage.setItem('genie-last-recipe', JSON.stringify({base:'cold-brew',size:'Grande',syrup:'111',pumps:2.5,milk:'',milkMl:30,foam:'',foamPortion:'regular',extras:{'96':1.5}}))")
    page.get_by_role('button', name='Load saved', exact=True).click()
    assert page.get_by_label('Syrup pumps', exact=True).inner_text() == '3'
    assert '2 × Hazelnut Syrup' in page.locator('.order-text').inner_text()
    assert page.get_by_text('Saved syrup amounts rounded to whole pumps. Review before saving.', exact=True).count() == 1
    assert not errors, errors
    print(json.dumps({'status': 'passed', 'checks': ['classic drink starter search', 'official default recipe without double counting', 'milk substitution', 'multiple named saved orders survive reload', 'hot cup capacity and no ice', 'size-specific standard pumps', 'ingredient calorie scaling', 'foam estimation range', 'save/reset/load', 'copy order', 'fitness preset', 'responsive layout', 'menu routes', 'deep-link recipes', '404', *(['offline builder'] if not private_token else []), 'official foam recipe match and invalidation', 'Starbucks product link', 'one-click add and in-place steppers', 'search across categories', 'keyboard focus preserved', 'multiple add-ins and quantities', 'saved add-ins', 'base compatibility cleanup', 'topping and fruit animation', 'mobile bottom sheet', '44px touch targets', 'short viewport footer visibility', 'body scroll lock and Escape restore', 'fixed calorie and recipe bar', 'independent topping and drizzle categories', 'separate foam types', 'whole syrup pumps and legacy saved recipe recovery'], 'pageErrors': errors}))
    browser.close()
