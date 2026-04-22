import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

/**
 * Plugin local : en dev, sert /data/* depuis ../data
 * (le pipeline écrit data/budget.json à la racine du repo).
 */
function serveDataFolder() {
  return {
    name: "serve-data-folder",
    configureServer(server: { middlewares: { use: (path: string, handler: (req: unknown, res: unknown, next: () => void) => void) => void } }) {
      const dataRoot = resolve(__dirname, "../data");
      server.middlewares.use("/data", (req, res, next) => {
        const r = req as { url?: string };
        const w = res as { setHeader: (k: string, v: string) => void; end: (c?: string | Buffer) => void; statusCode?: number };
        const url = r.url || "/";
        const filePath = resolve(dataRoot, "." + url);
        if (!filePath.startsWith(dataRoot)) {
          w.statusCode = 403;
          w.end("Forbidden");
          return;
        }
        try {
          const body = readFileSync(filePath);
          w.setHeader("Content-Type", "application/json; charset=utf-8");
          w.setHeader("Cache-Control", "no-store");
          w.end(body);
        } catch {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveDataFolder()],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  resolve: {
    alias: {
      "@data": resolve(__dirname, "../data"),
    },
  },
});
