import { createServer } from "node:http";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const PORT = Number(process.env.DISC_API_PORT || 3001);
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
      if (data.length > 1024 * 1024) {
        reject(new Error("Body too large"));
      }
    });

    request.on("end", () => {
      if (!data) {
        resolve({});
        return;
      }

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
  return items.filter((item) => item.isFile() && item.name.endsWith(".json")).map((item) => item.name);
};

const getSubmissions = async () => {
  const files = await getSubmissionFiles();
  const entries = [];

  for (const fileName of files) {
    try {
      const content = await readFile(path.join(SUBMISSIONS_DIR, fileName), "utf-8");
      const parsed = JSON.parse(content);
      if (
        parsed &&
        typeof parsed.id === "string" &&
        typeof parsed.createdAt === "string" &&
        parsed.userInfo &&
        parsed.scores
      ) {
        entries.push({
          id: parsed.id,
          fileName: parsed.fileName || fileName,
          createdAt: parsed.createdAt,
          userInfo: parsed.userInfo,
          scores: parsed.scores,
        });
      }
    } catch {
      // Ignore malformed files and keep serving valid entries.
    }
  }

  return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const server = createServer(async (request, response) => {
  if (!request.url) {
    sendJson(response, 400, { error: "Invalid request" });
    return;
  }

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    response.end();
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  try {
    if (request.method === "GET" && url.pathname === "/api/storage-location") {
      sendJson(response, 200, { directory: SUBMISSIONS_DIR });
      return;
    }

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

      const id = normalizeSubmissionKey(userInfo);
      const entries = await getSubmissions();
      if (hasDuplicateSubmission(entries, userInfo)) {
        sendJson(response, 409, { error: "duplicate" });
        return;
      }

      const fileName = buildFileName(userInfo);
      const entry = {
        id,
        fileName,
        createdAt: new Date().toISOString(),
        userInfo: toStoredUserInfo(userInfo),
        scores,
      };

      await ensureStorage();
      await writeFile(path.join(SUBMISSIONS_DIR, fileName), JSON.stringify(entry, null, 2), "utf-8");
      sendJson(response, 201, { entry });
      return;
    }

    if (request.method === "DELETE" && url.pathname.startsWith("/api/submissions/")) {
      const submissionId = decodeURIComponent(url.pathname.replace("/api/submissions/", "")).trim();
      if (!submissionId) {
        sendJson(response, 400, { error: "Invalid submission id" });
        return;
      }

      const entries = await getSubmissions();
      const target = entries.find((entry) => entry.id === submissionId);
      if (!target) {
        sendJson(response, 404, { error: "not-found" });
        return;
      }

      await rm(path.join(SUBMISSIONS_DIR, target.fileName));
      sendJson(response, 200, { deleted: true });
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
