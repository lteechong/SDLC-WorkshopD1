const { resolve, sep } = require("node:path");
const { stat } = require("node:fs/promises");

const port = Number(process.env.PORT || 3000);
const links = new Map();
const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const publicDir = process.env.PUBLIC_DIR ? resolve(process.env.PUBLIC_DIR) : null;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

function getBaseUrl() {
  if (process.env.BASE_URL) {
    return new URL(process.env.BASE_URL).origin;
  }

  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    const domain = process.env.RAILWAY_PUBLIC_DOMAIN;
    return new URL(domain.includes("://") ? domain : `https://${domain}`).origin;
  }

  return `http://localhost:${port}`;
}

const baseUrl = getBaseUrl();

function corsHeaders(extra = {}) {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "Content-Type",
    ...extra,
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders({ "content-type": "application/json; charset=utf-8" }),
  });
}

function createCode() {
  const bytes = new Uint8Array(6);
  let code = "";

  while (code.length < 6) {
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte < 248) {
        code += alphabet[byte % alphabet.length];
        if (code.length === 6) break;
      }
    }
  }

  return code;
}

async function serveStatic(pathname) {
  if (!publicDir) return null;

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  if (decodedPath.includes("\0")) return null;

  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^[/\\]+/, "");
  const filePath = resolve(publicDir, relativePath);
  if (filePath !== publicDir && !filePath.startsWith(`${publicDir}${sep}`)) return null;

  try {
    const fileInfo = await stat(filePath);
    if (!fileInfo.isFile()) return null;
  } catch {
    return null;
  }

  const file = Bun.file(filePath);
  return new Response(file, {
    headers: corsHeaders({ "content-type": file.type || "application/octet-stream" }),
  });
}

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method === "POST" && url.pathname === "/api/links") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }

      if (!body || typeof body.url !== "string") {
        return json({ error: "A URL is required" }, 400);
      }

      let parsedUrl;
      try {
        parsedUrl = new URL(body.url);
      } catch {
        return json({ error: "Invalid URL" }, 400);
      }

      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return json({ error: "URL must use http or https" }, 400);
      }

      const originalUrl = parsedUrl.href;

      let code;
      do {
        code = createCode();
      } while (links.has(code));

      const link = {
        code,
        url: originalUrl,
        shortUrl: `${baseUrl}/${code}`,
        hits: 0,
        createdAt: new Date().toISOString(),
      };
      links.set(code, link);
      return json(link, 201);
    }

    if (request.method === "GET" && url.pathname === "/api/links") {
      return json(Array.from(links.values()));
    }

    if (request.method === "GET") {
      const staticResponse = await serveStatic(url.pathname);
      if (staticResponse) return staticResponse;

      const code = url.pathname.startsWith("/") ? url.pathname.slice(1) : "";
      if (code && !code.includes("/")) {
        const link = links.get(code);
        if (link) {
          link.hits += 1;
          return new Response(null, {
            status: 302,
            headers: corsHeaders({ location: link.url }),
          });
        }
      }
    }

    return json({ error: "Not found" }, 404);
  },
});

console.log(`Snip backend listening on http://localhost:${port}`);
