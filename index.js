/**
 * Local JSON-file API server for IPS client data.
 *
 * Stores data in ./data/:
 *   data/clients.json        — array of { id, name, createdAt, updatedAt }
 *   data/clients/<id>.json   — full client questionnaire data
 *
 * Endpoints:
 *   GET    /api/clients              — list all clients
 *   POST   /api/clients              — create a new client  { name }
 *   GET    /api/clients/:id          — get one client's data
 *   PUT    /api/clients/:id          — update one client's data
 *   DELETE /api/clients/:id          — delete a client
 */

import { createServer } from "node:http";
import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const CLIENTS_DIR = join(DATA_DIR, "clients");
const INDEX_FILE = join(DATA_DIR, "clients.json");

const PORT = 3001;

// ── Helpers ──────────────────────────────────────────

async function ensureDirs() {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
  if (!existsSync(CLIENTS_DIR)) await mkdir(CLIENTS_DIR, { recursive: true });
  if (!existsSync(INDEX_FILE)) await writeFile(INDEX_FILE, "[]", "utf-8");
}

async function readJSON(path) {
  try {
    return JSON.parse(await readFile(path, "utf-8"));
  } catch {
    return null;
  }
}

async function writeJSON(path, data) {
  await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
}

function clientFile(id) {
  // Sanitize id to prevent path traversal
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "");
  return join(CLIENTS_DIR, `${safe}.json`);
}

function json(res, status, data) {
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

// ── Routes ───────────────────────────────────────────

async function handleRequest(req, res) {
  // CORS headers (for dev)
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

  try {
    // GET /api/clients — list
    if (req.method === "GET" && path === "/api/clients") {
      const clients = await readJSON(INDEX_FILE) || [];
      return json(res, 200, clients);
    }

    // POST /api/clients — create
    if (req.method === "POST" && path === "/api/clients") {
      const { name } = await parseBody(req);
      if (!name?.trim()) return json(res, 400, { error: "Name required" });

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

      const clients = await readJSON(INDEX_FILE) || [];
      const entry = { id, name: name.trim(), createdAt: now, updatedAt: now };
      clients.unshift(entry);
      await writeJSON(INDEX_FILE, clients);

      return json(res, 201, { id, ...clientData });
    }

    // GET /api/clients/:id — read one
    const getMatch = path.match(/^\/api\/clients\/([a-zA-Z0-9_-]+)$/);
    if (req.method === "GET" && getMatch) {
      const id = getMatch[1];
      const data = await readJSON(clientFile(id));
      if (!data) return json(res, 404, { error: "Not found" });
      return json(res, 200, data);
    }

    // PUT /api/clients/:id — update one
    const putMatch = path.match(/^\/api\/clients\/([a-zA-Z0-9_-]+)$/);
    if (req.method === "PUT" && putMatch) {
      const id = putMatch[1];
      const body = await parseBody(req);
      const updated = { ...body, updatedAt: Date.now() };
      await writeJSON(clientFile(id), updated);

      // Update the index entry
      const clients = await readJSON(INDEX_FILE) || [];
      const idx = clients.findIndex((c) => c.id === id);
      if (idx !== -1) {
        clients[idx] = { ...clients[idx], name: updated.clientName, updatedAt: updated.updatedAt };
        await writeJSON(INDEX_FILE, clients);
      }

      return json(res, 200, updated);
    }

    // DELETE /api/clients/:id — delete one
    const delMatch = path.match(/^\/api\/clients\/([a-zA-Z0-9_-]+)$/);
    if (req.method === "DELETE" && delMatch) {
      const id = delMatch[1];
      const file = clientFile(id);
      if (existsSync(file)) await unlink(file);

      const clients = (await readJSON(INDEX_FILE) || []).filter((c) => c.id !== id);
      await writeJSON(INDEX_FILE, clients);

      return json(res, 200, { deleted: id });
    }

    // 404
    json(res, 404, { error: "Not found" });
  } catch (err) {
    console.error("Server error:", err);
    json(res, 500, { error: err.message });
  }
}

// ── Start ────────────────────────────────────────────

await ensureDirs();

createServer(handleRequest).listen(PORT, () => {
  console.log(`✓ IPS API server running on http://localhost:${PORT}`);
});
