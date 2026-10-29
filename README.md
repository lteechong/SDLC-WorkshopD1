# Snip Backend

A zero-dependency Bun server for the Snip URL shortener. Links are stored in memory and are cleared when the server restarts.

## Run

```sh
bun start
```

The server listens on port `3000` by default. Set `PORT` to change it. `BASE_URL` controls the origin in generated short links; otherwise the server uses `https://$RAILWAY_PUBLIC_DOMAIN` when set, then `http://localhost:$PORT`.

Set `PUBLIC_DIR` to serve static files from a directory. `/` serves `index.html`; existing files take precedence over short codes with the same path.

## API

- `POST /api/links` with `{ "url": "https://example.com" }` creates a link and returns `201` with `{ code, url, shortUrl, hits, createdAt }`. Invalid JSON or non-HTTP(S) URLs return `400`.
- `GET /api/links` returns all links.
- `GET /:code` redirects to the original URL with `302` and increments its hit count; unknown codes return `404`.

All responses support cross-origin browser requests, including `OPTIONS` preflight.
