# Extract Images From Page

Full-stack tool to scrape every image from a URL, preview them, and download the ones you want as a zip.

## Quick start

```bash
# from the repository root
npm install
npm run install:all
npm run dev
```

Then open `http://localhost:5174` in your browser. The React client talks to the API at `http://localhost:4000`.

## Deploying the UI to GitHub Pages

GitHub Pages can only host static files, so you still need to deploy the API somewhere (Render/Fly/Heroku/Netlify Functions/etc.). Once the API is reachable over HTTPS:

1. **Allow your Pages origin** on the API: set `ALLOWED_ORIGINS` (comma-separated) to include `https://<your-username>.github.io` and `https://<your-username>.github.io/<repo-name>`.
2. **Expose the API URL to the client build**: create a repository secret named `VITE_API_BASE` with your API origin, e.g. `https://your-api.example.com`.
3. **Enable Pages from GitHub Actions** in repo Settings → Pages.
4. The included workflow `.github/workflows/deploy-gh-pages.yml` will build `client/` and publish it to Pages on pushes to `main`.

You can also build locally and push the `client/dist` folder to the `gh-pages` branch if you prefer manual deployment.

## Running pieces separately

- Backend: `cd server && npm install && npm run dev`
- Frontend: `cd client && npm install && npm run dev`

## Scripts

- Root `npm run dev` — starts the Express API (port 4000) and Vite dev server (port 5174) concurrently.
- Root `npm run install:all` — installs both client and server dependencies.
- Server `npm run build` — type-checks and compiles to `server/dist`.
- Server `npm start` — runs the compiled server.
- Client `npm run build` — builds the production React bundle.

## Configuration

- The client points at `http://localhost:4000` by default. Override with `VITE_API_BASE` in `client/.env` (or as a build-time env variable) if you host the API elsewhere.
- The server port can be overridden with `PORT`.
- Server CORS: extend allowed origins with `ALLOWED_ORIGINS` (comma-separated). Include your GitHub Pages URL when deploying the UI there.
- Server security: private/local hosts (e.g., `localhost`, `10.x.x.x`, `192.168.x.x`, `::1`) are blocked to prevent SSRF; the HTML fetch also caps page size to ~1.5 MB to avoid oversized responses.

## Stack

- **Backend:** Node, Express, Cheerio, Axios, Archiver, TypeScript.
- **Frontend:** React, Vite, TypeScript, plain CSS.
