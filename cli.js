#!/usr/bin/env node
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const runFile = promisify(execFile);
const usage = `Usage:
  snip add <url>    Create a short link
  snip ls           List code, hits, and destination URL
  snip open <code>  Open the destination in your browser
  snip help         Show this help

SNIP_API sets the backend URL (default: http://localhost:3000).
`;

function httpUrl(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid http or https URL.`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${label} must be a valid http or https URL.`);
  }
  return url;
}

async function request(path, options = {}) {
  const base = httpUrl(process.env.SNIP_API || "http://localhost:3000", "SNIP_API");
  if (base.search || base.hash || base.username || base.password) {
    throw new Error("SNIP_API must not include credentials, a query, or a fragment.");
  }
  let response;
  try {
    response = await fetch(`${base.href.replace(/\/+$/, "")}${path}`, {
      ...options,
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error(`Cannot reach the Snip API at ${base.href}`);
  }
  if (response.status >= 400) {
    if (response.status === 404 && options.openCode) {
      throw new Error(`Unknown code: ${options.openCode}`);
    }
    let message = `API request failed (HTTP ${response.status}).`;
    try {
      const body = await response.json();
      if (typeof body.error === "string") message = body.error;
    } catch {}
    throw new Error(message);
  }
  return response;
}

async function readJson(response) {
  if (!response.ok) throw new Error(`Unexpected API response (HTTP ${response.status}).`);
  try {
    return await response.json();
  } catch {
    throw new Error("The Snip API returned invalid JSON.");
  }
}

async function openBrowser(target) {
  try {
    if (process.platform === "win32") {
      await runFile("cmd.exe", ["/d", "/v:off", "/s", "/c", 'start "" "%SNIP_OPEN_URL%"'], {
        env: { ...process.env, SNIP_OPEN_URL: target },
      });
    } else {
      await runFile(process.platform === "darwin" ? "open" : "xdg-open", [target]);
    }
  } catch {
    throw new Error("Could not open the browser. Check your default browser configuration.");
  }
}

async function main() {
  const [command, value, ...extra] = process.argv.slice(2);
  if (!command || ["help", "--help", "-h"].includes(command)) {
    if (value !== undefined) throw new Error("Help takes no arguments.");
    process.stdout.write(usage);
    return;
  }
  if (extra.length) throw new Error("Too many arguments. Run snip help for usage.");

  if (command === "add") {
    if (!value) throw new Error("Usage: snip add <url>");
    const url = httpUrl(value, "Destination").href;
    const link = await readJson(await request("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    }));
    if (!link || typeof link.shortUrl !== "string") {
      throw new Error("The Snip API response is missing shortUrl.");
    }
    console.log(link.shortUrl);
    return;
  }

  if (command === "ls") {
    if (value !== undefined) throw new Error("Usage: snip ls");
    const links = await readJson(await request("/api/links"));
    if (!Array.isArray(links) || links.some(link => !link ||
      typeof link.code !== "string" || typeof link.url !== "string" ||
      !Number.isSafeInteger(link.hits) || link.hits < 0)) {
      throw new Error("The Snip API returned an invalid links list.");
    }
    if (!links.length) {
      console.log("No links yet.");
      return;
    }
    const codeWidth = links.reduce((width, link) => Math.max(width, link.code.length), 4);
    const hitsWidth = links.reduce((width, link) => Math.max(width, String(link.hits).length), 4);
    console.log(`${"CODE".padEnd(codeWidth)}  ${"HITS".padStart(hitsWidth)}  URL`);
    for (const link of links) {
      console.log(`${link.code.padEnd(codeWidth)}  ${String(link.hits).padStart(hitsWidth)}  ${link.url}`);
    }
    return;
  }

  if (command === "open") {
    if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) {
      throw new Error("Usage: snip open <code> (letters, numbers, underscores, or hyphens)");
    }
    const response = await request(`/${encodeURIComponent(value)}`, { openCode: value });
    if (![301, 302, 303, 307, 308].includes(response.status)) {
      throw new Error(`Expected a redirect for code: ${value}`);
    }
    const location = response.headers.get("location");
    if (!location) throw new Error("The Snip API redirect is missing Location.");
    const target = httpUrl(new URL(location, response.url).href, "Redirect destination");
    await openBrowser(target.href);
    return;
  }

  throw new Error(`Unknown command: ${command}. Run snip help for usage.`);
}

main().catch(error => {
  console.error(`snip: ${error.message}`);
  process.exitCode = 1;
});