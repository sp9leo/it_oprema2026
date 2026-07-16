// vite.config.js
import vue from "file:///D:/OpenProject/it_oprema2026/frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";
import fs from "fs";
import { execFileSync } from "child_process";
import { defineConfig } from "file:///D:/OpenProject/it_oprema2026/frontend/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "D:\\OpenProject\\it_oprema2026\\frontend";
function getBenchPath() {
  let currentDir = process.cwd();
  while (currentDir !== "/") {
    if (fs.existsSync(path.join(currentDir, "Procfile"))) {
      return path.join(currentDir);
    }
    currentDir = path.resolve(currentDir, "..");
  }
}
function tryDetectSite() {
  try {
    const benchPath = getBenchPath();
    if (!benchPath)
      return null;
    const output = execFileSync(
      "bench",
      ["--site", "all", "list-apps", "--format", "json"],
      {
        cwd: benchPath,
        stdio: ["ignore", "pipe", fs.openSync("/dev/null", "w")],
        encoding: "utf-8",
        timeout: 5e3
      }
    );
    const sites = JSON.parse(output);
    const app_name = path.basename(path.dirname(path.resolve(process.cwd())));
    for (const info of sites) {
      if (info.apps.includes(app_name)) {
        return info.site;
      }
    }
  } catch (e) {
  }
  return null;
}
function detectProxyTarget() {
  const site = tryDetectSite();
  if (site)
    return `http://${site}:8000`;
  return process.env.VITE_BACKEND_URL || "http://192.168.1.111:8000";
}
var vite_config_default = defineConfig({
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false"
  },
  plugins: [
    vue(),
    {
      name: "custom-start-message",
      configureServer(server) {
        var _a;
        (_a = server.httpServer) == null ? void 0 : _a.once("listening", () => {
          const site = tryDetectSite();
          if (site) {
            const info = server.config.server;
            const url = new URL("http://localhost");
            url.hostname = site;
            url.port = info.port;
            url.pathname = "/it_oprema2026";
            console.log("Open in Browser: " + url.href);
          } else {
            const info = server.config.server;
            console.log(`Vite dev server running at http://localhost:${info.port}/it_oprema2026`);
          }
        });
      }
    }
  ],
  server: {
    host: "0.0.0.0",
    port: 8080,
    allowedHosts: true,
    watch: {
      usePolling: true
    },
    proxy: {
      "/api": {
        target: detectProxyTarget(),
        changeOrigin: true
      },
      "/assets": {
        target: detectProxyTarget(),
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "src")
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxPcGVuUHJvamVjdFxcXFxpdF9vcHJlbWEyMDI2XFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxPcGVuUHJvamVjdFxcXFxpdF9vcHJlbWEyMDI2XFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9PcGVuUHJvamVjdC9pdF9vcHJlbWEyMDI2L2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGZzIGZyb20gJ2ZzJ1xuaW1wb3J0IHsgZXhlY0ZpbGVTeW5jIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5cbmZ1bmN0aW9uIGdldEJlbmNoUGF0aCgpIHtcbiAgbGV0IGN1cnJlbnREaXIgPSBwcm9jZXNzLmN3ZCgpXG4gIHdoaWxlIChjdXJyZW50RGlyICE9PSAnLycpIHtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oY3VycmVudERpciwgJ1Byb2NmaWxlJykpKSB7XG4gICAgICByZXR1cm4gcGF0aC5qb2luKGN1cnJlbnREaXIpXG4gICAgfVxuICAgIGN1cnJlbnREaXIgPSBwYXRoLnJlc29sdmUoY3VycmVudERpciwgJy4uJylcbiAgfVxufVxuXG5mdW5jdGlvbiB0cnlEZXRlY3RTaXRlKCkge1xuICB0cnkge1xuICAgIGNvbnN0IGJlbmNoUGF0aCA9IGdldEJlbmNoUGF0aCgpXG4gICAgaWYgKCFiZW5jaFBhdGgpIHJldHVybiBudWxsXG4gICAgY29uc3Qgb3V0cHV0ID0gZXhlY0ZpbGVTeW5jKFxuICAgICAgXCJiZW5jaFwiLFxuICAgICAgW1wiLS1zaXRlXCIsIFwiYWxsXCIsIFwibGlzdC1hcHBzXCIsIFwiLS1mb3JtYXRcIiwgXCJqc29uXCJdLFxuICAgICAge1xuICAgICAgICBjd2Q6IGJlbmNoUGF0aCxcbiAgICAgICAgc3RkaW86IFtcImlnbm9yZVwiLCBcInBpcGVcIiwgZnMub3BlblN5bmMoXCIvZGV2L251bGxcIiwgXCJ3XCIpXSxcbiAgICAgICAgZW5jb2Rpbmc6IFwidXRmLThcIixcbiAgICAgICAgdGltZW91dDogNTAwMCxcbiAgICAgIH1cbiAgICApXG4gICAgY29uc3Qgc2l0ZXMgPSBKU09OLnBhcnNlKG91dHB1dClcbiAgICBjb25zdCBhcHBfbmFtZSA9IHBhdGguYmFzZW5hbWUocGF0aC5kaXJuYW1lKHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpKSkpXG4gICAgZm9yIChjb25zdCBpbmZvIG9mIHNpdGVzKSB7XG4gICAgICBpZiAoaW5mby5hcHBzLmluY2x1ZGVzKGFwcF9uYW1lKSkge1xuICAgICAgICByZXR1cm4gaW5mby5zaXRlXG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gYmVuY2ggbm90IGF2YWlsYWJsZSBvciBubyBzaXRlIGZvdW5kXG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cblxuZnVuY3Rpb24gZGV0ZWN0UHJveHlUYXJnZXQoKSB7XG4gIGNvbnN0IHNpdGUgPSB0cnlEZXRlY3RTaXRlKClcbiAgaWYgKHNpdGUpIHJldHVybiBgaHR0cDovLyR7c2l0ZX06ODAwMGBcbiAgcmV0dXJuIHByb2Nlc3MuZW52LlZJVEVfQkFDS0VORF9VUkwgfHwgJ2h0dHA6Ly8xOTIuMTY4LjEuMTExOjgwMDAnXG59XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGRlZmluZToge1xuICAgIF9fVlVFX1BST0RfSFlEUkFUSU9OX01JU01BVENIX0RFVEFJTFNfXzogJ2ZhbHNlJyxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHZ1ZSgpLFxuICAgIHtcbiAgICAgIG5hbWU6ICdjdXN0b20tc3RhcnQtbWVzc2FnZScsXG4gICAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XG4gICAgICAgIHNlcnZlci5odHRwU2VydmVyPy5vbmNlKCdsaXN0ZW5pbmcnLCAoKSA9PiB7XG4gICAgICAgICAgY29uc3Qgc2l0ZSA9IHRyeURldGVjdFNpdGUoKVxuICAgICAgICAgIGlmIChzaXRlKSB7XG4gICAgICAgICAgICBjb25zdCBpbmZvID0gc2VydmVyLmNvbmZpZy5zZXJ2ZXJcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IG5ldyBVUkwoXCJodHRwOi8vbG9jYWxob3N0XCIpXG4gICAgICAgICAgICB1cmwuaG9zdG5hbWUgPSBzaXRlXG4gICAgICAgICAgICB1cmwucG9ydCA9IGluZm8ucG9ydFxuICAgICAgICAgICAgdXJsLnBhdGhuYW1lID0gXCIvaXRfb3ByZW1hMjAyNlwiXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk9wZW4gaW4gQnJvd3NlcjogXCIgKyB1cmwuaHJlZilcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgaW5mbyA9IHNlcnZlci5jb25maWcuc2VydmVyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgVml0ZSBkZXYgc2VydmVyIHJ1bm5pbmcgYXQgaHR0cDovL2xvY2FsaG9zdDoke2luZm8ucG9ydH0vaXRfb3ByZW1hMjAyNmApXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgXSxcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogJzAuMC4wLjAnLFxuICAgIHBvcnQ6IDgwODAsXG4gICAgYWxsb3dlZEhvc3RzOiB0cnVlLFxuICAgIHdhdGNoOiB7XG4gICAgICB1c2VQb2xsaW5nOiB0cnVlLFxuICAgIH0sXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6IGRldGVjdFByb3h5VGFyZ2V0KCksXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICAnL2Fzc2V0cyc6IHtcbiAgICAgICAgdGFyZ2V0OiBkZXRlY3RQcm94eVRhcmdldCgpLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjJyksXG4gICAgfSxcbiAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlTLE9BQU8sU0FBUztBQUN6VCxPQUFPLFVBQVU7QUFDakIsT0FBTyxRQUFRO0FBQ2YsU0FBUyxvQkFBb0I7QUFDN0IsU0FBUyxvQkFBb0I7QUFKN0IsSUFBTSxtQ0FBbUM7QUFNekMsU0FBUyxlQUFlO0FBQ3RCLE1BQUksYUFBYSxRQUFRLElBQUk7QUFDN0IsU0FBTyxlQUFlLEtBQUs7QUFDekIsUUFBSSxHQUFHLFdBQVcsS0FBSyxLQUFLLFlBQVksVUFBVSxDQUFDLEdBQUc7QUFDcEQsYUFBTyxLQUFLLEtBQUssVUFBVTtBQUFBLElBQzdCO0FBQ0EsaUJBQWEsS0FBSyxRQUFRLFlBQVksSUFBSTtBQUFBLEVBQzVDO0FBQ0Y7QUFFQSxTQUFTLGdCQUFnQjtBQUN2QixNQUFJO0FBQ0YsVUFBTSxZQUFZLGFBQWE7QUFDL0IsUUFBSSxDQUFDO0FBQVcsYUFBTztBQUN2QixVQUFNLFNBQVM7QUFBQSxNQUNiO0FBQUEsTUFDQSxDQUFDLFVBQVUsT0FBTyxhQUFhLFlBQVksTUFBTTtBQUFBLE1BQ2pEO0FBQUEsUUFDRSxLQUFLO0FBQUEsUUFDTCxPQUFPLENBQUMsVUFBVSxRQUFRLEdBQUcsU0FBUyxhQUFhLEdBQUcsQ0FBQztBQUFBLFFBQ3ZELFVBQVU7QUFBQSxRQUNWLFNBQVM7QUFBQSxNQUNYO0FBQUEsSUFDRjtBQUNBLFVBQU0sUUFBUSxLQUFLLE1BQU0sTUFBTTtBQUMvQixVQUFNLFdBQVcsS0FBSyxTQUFTLEtBQUssUUFBUSxLQUFLLFFBQVEsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3hFLGVBQVcsUUFBUSxPQUFPO0FBQ3hCLFVBQUksS0FBSyxLQUFLLFNBQVMsUUFBUSxHQUFHO0FBQ2hDLGVBQU8sS0FBSztBQUFBLE1BQ2Q7QUFBQSxJQUNGO0FBQUEsRUFDRixTQUFTLEdBQUc7QUFBQSxFQUVaO0FBQ0EsU0FBTztBQUNUO0FBRUEsU0FBUyxvQkFBb0I7QUFDM0IsUUFBTSxPQUFPLGNBQWM7QUFDM0IsTUFBSTtBQUFNLFdBQU8sVUFBVSxJQUFJO0FBQy9CLFNBQU8sUUFBUSxJQUFJLG9CQUFvQjtBQUN6QztBQUVBLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFFBQVE7QUFBQSxJQUNOLHlDQUF5QztBQUFBLEVBQzNDO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsSUFDSjtBQUFBLE1BQ0UsTUFBTTtBQUFBLE1BQ04sZ0JBQWdCLFFBQVE7QUF6RDlCO0FBMERRLHFCQUFPLGVBQVAsbUJBQW1CLEtBQUssYUFBYSxNQUFNO0FBQ3pDLGdCQUFNLE9BQU8sY0FBYztBQUMzQixjQUFJLE1BQU07QUFDUixrQkFBTSxPQUFPLE9BQU8sT0FBTztBQUMzQixrQkFBTSxNQUFNLElBQUksSUFBSSxrQkFBa0I7QUFDdEMsZ0JBQUksV0FBVztBQUNmLGdCQUFJLE9BQU8sS0FBSztBQUNoQixnQkFBSSxXQUFXO0FBQ2Ysb0JBQVEsSUFBSSxzQkFBc0IsSUFBSSxJQUFJO0FBQUEsVUFDNUMsT0FBTztBQUNMLGtCQUFNLE9BQU8sT0FBTyxPQUFPO0FBQzNCLG9CQUFRLElBQUksK0NBQStDLEtBQUssSUFBSSxnQkFBZ0I7QUFBQSxVQUN0RjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxJQUNkLE9BQU87QUFBQSxNQUNMLFlBQVk7QUFBQSxJQUNkO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRLGtCQUFrQjtBQUFBLFFBQzFCLGNBQWM7QUFBQSxNQUNoQjtBQUFBLE1BQ0EsV0FBVztBQUFBLFFBQ1QsUUFBUSxrQkFBa0I7QUFBQSxRQUMxQixjQUFjO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsS0FBSztBQUFBLElBQ3BDO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
