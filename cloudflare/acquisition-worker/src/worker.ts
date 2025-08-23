const CUTOFF = new Date('2025-09-09T00:00:00Z') // adjust date as needed
const TARGET_HOST = 'heic-to-jpg.io'

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const target = new URL(url.pathname + url.search, 'https://' + TARGET_HOST)

    if (new Date() < CUTOFF) {
      const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<link rel="canonical" href="${target.href}" />
<title>converterwebptojpg.com is now part of HEIC-to-JPG</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#fff}
  .box{max-width:720px;padding:24px 28px;border-radius:12px;background:#1e293b;box-shadow:0 10px 30px rgba(0,0,0,.3)}
  a{color:#93c5fd;text-decoration:underline}
</style>
</head>
<body>
  <div class="box">
    <h1>We’ve joined HEIC-to-JPG</h1>
    <p>The domain <strong>converterwebptojpg.com</strong> is now part of <a href="https://heic-to-jpg.io">heic-to-jpg.io</a>.</p>
    <p>We’ll keep this notice live for a short transition period. You can continue using our free converter and API here:</p>
    <p><a href="${target.href}">${target.href}</a></p>
  </div>
</body>
</html>`
      return new Response(html, {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=UTF-8',
          'cache-control': 'no-store, max-age=0',
        },
      })
    }

    return Response.redirect(target.href, 301)
  },
}