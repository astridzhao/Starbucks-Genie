#!/usr/bin/env python3
"""Refresh the US public menu snapshot; never overwrite it after a failed fetch."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import urllib.request

ORIGIN = 'https://www.starbucks.com'
MENU_URL = f'{ORIGIN}/apiproxy/v1/ordering/menu'
# Each starter is a real US menu product and form, not a made-up empty base.
BASES = [('cold-brew', 2121255, 'iced', '#603a28'),
         ('americano', 406, 'iced', '#482c20'),
         ('iced-coffee', 2123863, 'iced', '#744b32'),
         ('green-tea', 459, 'iced', '#c1bb73'),
         ('iced-latte', 407, 'iced', '#b38b68'),
         ('iced-mocha', 408, 'iced', '#79503d'),
         ('iced-white-mocha', 420, 'iced', '#c5a781'),
         ('iced-macchiato', 413, 'iced', '#ac8055'),
         ('iced-flat-white', 565, 'iced', '#b8906e'),
         ('shaken-espresso', 2123425, 'iced', '#9d775c'),
         ('nitro', 2121912, 'iced', '#633e2b'),
         ('iced-chai', 466, 'iced', '#bb9975'),
         ('iced-matcha', 468, 'iced', '#99ab72'),
         ('black-tea', 457, 'iced', '#a97942'),
         ('passion-tea', 461, 'iced', '#bd4160'),
         ('strawberry-acai', 2121342, 'iced', '#d46576'),
         ('pink-drink', 2122275, 'iced', '#dfabb4'),
         ('latte', 407, 'hot', '#b38b68'),
         ('mocha', 408, 'hot', '#79503d'),
         ('white-mocha', 420, 'hot', '#c5a781'),
         ('macchiato', 413, 'hot', '#ac8055'),
         ('flat-white', 565, 'hot', '#b8906e'),
         ('cappuccino', 409, 'hot', '#c4a786'),
         ('hot-americano', 406, 'hot', '#482c20'),
         ('chai', 466, 'hot', '#bb9975'),
         ('matcha', 468, 'hot', '#99ab72')]
EDITABLE_EXTRAS = {'Sauces', 'Liquid Sweeteners', 'Sweetener Packets', 'Powders',
                  'Tea Powders', 'Topping Options', 'Drizzle', 'Line the Cup',
                  'Espresso Shots', 'Whipped Cream', 'Fruit Add-Ins', 'Chai Teas',
                  'Juice Options', 'Starbucks Refreshers Bases', 'Flavored Pearls',
                  'Extra Starbucks Refreshers Bases', 'Lemonade'}


def default_build(base_id, size, options):
    build = {'base': base_id, 'size': size['name'], 'syrup': '', 'pumps': 1,
             'milk': '', 'foam': '', 'foamPortion': 'regular', 'extras': {},
             'extraPortions': {}, 'roast': '', 'shotStyle': ''}
    by_id = {option['id']: option for option in options}
    for modifier in size.get('recipe', {}).get('default', []):
        option_id = str(modifier['productOption']['productNumber'])
        option = by_id.get(option_id)
        if not option or modifier['sizeCode'] == 'no':
            continue
        group = option['group']
        if group in {'Creamer', 'Milk Options'}:
            build['milk'] = option_id
        elif group in {'Syrups', 'Liquid Sweeteners'} and not build['syrup']:
            build['syrup'], build['pumps'] = option_id, modifier['quantity']
        elif 'Cold Foam' in group:
            build['foam'], build['foamPortion'] = option_id, modifier['sizeCode']
        elif group == 'Espresso Roast Options': build['roast'] = option_id
        elif group == 'Ristretto or Long Shot': build['shotStyle'] = option_id
        elif group in EDITABLE_EXTRAS or group == 'Syrups':
            build['extras'][option_id] = modifier['quantity'] if option['formCode'] == 'qty' else 1
            if option['formCode'] == 'modifier': build['extraPortions'][option_id] = modifier['sizeCode']
    return build


FOAM_PRODUCTS = [(2123880, '2123870'), (2123644, '2123643'), (2122795, '2123557')]
OUTPUT = Path(__file__).resolve().parents[1] / 'shop/src/data/starbucks-us.json'


def fetch_json(url):
    request = urllib.request.Request(url, headers={'Accept': 'application/json', 'Accept-Language': 'en-US'})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def flatten_options(nodes):
    options = []
    for node in nodes:
        for product in node.get('products', []):
            form = product['form']
            options.append({
                'id': str(product['productNumber']), 'name': form['name'],
                'group': node['name'], 'formCode': form['formCode'],
                'availability': form.get('availability', 'Unknown'),
                'portions': form.get('sizes', []),
                'unit': node.get('attributes', {}).get('unitOfMeasure'),
                # An option name is not an ingredient declaration or nutrition label.
                'calories': None, 'ingredients': None,
            })
        options.extend(flatten_options(node.get('children', [])))
    return options


def nutrition_values(nutrition):
    values = {'calories': nutrition.get('calories', {}).get('displayValue')}
    for fact in nutrition.get('additionalFacts', []):
        values[fact['id']] = fact.get('value')
        for subfact in fact.get('subfacts', []):
            values[subfact['id']] = subfact.get('value')
    return values



def official_foam_recipes(fetch):
    recipes = []
    for number, foam_id in FOAM_PRODUCTS:
        response = fetch(f'{ORIGIN}/apiproxy/v1/ordering/{number}/iced')
        product = next(p for p in response['products'] if p['productNumber'] == number)
        for size in product['sizes']:
            modifiers = size['recipe']['default']
            by_id = {str(m['productOption']['productNumber']): m for m in modifiers}
            # Accept only a fully understood standard recipe, never infer that
            # a named drink differs from black cold brew by foam alone.
            if set(by_id) != {'41', '111', foam_id}:
                raise ValueError(f'Unrecognized default modifiers for {number}')
            if by_id['41']['sizeCode'] != 'regular' or by_id[foam_id]['sizeCode'] != 'regular':
                raise ValueError(f'Unexpected portion for {number}')
            pumps = by_id['111']['quantity']
            if not isinstance(pumps, int) or not 0 < pumps <= 6:
                raise ValueError(f'Unexpected syrup quantity for {number}')
            nutrition = nutrition_values(size['nutrition'])
            if not isinstance(nutrition['calories'], (int, float)):
                raise ValueError(f'Missing standard recipe nutrition for {number}')
            recipes.append({
                'id': f"{number}-{size['name']}", 'name': product['name'],
                'source': f'{ORIGIN}/menu/product/{number}/iced',
                'build': {'base': 'cold-brew', 'size': size['name'], 'syrup': '111',
                          'pumps': pumps, 'milk': '', 'milkMl': 30,
                          'foam': foam_id, 'foamPortion': 'regular'},
                'nutrition': nutrition, 'ingredients': size.get('ingredients', []),
                'modifiers': [{'productNumber': str(m['productOption']['productNumber']),
                               'quantity': m['quantity'], 'portion': m['sizeCode']}
                              for m in modifiers],
            })
    return recipes


def parse_ordering_settings(html):
    bootstrap = json.JSONDecoder().raw_decode(html.split('window.__BOOTSTRAP =', 1)[1].lstrip())[0]
    maximum = bootstrap['config']['maximumModifierAmount']
    if isinstance(maximum, bool) or not isinstance(maximum, int) or not 1 <= maximum <= 100:
        raise ValueError('Invalid official modifier maximum')
    return {'maximumModifierAmount': maximum, 'source': f'{ORIGIN}/menu',
            'verifiedAt': datetime.now(timezone.utc).date().isoformat()}


def fetch_ordering_settings():
    with urllib.request.urlopen(f'{ORIGIN}/menu', timeout=30) as response:
        return parse_ordering_settings(response.read().decode())


def build_snapshot(fetch=fetch_json):
    menu = fetch(MENU_URL)
    if not isinstance(menu.get('menus'), list) or not menu['menus']:
        raise ValueError('Official menu response has no categories')
    bases, options = [], {}
    for base_id, number, form, color in BASES:
        source = f'{ORIGIN}/menu/product/{number}/{form}'
        response = fetch(f'{ORIGIN}/apiproxy/v1/ordering/{number}/{form}')
        product = next(p for p in response['products'] if p['productNumber'] == number and p['formCode'].lower() == form)
        product_options = flatten_options(product.get('productOptions', []))
        sizes = [{
            'name': size['name'], 'sku': size['sku'],
            'servingSize': size['nutrition'].get('servingSize', {}).get('displayValue', ''),
            'defaultBuild': default_build(base_id, size, product_options),
            'nutrition': nutrition_values(size['nutrition']),
            'ingredients': size.get('ingredients', []),
            'allergens': size.get('allergens', {}),
        } for size in product['sizes']]
        if not sizes or any(not isinstance(s['nutrition']['calories'], (int, float)) for s in sizes):
            raise ValueError(f'Missing calorie values for {base_id}')
        category = 'Refreshers' if base_id in {'strawberry-acai', 'pink-drink'} else 'Tea' if any(word in base_id for word in ['tea', 'chai', 'matcha']) else 'Coffee & espresso'
        bases.append({'id': base_id, 'name': product['name'], 'color': color,
                      'category': category, 'form': form, 'hasIce': form == 'iced' and base_id != 'nitro',
                      'source': source, 'image': product.get('imageURL'), 'sizes': sizes})
        for option in product_options:
            if option['id'] not in options:
                options[option['id']] = {**option, 'source': source, 'compatibleBases': []}
            options[option['id']]['compatibleBases'].append(base_id)
    if not any(o['group'] == 'Syrups' for o in options.values()):
        raise ValueError('No syrups found; the official schema may have changed')
    return {'region': 'US', 'fetchedAt': datetime.now(timezone.utc).isoformat(),
            'source': MENU_URL, 'bases': bases,
            'options': sorted(options.values(), key=lambda option: (option['group'], option['name'])),
            'standardRecipes': official_foam_recipes(fetch),
            'orderingSettings': fetch_ordering_settings()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    args = parser.parse_args()
    snapshot = build_snapshot()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_suffix('.tmp')
    temporary.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(args.output)
    print(f"Saved {len(snapshot['bases'])} bases and {len(snapshot['options'])} options to {args.output}")


if __name__ == '__main__':
    main()
