import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const PORT = Number(process.env.PORT || 3001);
const DATA_DIR = path.resolve(process.cwd(), "local-disc-data");
const SUBMISSIONS_DIR = path.join(DATA_DIR, "submissions");

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(payload));
};

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

const hasDuplicateSubmission = (entries, userInfo) => {
  const candidateKey = normalizeSubmissionKey(userInfo);
  return entries.some((entry) => {
    const entryKeyFromInfo = normalizeSubmissionKey(entry?.userInfo);
    return entry.id === candidateKey || entryKeyFromInfo === candidateKey;
  });
};

const buildFileName = (userInfo) => {
  const nome = normalizeSegment(userInfo?.nome);
  const sobrenome = normalizeSegment(userInfo?.sobrenome);
  const idade = normalizeSegment(userInfo?.idade);
  const setor = normalizeSegment(userInfo?.setor);

  return `${nome}_${sobrenome}_${idade}_${setor}.json`;
};

const readBody = async (request) =>
  new Promise((resolve, reject) => {
    let data = "";

    request.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1024 * 1024) reject(new Error("Body too large"));
    });

    request.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });

    request.on("error", reject);
  });

const ensureStorage = async () => {
  await mkdir(SUBMISSIONS_DIR, { recursive: true });
};

const getSubmissionFiles = async () => {
  await ensureStorage();
  const items = await readdir(SUBMISSIONS_DIR, { withFileTypes: true });
  return items.filter((i) => i.isFile() && i.name.endsWith(".json")).map((i) => i.name);
};

const getSubmissions = async () => {
  const files = await getSubmissionFiles();
  const entries = [];

  for (const fileName of files) {
    try {
      const content = await readFile(path.join(SUBMISSIONS_DIR, fileName), "utf-8");
      const parsed = JSON.parse(content);
      if (parsed?.id && parsed?.createdAt && parsed?.userInfo && parsed?.scores) {
        entries.push({
          id: parsed.id,
          fileName: parsed.fileName || fileName,
          createdAt: parsed.createdAt,
          userInfo: parsed.userInfo,
          scores: parsed.scores,
        });
      }
    } catch {}
  }

  return entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const server = createServer(async (request, response) => {
  if (!request.url) {
    sendJson(response, 400, { error: "Invalid request" });
    return;
  }

  // ✅ PRIMEIRO DEFINE URL
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    response.end();
    return;
  }

  try {
    // =========================
    // 🚀 API PRIMEIRO
    // =========================

    if (request.method === "GET" && url.pathname === "/api/submissions") {
      const entries = await getSubmissions();
      sendJson(response, 200, { entries });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/submissions/exists") {
      const nome = url.searchParams.get("nome") || "";
      const sobrenome = url.searchParams.get("sobrenome") || "";
      const idade = url.searchParams.get("idade") || "";
      const setor = url.searchParams.get("setor") || "";
      const entries = await getSubmissions();
      const exists = hasDuplicateSubmission(entries, { nome, sobrenome, idade, setor });
      sendJson(response, 200, { exists });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/submissions") {
      const body = await readBody(request);
      const userInfo = body?.userInfo;
      const scores = body?.scores;

      if (!userInfo || !scores) {
        sendJson(response, 400, { error: "Missing payload" });
        return;
      }

      const entries = await getSubmissions();
      if (hasDuplicateSubmission(entries, userInfo)) {
        sendJson(response, 409, { error: "duplicate" });
        return;
      }

      const id = normalizeSubmissionKey(userInfo);
      const fileName = buildFileName(userInfo);

      const entry = {
        id,
        fileName,
        createdAt: new Date().toISOString(),
        userInfo: toStoredUserInfo(userInfo),
        scores,
      };

      await ensureStorage();
      await writeFile(path.join(SUBMISSIONS_DIR, fileName), JSON.stringify(entry, null, 2));

      sendJson(response, 201, { entry });
      return;
    }

    if (request.method === "DELETE" && url.pathname.startsWith("/api/submissions/")) {
      const id = decodeURIComponent(url.pathname.replace("/api/submissions/", ""));
      const entries = await getSubmissions();
      const target = entries.find((e) => e.id === id);

      if (!target) {
        sendJson(response, 404, { error: "not-found" });
        return;
      }

      await rm(path.join(SUBMISSIONS_DIR, target.fileName));
      sendJson(response, 200, { deleted: true });
      return;
    }

    // =========================
    // 🌐 FRONTEND (VITE BUILD)
    // =========================

    const distPath = path.resolve("dist");

    if (request.method === "GET") {

      let filePath = path.join(distPath, url.pathname);

      if (url.pathname === "/") {
        filePath = path.join(distPath, "index.html");
      }

      const ext = path.extname(filePath);

      const contentTypes = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon"
      };

      const contentType = contentTypes[ext] || "application/octet-stream";

      const stream = createReadStream(filePath);

      stream.on("open", () => {
        response.writeHead(200, { "Content-Type": contentType });
      });

      stream.on("error", () => {

        if (!url.pathname.startsWith("/assets")) {
          const fallback = createReadStream(
            path.join(distPath, "index.html")
          );

          response.writeHead(200, { "Content-Type": "text/html" });
          fallback.pipe(response);
        } else {
          response.writeHead(404);
          response.end();
        }

      });

      stream.pipe(response);
      return;
    }

    sendJson(response, 404, { error: "Route not found" });

    } catch (error) {
      sendJson(response, 500, { error: "Internal server error", detail: String(error) });
    }
});

server.listen(PORT, async () => {
  await ensureStorage();
  console.log(`[disc-api] running on http://localhost:${PORT}`);
  console.log(`[disc-api] local directory: ${SUBMISSIONS_DIR}`);
});