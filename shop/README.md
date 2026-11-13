# Frontend

React + TypeScript + Vite. See the [project README](../README.md) for setup, nutrition assumptions, Cloudflare deployment, and the architecture decision.

- `npm ci`
- `npm run dev` — port 3000
- `npm test` — regression tests
- `npm run build` — typecheck and production bundle in `dist`
- `npm run preview` — production preview

Copy `.env.example` to `.env.local` only if using optional services. All `VITE_*` values are public browser configuration. Never place an AI key or Supabase service-role key there.

## Vercel deployment

The app builds with Vite to `dist`, rather than CRA's `build` directory. The
checked-in `vercel.json` overrides the old framework, install/build commands,
and output directory. It also routes app deep links and the cache-recovery page
without rewriting asset requests or optional API endpoints.

Both Vercel project-root layouts are supported:

| Root Directory | Configuration | Output Directory |
| --- | --- | --- |
| `shop` (recommended) | `shop/vercel.json` | `dist` |
| Repository root | `../vercel.json` | `shop/dist` |

Use Node.js 24.x in Vercel Project Settings. A new Git deployment reads the
configuration automatically. Redeploy the latest commit, rather than retrying an
older commit that lacks these files. If the logs still mention `build`, confirm
the deployment's commit and Root Directory.
