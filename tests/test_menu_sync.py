import importlib.util
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('menu_sync', ROOT / 'scripts/sync_starbucks_menu.py')
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class MenuSyncTests(unittest.TestCase):
    def test_official_modifier_maximum_is_parsed_and_validated(self):
        settings = sync.parse_ordering_settings('window.__BOOTSTRAP = {"config":{"maximumModifierAmount":12}};')
        self.assertEqual(settings['maximumModifierAmount'], 12)
        with self.assertRaises(ValueError):
            sync.parse_ordering_settings('window.__BOOTSTRAP = {"config":{"maximumModifierAmount":true}};')

    def test_snapshot_has_official_size_nutrition_and_missing_modifier_nutrition(self):
        data = json.loads((ROOT / 'shop/src/data/starbucks-us.json').read_text())
        self.assertEqual(data['region'], 'US')
        self.assertEqual(len(data['bases']), len(sync.BASES))
        self.assertTrue({'iced-latte', 'latte', 'iced-mocha', 'iced-matcha', 'pink-drink'}.issubset({base['id'] for base in data['bases']}))
        for base in data['bases']:
            self.assertTrue(base['source'].startswith('https://www.starbucks.com/menu/product/'))
            self.assertTrue(all(size['nutrition']['calories'] is not None for size in base['sizes']))
        for option in data['options']:
            self.assertIsNone(option['calories'])
            self.assertIsNone(option['ingredients'])
            self.assertTrue(option['compatibleBases'])

    def test_failed_fetch_preserves_last_successful_snapshot(self):
        with TemporaryDirectory() as folder:
            output = Path(folder) / 'snapshot.json'
            output.write_text('last successful data')
            with patch.object(sync, 'build_snapshot', side_effect=ValueError('schema changed')), patch('sys.argv', ['sync', '--output', str(output)]):
                with self.assertRaises(ValueError): sync.main()
            self.assertEqual(output.read_text(), 'last successful data')

    def test_options_keep_portion_ids_but_do_not_invent_ingredient_lists(self):
        nodes = [{'name': 'Syrups', 'attributes': {'unitOfMeasure': 'pump(s)'}, 'children': [], 'products': [
            {'productNumber': 111, 'form': {'name': 'Vanilla Syrup', 'formCode': 'qty', 'availability': 'Available', 'sizes': [{'sku': '123', 'sizeCode': 'add'}]}}
        ]}]
        option = sync.flatten_options(nodes)[0]
        self.assertEqual(option['id'], '111')
        self.assertEqual(option['unit'], 'pump(s)')
        self.assertEqual(option['portions'][0]['sku'], '123')
        self.assertIsNone(option['ingredients'])

    def test_schema_changes_fail_before_publishing(self):
        with self.assertRaises(ValueError):
            sync.build_snapshot(fetch=lambda url: {'menus': []})


class OfficialFoamRecipeTests(unittest.TestCase):
    def product_response(self, url, extra=False):
        number = int(url.split('/')[-2])
        foam = dict(sync.FOAM_PRODUCTS)[number]
        modifiers = [
            {'productOption': {'productNumber': 41}, 'quantity': 0, 'sizeCode': 'regular'},
            {'productOption': {'productNumber': 111}, 'quantity': 2, 'sizeCode': 'add'},
            {'productOption': {'productNumber': int(foam)}, 'quantity': 0, 'sizeCode': 'regular'},
        ]
        if extra:
            modifiers.append({'productOption': {'productNumber': 999}, 'quantity': 1, 'sizeCode': 'regular'})
        return {'products': [{'productNumber': number, 'name': 'Test foam drink', 'sizes': [{
            'name': 'Grande', 'recipe': {'default': modifiers},
            'nutrition': {'calories': {'displayValue': 240}}, 'ingredients': [],
        }]}]}

    def test_records_whole_drink_and_explicit_syrup_instead_of_inventing_foam_calories(self):
        recipes = sync.official_foam_recipes(self.product_response)
        self.assertEqual(len(recipes), 3)
        self.assertEqual(recipes[0]['build']['pumps'], 2)
        self.assertEqual(recipes[0]['nutrition']['calories'], 240)
        self.assertNotIn('foam_calories', recipes[0])

    def test_unmodeled_recipe_addition_fails_closed(self):
        with self.assertRaises(ValueError):
            sync.official_foam_recipes(lambda url: self.product_response(url, extra=True))
