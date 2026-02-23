/**
 * IPS Questionnaire — Production server
 *
 * Serves both the API and the built Vite frontend from a single process.
 *
 * In development:  npm run dev  (uses concurrently + Vite proxy)
 * In production:   npm run build && node server/index.js
 *
 * Data storage:
 *   data/clients.json        — client index
 *   data/clients/<id>.json   — per-client questionnaire data
 *
 * API:
 *   GET    /api/clients
 *   POST   /api/clients         { name }
 *   GET    /api/clients/:id
 *   PUT    /api/clients/:id
 *   DELETE /api/clients/:id
 */

import { createServer } from "node:http";
import { readFile, writeFile, mkdir, unlink, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST_DIR = join(ROOT, "dist");
const DATA_DIR = join(ROOT, "data");
const CLIENTS_DIR = join(DATA_DIR, "clients");
const INDEX_FILE = join(DATA_DIR, "clients.json");

// Render provides PORT env var; fall back to 3001 for local dev
const PORT = process.env.PORT || 3001;

// ── MIME types for static files ──────────────────────

const MIME = {
  ".html": "text/html",
  ".js":   "application/javascript",
  ".css":  "text/css",
  ".json": "application/json",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".ttf":  "font/ttf",
};

// ── Helpers ──────────────────────────────────────────

async function ensureDirs() {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
  if (!existsSync(CLIENTS_DIR)) await mkdir(CLIENTS_DIR, { recursive: true });
  if (!existsSync(INDEX_FILE)) await writeFile(INDEX_FILE, "[]", "utf-8");
}

async function readJSON(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf-8"));
  } catch {
    return null;
  }
}

async function writeJSON(filePath, data) {
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function clientFile(id) {
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "");
  return join(CLIENTS_DIR, `${safe}.json`);
}

function sendJSON(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error("Invalid JSON")); }
    });
  });
}

// ── Static file serving ──────────────────────────────

async function serveStatic(res, urlPath) {
  let filePath = join(DIST_DIR, urlPath === "/" ? "index.html" : urlPath);

  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("Not a file");
  } catch {
    // SPA fallback: serve index.html for any non-file route
    filePath = join(DIST_DIR, "index.html");
  }

  try {
    const content = await readFile(filePath);
    const ext = extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

// ── Request handler ──────────────────────────────────

async function handleRequest(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  // ── API routes ──

  try {
    if (path.startsWith("/api/")) {

      // GET /api/clients
      if (req.method === "GET" && path === "/api/clients") {
        return sendJSON(res, 200, (await readJSON(INDEX_FILE)) || []);
      }

      // POST /api/clients
      if (req.method === "POST" && path === "/api/clients") {
        const { name } = await parseBody(req);
        if (!name?.trim()) return sendJSON(res, 400, { error: "Name required" });

        const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const now = Date.now();
        const clientData = {
          clientName: name.trim(),
          date: new Date().toISOString().split("T")[0],
          advisor: "",
          answers: {},
          createdAt: now,
          updatedAt: now,
        };

        await writeJSON(clientFile(id), clientData);

        const clients = (await readJSON(INDEX_FILE)) || [];
        clients.unshift({ id, name: name.trim(), createdAt: now, updatedAt: now });
        await writeJSON(INDEX_FILE, clients);

        return sendJSON(res, 201, { id, ...clientData });
      }

      // Routes with :id parameter
      const idMatch = path.match(/^\/api\/clients\/([a-zA-Z0-9_-]+)$/);
      if (idMatch) {
        const id = idMatch[1];

        if (req.method === "GET") {
          const data = await readJSON(clientFile(id));
          if (!data) return sendJSON(res, 404, { error: "Not found" });
          return sendJSON(res, 200, data);
        }

        if (req.method === "PUT") {
          const body = await parseBody(req);
          const updated = { ...body, updatedAt: Date.now() };
          await writeJSON(clientFile(id), updated);

          const clients = (await readJSON(INDEX_FILE)) || [];
          const idx = clients.findIndex((c) => c.id === id);
          if (idx !== -1) {
            clients[idx] = { ...clients[idx], name: updated.clientName, updatedAt: updated.updatedAt };
            await writeJSON(INDEX_FILE, clients);
          }

          return sendJSON(res, 200, updated);
        }

        if (req.method === "DELETE") {
          const file = clientFile(id);
          if (existsSync(file)) await unlink(file);

          const clients = ((await readJSON(INDEX_FILE)) || []).filter((c) => c.id !== id);
          await writeJSON(INDEX_FILE, clients);

          return sendJSON(res, 200, { deleted: id });
        }
      }

      return sendJSON(res, 404, { error: "Not found" });
    }
  } catch (err) {
    console.error("API error:", err);
    return sendJSON(res, 500, { error: err.message });
  }

  // ── Static files (production build) ──

  if (existsSync(DIST_DIR)) {
    return serveStatic(res, path);
  }

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(`
    <html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;color:#475569">
      <div style="text-align:center">
        <h2>API server is running</h2>
        <p>Run <code>npm run dev</code> to start both the API and Vite dev server,<br>
        or <code>npm run build</code> first to serve the production build from here.</p>
      </div>
    </body></html>
  `);
}

// ── Start ────────────────────────────────────────────

async function main() {
  await ensureDirs();
  createServer(handleRequest).listen(PORT, () => {
    console.log(`✓ IPS server running on http://localhost:${PORT}`);
    if (existsSync(DIST_DIR)) {
      console.log(`  Serving frontend from dist/`);
    } else {
      console.log(`  No dist/ found — run "npm run build" for production`);
    }
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
