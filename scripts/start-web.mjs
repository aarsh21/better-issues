import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const appDir = path.join(rootDir, "apps", "web");
const clientDir = path.join(appDir, "dist", "client");
const publicDir = path.join(appDir, "public");
const serverEntryPath = path.join(appDir, "dist", "server", "server.js");
const serverEntry = await import(pathToFileURL(serverEntryPath).href);
const serverModule = serverEntry.default;

if (!serverModule || typeof serverModule.fetch !== "function") {
  throw new Error("Invalid TanStack Start server entry: missing default.fetch");
}

const port = Number(process.env.PORT ?? 4100);
const host = process.env.HOST ?? process.env.HOSTNAME ?? "0.0.0.0";

const CONTENT_TYPES = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".otf": "font/otf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function resolveSafeFile(baseDir, pathname) {
  const relativePath = pathname.replace(/^\/+/, "");
  const normalizedPath = path.normalize(relativePath);

  if (normalizedPath.startsWith("..")) {
    return null;
  }

  const absolutePath = path.join(baseDir, normalizedPath);
  if (!absolutePath.startsWith(baseDir + path.sep) && absolutePath !== baseDir) {
    return null;
  }

  return absolutePath;
}

async function tryServeStatic(req, res) {
  const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const pathname = requestUrl.pathname;

  const staticCandidate = resolveSafeFile(clientDir, pathname);
  if (staticCandidate && (await writeFileIfExists(req, res, staticCandidate, true))) {
    return true;
  }

  const publicCandidate = resolveSafeFile(publicDir, pathname);
  if (publicCandidate && (await writeFileIfExists(req, res, publicCandidate, false))) {
    return true;
  }

  return false;
}

async function writeFileIfExists(req, res, absolutePath, immutable) {
  let fileStat;
  try {
    fileStat = await stat(absolutePath);
  } catch {
    return false;
  }

  if (!fileStat.isFile()) {
    return false;
  }

  const ext = path.extname(absolutePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

  res.statusCode = 200;
  res.setHeader("content-type", contentType);
  res.setHeader("content-length", String(fileStat.size));
  res.setHeader(
    "cache-control",
    immutable ? "public, max-age=31536000, immutable" : "public, max-age=3600",
  );

  if (req.method === "HEAD") {
    res.end();
    return true;
  }

  createReadStream(absolutePath).pipe(res);
  return true;
}

function toWebRequest(req) {
  const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? `localhost:${port}`}`);
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }

  if (req.method === "GET" || req.method === "HEAD") {
    return new Request(requestUrl, {
      headers,
      method: req.method,
    });
  }

  return new Request(requestUrl, {
    body: req,
    duplex: "half",
    headers,
    method: req.method,
  });
}

function writeWebResponse(req, res, response) {
  res.statusCode = response.status;

  for (const [key, value] of response.headers) {
    if (key.toLowerCase() === "set-cookie") {
      continue;
    }
    res.setHeader(key, value);
  }

  const setCookies = response.headers.getSetCookie?.();
  if (setCookies && setCookies.length > 0) {
    res.setHeader("set-cookie", setCookies);
  }

  if (!response.body || req.method === "HEAD") {
    res.end();
    return;
  }

  Readable.fromWeb(response.body).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    if (await tryServeStatic(req, res)) {
      return;
    }

    const request = toWebRequest(req);
    const response = await serverModule.fetch(request);
    writeWebResponse(req, res, response);
  } catch (error) {
    console.error("Web server request failed:", error);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
});

server.listen(port, host, () => {
  console.log(`==> TanStack Start listening on http://${host}:${port}`);
});
