import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const appRoutes = new Set(["/", "/home", "/services", "/projects", "/process", "/pricing", "/policies", "/contact", "/reviews"]);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://localhost:${port}`);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname === "/api/paypal-config") {
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ enabled: false, clientId: "", currency: "USD" }));
      return;
    }

    if ((pathname === "/api/contact" || pathname === "/api/review") && request.method === "POST") {
      response.writeHead(202, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ ok: true, local: true }));
      return;
    }

    const routePath = appRoutes.has(pathname.replace(/\/+$/, "") || "/") ? "/index.html" : pathname === "/" ? "/index.html" : pathname;
    const filePath = resolve(join(root, pathname));
    const resolvedPath = resolve(join(root, routePath));

    if (!filePath.startsWith(root) || !resolvedPath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const file = await readFile(resolvedPath);
    response.writeHead(200, {
      "Content-Type": types[extname(resolvedPath).toLowerCase()] || "application/octet-stream",
    });
    response.end(file);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(port, () => {
  console.log(`BSD site running at http://localhost:${port}`);
});
