# Cloudflare Worker: Acquisition Notice + Timed Redirect

This Worker shows an acquisition notice on `converterwebptojpg.com` for a short transition period and then automatically switches to a 301 redirect to `heic-to-jpg.io`, preserving path and query.

## Files
- `acquisition-worker/src/worker.ts` – Worker code
- `acquisition-worker/wrangler.toml` – Wrangler config (fill in IDs)
- `acquisition-worker/package.json` – Scripts (`dev`, `deploy`)

## Prerequisites
- Cloudflare account & zone for `converterwebptojpg.com`
- API Token with `Workers Scripts: Edit`, `Workers KV: Edit` (not needed here), and `Zone: Edit`
- `npm i -g wrangler` (or use local devDependency)

## Setup
1. Edit `cloudflare/acquisition-worker/wrangler.toml`:
   - `account_id = "YOUR_ACCOUNT_ID"`
   - Replace `YOUR_ZONE_ID` with your zone ID
   - Keep both routes for apex and www
2. In the Worker code, adjust the cutoff date if needed:
   ```ts
   const CUTOFF = new Date('2025-09-09T00:00:00Z')
   ```

## Deploy
```bash
cd cloudflare/acquisition-worker
npm install
npx wrangler login  # opens browser to authorize
npm run deploy
```

## DNS
- In Cloudflare DNS, ensure both hosts resolve via Workers (orange-cloud proxy on):
  - `A @` → any placeholder (e.g., 192.0.2.1) proxy ON
  - `CNAME www` → `@` proxy ON

## Verify
- Before cutoff: visiting `converterwebptojpg.com/path?x=1` returns a 200 notice with a canonical tag to `https://heic-to-jpg.io/path?x=1`
- After cutoff: same URL returns `301` to `https://heic-to-jpg.io/path?x=1`

## Search Console
- Verify both domains
- Keep only `heic-to-jpg.io/sitemap.xml` submitted
- Submit a Change of Address after the 301 phase begins 