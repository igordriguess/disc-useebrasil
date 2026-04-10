import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const PORT = Number(process.env.PORT || 3001);
const HOST = "0.0.0.0";

const DATA_DIR = path.resolve(process.cwd(), "local-disc-data");
const SUBMISSIONS_DIR = path.join(DATA_DIR, "submissions");
const DIST_DIR = path.resolve("dist");
const ADMIN_USERNAME_HASH = process.env.ADMIN_USERNAME_HASH || "b88976e384cfba350b860fa35d2da623f6ff1c602647b49285de577681f7c894";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "5b9ccce4a61b723926e42217fed468ee5df71d20b403754dd091e4a90f907518";

// =========================
// HELPERS
// =========================

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
};

const sendFile = (res, filePath) => {
  const ext = path.extname(filePath);

  const contentTypes = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
  };

  const contentType = contentTypes[ext] || "application/octet-stream";

  const stream = createReadStream(filePath);

  stream.on("open", () => {
    res.writeHead(200, { "Content-Type": contentType });
  });

  stream.on("error", () => {
    res.writeHead(404);
    res.end();
  });

  stream.pipe(res);
};

// =========================
// NORMALIZAÇÃO
// =========================

const normalizeSegment = (value) => {
  const normalized = String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "Campo";
};

const normalizeSubmissionKey = (userInfo) =>
  `${normalizeSegment(userInfo?.nome)}_${normalizeSegment(userInfo?.sobrenome)}_${normalizeSegment(userInfo?.idade)}_${normalizeSegment(userInfo?.setor)}`.toLowerCase();

const toStoredUserInfo = (userInfo) => ({
  nome: String(userInfo?.nome || "").trim(),
  sobrenome: String(userInfo?.sobrenome || "").trim(),
  idade: String(userInfo?.idade || "").trim(),
  setor: String(userInfo?.setor || "").trim(),
});

const sha256 = (value) => createHash("sha256").update(String(value || "")).digest("hex");

// =========================
// STORAGE
// =========================

const ensureStorage = async () => {
  await mkdir(SUBMISSIONS_DIR, { recursive: true });
};

const getSubmissionFiles = async () => {
  await ensureStorage();
  const items = await readdir(SUBMISSIONS_DIR, { withFileTypes: true });
  return items.filter(i => i.isFile() && i.name.endsWith(".json")).map(i => i.name);
};

const getSubmissions = async () => {
  const files = await getSubmissionFiles();
  const entries = [];

  for (const fileName of files) {
    try {
      const content = await readFile(path.join(SUBMISSIONS_DIR, fileName), "utf-8");
      const parsed = JSON.parse(content);

      if (parsed?.id && parsed?.createdAt) {
        entries.push(parsed);
      }
    } catch {}
  }

  return entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// =========================
// SERVER
// =========================

const server = createServer(async (req, res) => {
  if (!req.url) return sendJson(res, 400, { error: "Invalid request" });

  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  try {
    // ================= API =================

    if (req.method === "GET" && url.pathname === "/api/submissions") {
      const entries = await getSubmissions();
      return sendJson(res, 200, { entries });
    }

    if (req.method === "GET" && url.pathname === "/api/submissions/exists") {
      const userInfo = {
        nome: url.searchParams.get("nome") || "",
        sobrenome: url.searchParams.get("sobrenome") || "",
        idade: url.searchParams.get("idade") || "",
        setor: url.searchParams.get("setor") || "",
      };

      const entries = await getSubmissions();
      const id = normalizeSubmissionKey(userInfo);
      const exists = entries.some((entry) => entry.id === id);

      return sendJson(res, 200, { exists });
    }

    if (req.method === "POST" && url.pathname === "/api/admin/login") {
      let body = "";

      for await (const chunk of req) {
        body += chunk;
      }

      const parsed = JSON.parse(body || "{}");
      const usernameHash = sha256(String(parsed?.username || "").trim());
      const passwordHash = sha256(String(parsed?.password || ""));
      const authenticated = usernameHash === ADMIN_USERNAME_HASH && passwordHash === ADMIN_PASSWORD_HASH;

      if (!authenticated) {
        return sendJson(res, 401, { authenticated: false });
      }

      return sendJson(res, 200, { authenticated: true });
    }

    if (req.method === "POST" && url.pathname === "/api/submissions") {
      let body = "";

      for await (const chunk of req) {
        body += chunk;
      }

      const parsed = JSON.parse(body || "{}");

      if (!parsed?.userInfo || !parsed?.scores) {
        return sendJson(res, 400, { error: "Missing payload" });
      }

      const entries = await getSubmissions();

      if (entries.some(e => e.id === normalizeSubmissionKey(parsed.userInfo))) {
        return sendJson(res, 409, { error: "duplicate" });
      }

      const entry = {
        id: normalizeSubmissionKey(parsed.userInfo),
        createdAt: new Date().toISOString(),
        userInfo: toStoredUserInfo(parsed.userInfo),
        scores: parsed.scores,
      };

      await writeFile(
        path.join(SUBMISSIONS_DIR, `${entry.id}.json`),
        JSON.stringify(entry, null, 2)
      );

      return sendJson(res, 201, { entry });
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/api/submissions/")) {
      const id = url.pathname.split("/").pop();
      await rm(path.join(SUBMISSIONS_DIR, `${id}.json`)).catch(() => {});
      return sendJson(res, 200, { deleted: true });
    }

    // ================= FRONTEND =================

    let filePath = path.join(DIST_DIR, url.pathname);

    if (url.pathname === "/" || !existsSync(filePath)) {
      filePath = path.join(DIST_DIR, "index.html");
    }

    if (existsSync(filePath)) {
      return sendFile(res, filePath);
    }

    return sendJson(res, 404, { error: "Not found" });

  } catch (err) {
    console.error("ERROR:", err);
    return sendJson(res, 500, { error: "Internal server error" });
  }
});

// ================= START =================

server.listen(PORT, HOST, async () => {
  await ensureStorage();
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});