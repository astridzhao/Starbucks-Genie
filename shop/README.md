# Frontend

React + TypeScript + Vite. See the [project README](../README.md) for setup, nutrition assumptions, Cloudflare deployment, and the architecture decision.

- `npm ci`
- `npm run dev` — port 3000
- `npm test` — regression tests
- `npm run build` — typecheck and production bundle in `dist`
- `npm run preview` — production preview

Copy `.env.example` to `.env.local` only if using optional services. All `VITE_*` values are public browser configuration. Never place an AI key or Supabase service-role key there.
