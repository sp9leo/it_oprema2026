// vite.config.js
import vue from "file:///D:/OpenProject/it_oprema2026/frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import frappeui from "file:///D:/OpenProject/it_oprema2026/frontend/node_modules/frappe-ui/vite/index.js";
import path from "path";
import fs from "fs";
import { execFileSync } from "child_process";
import { defineConfig } from "file:///D:/OpenProject/it_oprema2026/frontend/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "D:\\OpenProject\\it_oprema2026\\frontend";
var VIRTUAL_PREFIX = "~icons/lucide/";
var RESOLVED_PREFIX = "virtual:lucide/";
function lucideIconsPlugin() {
  const warnedIcons = /* @__PURE__ */ new Set();
  return {
    name: "lucide-icons-resolver",
    resolveId(id) {
      if (id.startsWith(VIRTUAL_PREFIX)) {
        return RESOLVED_PREFIX + id.slice(VIRTUAL_PREFIX.length);
      }
    },
    load(id) {
      const normalized = id.split("?", 1)[0];
      if (!normalized.startsWith(RESOLVED_PREFIX))
        return;
      const iconName = normalized.slice(RESOLVED_PREFIX.length);
      if (!warnedIcons.has(iconName)) {
        warnedIcons.add(iconName);
        this.warn(`[lucide-icons] placeholder for "${iconName}"`);
      }
      return `
import { h } from 'vue'
export default {
  inheritAttrs: false,
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '24',
      height: '24',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.5',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      ...this.$attrs,
      innerHTML: '<circle cx="12" cy="12" r="10"/>',
    })
  }
}
`;
    }
  };
}
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
var vite_config_default = defineConfig({
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false"
  },
  plugins: [
    vue(),
    frappeui({
      frappeProxy: true,
      lucideIcons: false,
      jinjaBootData: true,
      buildConfig: {
        indexHtmlPath: "../it_oprema2026/www/it_oprema2026.html"
      }
    }),
    lucideIconsPlugin(),
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
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "src"),
      "tailwind.config.js": path.resolve(__vite_injected_original_dirname, "tailwind.config.js")
    }
  },
  optimizeDeps: {
    include: [
      "frappe-ui > feather-icons",
      "tailwind.config.js",
      "engine.io-client",
      "highlight.js/lib/core",
      "interactjs"
    ]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxPcGVuUHJvamVjdFxcXFxpdF9vcHJlbWEyMDI2XFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxPcGVuUHJvamVjdFxcXFxpdF9vcHJlbWEyMDI2XFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9PcGVuUHJvamVjdC9pdF9vcHJlbWEyMDI2L2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgZnJhcHBldWkgZnJvbSAnZnJhcHBlLXVpL3ZpdGUnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGZzIGZyb20gJ2ZzJ1xuaW1wb3J0IHsgZXhlY0ZpbGVTeW5jIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5cbmNvbnN0IFZJUlRVQUxfUFJFRklYID0gJ35pY29ucy9sdWNpZGUvJ1xuY29uc3QgUkVTT0xWRURfUFJFRklYID0gJ3ZpcnR1YWw6bHVjaWRlLydcblxuZnVuY3Rpb24gbHVjaWRlSWNvbnNQbHVnaW4oKSB7XG4gIGNvbnN0IHdhcm5lZEljb25zID0gbmV3IFNldCgpXG4gIHJldHVybiB7XG4gICAgbmFtZTogJ2x1Y2lkZS1pY29ucy1yZXNvbHZlcicsXG4gICAgcmVzb2x2ZUlkKGlkKSB7XG4gICAgICBpZiAoaWQuc3RhcnRzV2l0aChWSVJUVUFMX1BSRUZJWCkpIHtcbiAgICAgICAgcmV0dXJuIFJFU09MVkVEX1BSRUZJWCArIGlkLnNsaWNlKFZJUlRVQUxfUFJFRklYLmxlbmd0aClcbiAgICAgIH1cbiAgICB9LFxuICAgIGxvYWQoaWQpIHtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBpZC5zcGxpdCgnPycsIDEpWzBdXG4gICAgICBpZiAoIW5vcm1hbGl6ZWQuc3RhcnRzV2l0aChSRVNPTFZFRF9QUkVGSVgpKSByZXR1cm5cbiAgICAgIGNvbnN0IGljb25OYW1lID0gbm9ybWFsaXplZC5zbGljZShSRVNPTFZFRF9QUkVGSVgubGVuZ3RoKVxuICAgICAgaWYgKCF3YXJuZWRJY29ucy5oYXMoaWNvbk5hbWUpKSB7XG4gICAgICAgIHdhcm5lZEljb25zLmFkZChpY29uTmFtZSlcbiAgICAgICAgdGhpcy53YXJuKGBbbHVjaWRlLWljb25zXSBwbGFjZWhvbGRlciBmb3IgXCIke2ljb25OYW1lfVwiYClcbiAgICAgIH1cbiAgICAgIHJldHVybiBgXG5pbXBvcnQgeyBoIH0gZnJvbSAndnVlJ1xuZXhwb3J0IGRlZmF1bHQge1xuICBpbmhlcml0QXR0cnM6IGZhbHNlLFxuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuIGgoJ3N2ZycsIHtcbiAgICAgIHhtbG5zOiAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLFxuICAgICAgd2lkdGg6ICcyNCcsXG4gICAgICBoZWlnaHQ6ICcyNCcsXG4gICAgICB2aWV3Qm94OiAnMCAwIDI0IDI0JyxcbiAgICAgIGZpbGw6ICdub25lJyxcbiAgICAgIHN0cm9rZTogJ2N1cnJlbnRDb2xvcicsXG4gICAgICAnc3Ryb2tlLXdpZHRoJzogJzEuNScsXG4gICAgICAnc3Ryb2tlLWxpbmVjYXAnOiAncm91bmQnLFxuICAgICAgJ3N0cm9rZS1saW5lam9pbic6ICdyb3VuZCcsXG4gICAgICAuLi50aGlzLiRhdHRycyxcbiAgICAgIGlubmVySFRNTDogJzxjaXJjbGUgY3g9XCIxMlwiIGN5PVwiMTJcIiByPVwiMTBcIi8+JyxcbiAgICB9KVxuICB9XG59XG5gXG4gICAgfSxcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRCZW5jaFBhdGgoKSB7XG4gIGxldCBjdXJyZW50RGlyID0gcHJvY2Vzcy5jd2QoKVxuICB3aGlsZSAoY3VycmVudERpciAhPT0gJy8nKSB7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKGN1cnJlbnREaXIsICdQcm9jZmlsZScpKSkge1xuICAgICAgcmV0dXJuIHBhdGguam9pbihjdXJyZW50RGlyKVxuICAgIH1cbiAgICBjdXJyZW50RGlyID0gcGF0aC5yZXNvbHZlKGN1cnJlbnREaXIsICcuLicpXG4gIH1cbn1cblxuZnVuY3Rpb24gdHJ5RGV0ZWN0U2l0ZSgpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBiZW5jaFBhdGggPSBnZXRCZW5jaFBhdGgoKVxuICAgIGlmICghYmVuY2hQYXRoKSByZXR1cm4gbnVsbFxuICAgIGNvbnN0IG91dHB1dCA9IGV4ZWNGaWxlU3luYyhcbiAgICAgIFwiYmVuY2hcIixcbiAgICAgIFtcIi0tc2l0ZVwiLCBcImFsbFwiLCBcImxpc3QtYXBwc1wiLCBcIi0tZm9ybWF0XCIsIFwianNvblwiXSxcbiAgICAgIHtcbiAgICAgICAgY3dkOiBiZW5jaFBhdGgsXG4gICAgICAgIHN0ZGlvOiBbXCJpZ25vcmVcIiwgXCJwaXBlXCIsIGZzLm9wZW5TeW5jKFwiL2Rldi9udWxsXCIsIFwid1wiKV0sXG4gICAgICAgIGVuY29kaW5nOiBcInV0Zi04XCIsXG4gICAgICAgIHRpbWVvdXQ6IDUwMDAsXG4gICAgICB9XG4gICAgKVxuICAgIGNvbnN0IHNpdGVzID0gSlNPTi5wYXJzZShvdXRwdXQpXG4gICAgY29uc3QgYXBwX25hbWUgPSBwYXRoLmJhc2VuYW1lKHBhdGguZGlybmFtZShwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSkpKVxuICAgIGZvciAoY29uc3QgaW5mbyBvZiBzaXRlcykge1xuICAgICAgaWYgKGluZm8uYXBwcy5pbmNsdWRlcyhhcHBfbmFtZSkpIHtcbiAgICAgICAgcmV0dXJuIGluZm8uc2l0ZVxuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIGJlbmNoIG5vdCBhdmFpbGFibGUgb3Igbm8gc2l0ZSBmb3VuZFxuICB9XG4gIHJldHVybiBudWxsXG59XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGRlZmluZToge1xuICAgIF9fVlVFX1BST0RfSFlEUkFUSU9OX01JU01BVENIX0RFVEFJTFNfXzogJ2ZhbHNlJyxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHZ1ZSgpLFxuICAgIGZyYXBwZXVpKHtcbiAgICAgIGZyYXBwZVByb3h5OiB0cnVlLFxuICAgICAgbHVjaWRlSWNvbnM6IGZhbHNlLFxuICAgICAgamluamFCb290RGF0YTogdHJ1ZSxcbiAgICAgIGJ1aWxkQ29uZmlnOiB7XG4gICAgICAgIGluZGV4SHRtbFBhdGg6IFwiLi4vaXRfb3ByZW1hMjAyNi93d3cvaXRfb3ByZW1hMjAyNi5odG1sXCIsXG4gICAgICB9LFxuICAgIH0pLFxuICAgIGx1Y2lkZUljb25zUGx1Z2luKCksXG4gICAge1xuICAgICAgbmFtZTogJ2N1c3RvbS1zdGFydC1tZXNzYWdlJyxcbiAgICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgICAgc2VydmVyLmh0dHBTZXJ2ZXI/Lm9uY2UoJ2xpc3RlbmluZycsICgpID0+IHtcbiAgICAgICAgICBjb25zdCBzaXRlID0gdHJ5RGV0ZWN0U2l0ZSgpXG4gICAgICAgICAgaWYgKHNpdGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBzZXJ2ZXIuY29uZmlnLnNlcnZlclxuICAgICAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChcImh0dHA6Ly9sb2NhbGhvc3RcIilcbiAgICAgICAgICAgIHVybC5ob3N0bmFtZSA9IHNpdGVcbiAgICAgICAgICAgIHVybC5wb3J0ID0gaW5mby5wb3J0XG4gICAgICAgICAgICB1cmwucGF0aG5hbWUgPSBcIi9pdF9vcHJlbWEyMDI2XCJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiT3BlbiBpbiBCcm93c2VyOiBcIiArIHVybC5ocmVmKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBpbmZvID0gc2VydmVyLmNvbmZpZy5zZXJ2ZXJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBWaXRlIGRldiBzZXJ2ZXIgcnVubmluZyBhdCBodHRwOi8vbG9jYWxob3N0OiR7aW5mby5wb3J0fS9pdF9vcHJlbWEyMDI2YClcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICBdLFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiAnMC4wLjAuMCcsXG4gICAgcG9ydDogODA4MCxcbiAgICBhbGxvd2VkSG9zdHM6IHRydWUsXG4gICAgd2F0Y2g6IHtcbiAgICAgIHVzZVBvbGxpbmc6IHRydWUsXG4gICAgfSxcbiAgfSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMnKSxcbiAgICAgICd0YWlsd2luZC5jb25maWcuanMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAndGFpbHdpbmQuY29uZmlnLmpzJyksXG4gICAgfSxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogW1xuICAgICAgJ2ZyYXBwZS11aSA+IGZlYXRoZXItaWNvbnMnLFxuICAgICAgJ3RhaWx3aW5kLmNvbmZpZy5qcycsXG4gICAgICAnZW5naW5lLmlvLWNsaWVudCcsXG4gICAgICAnaGlnaGxpZ2h0LmpzL2xpYi9jb3JlJyxcbiAgICAgICdpbnRlcmFjdGpzJ1xuICAgIF0sXG4gIH0sXG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5UyxPQUFPLFNBQVM7QUFDelQsT0FBTyxjQUFjO0FBQ3JCLE9BQU8sVUFBVTtBQUNqQixPQUFPLFFBQVE7QUFDZixTQUFTLG9CQUFvQjtBQUM3QixTQUFTLG9CQUFvQjtBQUw3QixJQUFNLG1DQUFtQztBQU96QyxJQUFNLGlCQUFpQjtBQUN2QixJQUFNLGtCQUFrQjtBQUV4QixTQUFTLG9CQUFvQjtBQUMzQixRQUFNLGNBQWMsb0JBQUksSUFBSTtBQUM1QixTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixVQUFVLElBQUk7QUFDWixVQUFJLEdBQUcsV0FBVyxjQUFjLEdBQUc7QUFDakMsZUFBTyxrQkFBa0IsR0FBRyxNQUFNLGVBQWUsTUFBTTtBQUFBLE1BQ3pEO0FBQUEsSUFDRjtBQUFBLElBQ0EsS0FBSyxJQUFJO0FBQ1AsWUFBTSxhQUFhLEdBQUcsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO0FBQ3JDLFVBQUksQ0FBQyxXQUFXLFdBQVcsZUFBZTtBQUFHO0FBQzdDLFlBQU0sV0FBVyxXQUFXLE1BQU0sZ0JBQWdCLE1BQU07QUFDeEQsVUFBSSxDQUFDLFlBQVksSUFBSSxRQUFRLEdBQUc7QUFDOUIsb0JBQVksSUFBSSxRQUFRO0FBQ3hCLGFBQUssS0FBSyxtQ0FBbUMsUUFBUSxHQUFHO0FBQUEsTUFDMUQ7QUFDQSxhQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBcUJUO0FBQUEsRUFDRjtBQUNGO0FBRUEsU0FBUyxlQUFlO0FBQ3RCLE1BQUksYUFBYSxRQUFRLElBQUk7QUFDN0IsU0FBTyxlQUFlLEtBQUs7QUFDekIsUUFBSSxHQUFHLFdBQVcsS0FBSyxLQUFLLFlBQVksVUFBVSxDQUFDLEdBQUc7QUFDcEQsYUFBTyxLQUFLLEtBQUssVUFBVTtBQUFBLElBQzdCO0FBQ0EsaUJBQWEsS0FBSyxRQUFRLFlBQVksSUFBSTtBQUFBLEVBQzVDO0FBQ0Y7QUFFQSxTQUFTLGdCQUFnQjtBQUN2QixNQUFJO0FBQ0YsVUFBTSxZQUFZLGFBQWE7QUFDL0IsUUFBSSxDQUFDO0FBQVcsYUFBTztBQUN2QixVQUFNLFNBQVM7QUFBQSxNQUNiO0FBQUEsTUFDQSxDQUFDLFVBQVUsT0FBTyxhQUFhLFlBQVksTUFBTTtBQUFBLE1BQ2pEO0FBQUEsUUFDRSxLQUFLO0FBQUEsUUFDTCxPQUFPLENBQUMsVUFBVSxRQUFRLEdBQUcsU0FBUyxhQUFhLEdBQUcsQ0FBQztBQUFBLFFBQ3ZELFVBQVU7QUFBQSxRQUNWLFNBQVM7QUFBQSxNQUNYO0FBQUEsSUFDRjtBQUNBLFVBQU0sUUFBUSxLQUFLLE1BQU0sTUFBTTtBQUMvQixVQUFNLFdBQVcsS0FBSyxTQUFTLEtBQUssUUFBUSxLQUFLLFFBQVEsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3hFLGVBQVcsUUFBUSxPQUFPO0FBQ3hCLFVBQUksS0FBSyxLQUFLLFNBQVMsUUFBUSxHQUFHO0FBQ2hDLGVBQU8sS0FBSztBQUFBLE1BQ2Q7QUFBQSxJQUNGO0FBQUEsRUFDRixTQUFTLEdBQUc7QUFBQSxFQUVaO0FBQ0EsU0FBTztBQUNUO0FBRUEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsUUFBUTtBQUFBLElBQ04seUNBQXlDO0FBQUEsRUFDM0M7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLElBQUk7QUFBQSxJQUNKLFNBQVM7QUFBQSxNQUNQLGFBQWE7QUFBQSxNQUNiLGFBQWE7QUFBQSxNQUNiLGVBQWU7QUFBQSxNQUNmLGFBQWE7QUFBQSxRQUNYLGVBQWU7QUFBQSxNQUNqQjtBQUFBLElBQ0YsQ0FBQztBQUFBLElBQ0Qsa0JBQWtCO0FBQUEsSUFDbEI7QUFBQSxNQUNFLE1BQU07QUFBQSxNQUNOLGdCQUFnQixRQUFRO0FBMUc5QjtBQTJHUSxxQkFBTyxlQUFQLG1CQUFtQixLQUFLLGFBQWEsTUFBTTtBQUN6QyxnQkFBTSxPQUFPLGNBQWM7QUFDM0IsY0FBSSxNQUFNO0FBQ1Isa0JBQU0sT0FBTyxPQUFPLE9BQU87QUFDM0Isa0JBQU0sTUFBTSxJQUFJLElBQUksa0JBQWtCO0FBQ3RDLGdCQUFJLFdBQVc7QUFDZixnQkFBSSxPQUFPLEtBQUs7QUFDaEIsZ0JBQUksV0FBVztBQUNmLG9CQUFRLElBQUksc0JBQXNCLElBQUksSUFBSTtBQUFBLFVBQzVDLE9BQU87QUFDTCxrQkFBTSxPQUFPLE9BQU8sT0FBTztBQUMzQixvQkFBUSxJQUFJLCtDQUErQyxLQUFLLElBQUksZ0JBQWdCO0FBQUEsVUFDdEY7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixjQUFjO0FBQUEsSUFDZCxPQUFPO0FBQUEsTUFDTCxZQUFZO0FBQUEsSUFDZDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLEtBQUs7QUFBQSxNQUNsQyxzQkFBc0IsS0FBSyxRQUFRLGtDQUFXLG9CQUFvQjtBQUFBLElBQ3BFO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUztBQUFBLE1BQ1A7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
