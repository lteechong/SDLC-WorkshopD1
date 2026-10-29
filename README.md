# Snip CLI

Zero-dependency CommonJS client. Requires Node.js 18+ (global `fetch`) and a running
Snip backend. No install or build step is needed.

```sh
node cli.js add https://example.com
node cli.js ls
node cli.js open abc123
node cli.js help
```

Use `./snip` on macOS/Linux, `.\snip.cmd` in Windows Command Prompt, or
`.\snip.ps1` in PowerShell instead of `node cli.js`. The wrappers forward all
arguments. Optional: run `npm link` to make `snip` available on your PATH.

The API defaults to `http://localhost:3000`. To select another backend:

```sh
SNIP_API=https://snip.example.com node cli.js ls
```

```powershell
$env:SNIP_API = 'https://snip.example.com'
.\snip.ps1 ls
```

`add` prints only the returned short URL. `ls` prints an aligned code/hits/URL
table, or `No links yet.`. `open` requests the code with redirects disabled, then
opens its HTTP(S) Location target using `start`, `open`, or `xdg-open`. It does not
fetch the destination itself. API requests time out after 10 seconds.

No arguments, `help`, `--help`, and `-h` show usage. Errors go to stderr with exit
code 1; success exits 0.