import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getLogPrefix(source) {
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", { hour12: false });
  return `${time} [${source}]`;
}

export function log(message, source = "express") {
  console.log(`${getLogPrefix(source)} ${message}`);
}

export async function setupVite(app, server) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
    root: resolve(__dirname, "..", "client"),
    base: "/",
  });

  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);

  return vite;
}

export function serveStatic(app) {
  const distPath = resolve(__dirname, "..", "dist", "public");
  
  app.use("/", express.static(distPath));
  
  // Fallback for SPA
  app.get("*", (req, res) => {
    res.sendFile(resolve(distPath, "index.html"));
  });
}