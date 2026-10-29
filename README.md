# Snip: One Backend, Two Clients

Snip is a URL shortener with one HTTP API and two independent clients: an Angular
web workspace and a zero-dependency Node.js CLI. Both clients create and list the
same links; following a short link redirects to its destination and records a hit.
The backend stores links in memory, so restarting it clears the collection.

## Repository Layout

Each layer lives on its own branch of **this same repository**. The orphan `main`
branch is the aggregator: it contains this README, `.gitmodules`, and three pinned
submodule commits, not copies of the layer source.

| Path | Tracking branch | Entry point | Runtime |
| --- | --- | --- | --- |
| `backend/` | `backend` | `server.js` | Bun |
| `frontend/` | `frontend` | `angular.json` | Angular 19 / Node.js |
| `cli/` | `cli` | `cli.js` | Node.js 18+ with global fetch |

`.gitmodules` sets each submodule's URL to this repository and its branch to the
matching layer. Normal checkouts use the exact commits recorded by `main` for
reproducibility. `git submodule update --remote <path>` explicitly advances a
submodule to its configured remote branch tip.

## Clone

```sh
git clone --branch main --recurse-submodules https://github.com/lteechong/SDLC-WorkshopD1.git
cd SDLC-WorkshopD1
```

**Plain clones leave the submodule folders empty.** If you already cloned without
`--recurse-submodules`, run this from the repository root:

```sh
git submodule update --init --recursive
```

After pulling updates to `main`, run `git submodule update --init --recursive`
again to check out its recorded layer commits.

## API Contract

The default API origin is `http://localhost:3000`. A link object has
`{ code, url, shortUrl, hits, createdAt }`: string identifiers/URLs, a numeric hit
count, and an ISO timestamp. Errors use `{ "error": "message" }`.

| Method | Path | Request | Success | Errors |
| --- | --- | --- | --- | --- |
| `POST` | `/api/links` | JSON `{ "url": "https://example.com" }`; `Content-Type: application/json` | `201`, link object with `hits: 0` | `400`, malformed JSON or invalid/non-HTTP(S) URL |
| `GET` | `/api/links` | None | `200`, array of links (possibly `[]`) | None specific |
| `GET` | `/:code` | None | `302`, `Location` is the destination; increments hits | `404`, unknown code |
| `OPTIONS` | Any path | CORS preflight | `204`, allows `GET`, `POST`, `OPTIONS` and `Content-Type` | None specific |

The backend permits cross-origin browser requests. Other unmatched routes return
`404`. The CLI requests short-code redirects with `redirect: "manual"`, then opens
the HTTP(S) Location in the OS browser rather than fetching it itself.

## Run All Three

Install Bun and a supported Node.js version (Node.js 22 LTS is suitable for the
Angular frontend and CLI). Run these commands from the aggregator root in
separate terminals.

### Backend

```sh
cd backend
bun start
```

No dependencies to install. The API listens on `http://localhost:3000`. `PORT`
changes the port; `BASE_URL` sets the origin in returned short URLs. Without
`BASE_URL`, the server uses `https://$RAILWAY_PUBLIC_DOMAIN` when configured,
otherwise `http://localhost:$PORT`. Optional `PUBLIC_DIR` serves static files;
existing files take precedence over matching short codes.

### Web Client

```sh
cd frontend
npm install
npm start
```

Open `http://localhost:4200/`. The frontend calls
`http://localhost:3000/api/links`; keep the backend running. To build production
assets, run `npx ng build` from `frontend/`. The visual system is documented in
`frontend/design.md`.

### CLI Client

```sh
node cli/cli.js add https://example.com
node cli/cli.js ls
node cli/cli.js open <code-from-add-or-ls>
node cli/cli.js help
```

Replace the placeholder code with a real code from the same running backend.
No install or build step is needed. The wrappers `cli/snip`, `cli/snip.cmd`, and
`cli/snip.ps1` forward arguments to `cli.js`; run the appropriate wrapper for your
shell, for example `./cli/snip ls` or `.\cli\snip.cmd ls`.

`SNIP_API` overrides the CLI's backend origin. In macOS/Linux shells:

```sh
SNIP_API=https://snip.example.com node cli/cli.js ls
```

In PowerShell:

```powershell
$env:SNIP_API = 'https://snip.example.com'
node cli/cli.js ls
```

`add` prints the short URL; `ls` prints an aligned code/hits/URL table or
`No links yet.`. Failures go to stderr with exit code 1.

## Update a Layer

Recursive clones normally leave submodules on detached HEADs at their pinned
commits. Switch to the matching branch **before editing**. For a backend change:

```sh
cd backend
git switch backend
git pull --ff-only origin backend
```

Make and test the change inside that folder, then commit and push it there first:

```sh
git add server.js
git commit -m "Update backend behavior"
git push origin backend
cd ..
```

Back in the superproject, fetch the configured branch tip and commit the pointer
bump only after the layer commit is available remotely:

```sh
git submodule update --remote backend
git add backend
git commit -m "Update backend submodule"
git push origin main
```

Use the same workflow with `frontend` or `cli` as both the path and branch name.
`git submodule status` shows the pinned commits. Commit the layer's source changes
inside its submodule; the superproject records only the updated commit pointer.