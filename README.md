# Starbucks Genie

A mobile-friendly US drink builder with an animated cup, sourced ingredient options, explicit calorie estimates, and low calorie starting recipes. Independent community project, not affiliated with Starbucks.

## Run the core product

Node 22.12+ (Node 24 recommended):

```sh
cd shop
npm ci
npm run dev
```

Open http://localhost:3000/customize. No database or AI key is needed for the ingredient builder, animation, local save, copy, or starter menu.

```sh
npm test
npm run build
npm run preview
```

The production output is `shop/dist`. Cloudflare Pages: project root `shop`, build command `npm ci && npm run build`, output `dist`. SPA routes fall back to `index.html` (do not add a top-level `404.html`). HTTPS enables clipboard and PWA capabilities.

## Menu and nutrition

```sh
python scripts/sync_starbucks_menu.py
python -m unittest discover -s tests -p 'test_menu_sync.py'
```

The US menu snapshot is in `shop/src/data/starbucks-us.json`, with fetch time, sources, official base nutrition, and option availability. It is not a live store inventory feed. The scheduled refresh workflow proposes an update PR; it does not silently deploy unreviewed menu data. A failed fetch preserves the last successful snapshot.

Three standard cold foam drinks are also captured by size. An exact match (including default vanilla pumps and regular foam) uses the official whole-drink nutrition; changing any recipe component removes that match. Modifier calorie labels are often missing from the public menu. The current guide models food / water / ice and milk entries, and separates preparation settings. Search or export the guide in the builder. Assumed portions, energy ranges, methods and references live in `shop/src/data/ingredient-estimates.ts`. These are planning scenarios, not measured error bounds. The UI distinguishes official base nutrition, explicit planning estimates, and unknown values. `known + ?` is an incomplete total. Full-pump, splash, and whole-drink milk substitution assumptions are explicit; unfamiliar new categories receive no silent estimate and must pass the coverage checks. Raw official option records still preserve missing modifier labels as null. Low calorie recipes are not presented as high protein meals.

## Optional legacy AI service

The AI section is shown in local development or when `VITE_API_URL` is configured. It uses the existing Flask service. This is optional and not required for the free static deployment. Do not publicly enable the legacy unauthenticated paid AI endpoint without adding abuse protection and a budget. A lightweight, protected Pages Function is the planned replacement; see the architecture decision.

```sh
python -m venv .venv
.venv/bin/pip install -r starbucks_genie/requirements.txt
cp starbucks_genie/.env.example starbucks_genie/.env
# Set OPENAI_API_KEY in that local .env; never commit it.
cd starbucks_genie
../.venv/bin/python -m src.starbucks_genie.api
```

Vite proxies `/api` to port 3001 locally. For a separately hosted service, use `VITE_API_URL` in `shop/.env.local`. If running Gunicorn, keep **one worker** because legacy job state is process-local. The API returns a clear 503 when AI credentials are absent. No real AI request was made during validation without credentials.

Backend contract tests can run without CrewAI or an OpenAI key:

```sh
.venv/bin/pip install Flask==3.1.0 flask-cors==5.0.0 python-dotenv==1.0.1
.venv/bin/python -m unittest discover -s tests -v
```

## Browser acceptance

With a production preview running on port 4173 and Python Playwright installed:

```sh
python scripts/smoke_browser.py
```

The script uses system Chromium when available (or `BROWSER_PATH`), checks desktop/mobile interaction and offline navigation, and writes screenshots under ignored `artifacts/`. Set `GENIE_PREVIEW_URL` to test another preview origin.

## Database and launch decisions

[技术栈、Web/PWA、数据库与部署方案](docs/architecture.md) documents the free-first stack, costs, menu limitations, and launch sequence. The optional Supabase schema is in `supabase/migrations/202611110001_catalog.sql`; it has not been applied to any database. Current recipe saving is browser-local. The sample community menu is bundled; an existing `menuitems` database can still be configured with the variables in `shop/.env.example`.

### Starbucks ordering settings

US Starbucks ordering data is the source for customization categories, size labels, control types, available portions, and integer quantity limits. Do not invent new customer-facing measurement units or combine topping, drizzle, sauce, and cold foam categories. Added milk in black coffee uses official 1/4, 1/2, and 3/4 Inch Splash choices; milk-based drinks use the official Milk Options replacement choices; mL values are internal estimation assumptions only. Qualitative add-ins use source-supported Light/Regular/Extra options; quantity add-ins use integer counts up to the sourced maximum (currently 12). Keep estimated nutrition visibly separate from official whole-drink labels. The cup illustration scales with the selected iced cup capacity.


The starter picker includes 26 US hot / iced classics: Latte, Mocha, White Mocha, Caramel Macchiato, Flat White, Cappuccino, Chai, Matcha, Shaken Espresso, Nitro, teas and two Refreshers alongside the original bases. Each size records the official default recipe. Untouched drinks use the official total; customization estimates apply only the difference from that recipe, including removal of defaults. Size changes update untouched standard counts while preserving deliberate overrides. Named saved orders persist on the current device, with loading and removal. Opening the official Starbucks product page does not import the recipe or save a Starbucks favorite; copy the order and apply it manually.
