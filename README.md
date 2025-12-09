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

- The client points at `http://localhost:4000` by default. Override with `VITE_API_BASE` in `client/.env` if you host the API elsewhere.
- The server port can be overridden with `PORT`.

## Stack

- **Backend:** Node, Express, Cheerio, Axios, Archiver, TypeScript.
- **Frontend:** React, Vite, TypeScript, plain CSS.
