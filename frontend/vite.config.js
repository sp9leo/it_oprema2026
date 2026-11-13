import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'fs'
import { execFileSync } from "child_process";
import { defineConfig } from 'vite'

function getBenchPath() {
  let currentDir = process.cwd()
  let prevDir = null
  while (currentDir !== prevDir) {
    if (fs.existsSync(path.join(currentDir, 'Procfile'))) {
      return path.join(currentDir)
    }
    prevDir = currentDir
    currentDir = path.resolve(currentDir, '..')
  }
}

function tryDetectSite() {
  try {
    const benchPath = getBenchPath()
    if (!benchPath) return null
    const output = execFileSync(
      "bench",
      ["--site", "all", "list-apps", "--format", "json"],
      {
        cwd: benchPath,
        stdio: ["ignore", "pipe", fs.openSync("/dev/null", "w")],
        encoding: "utf-8",
        timeout: 5000,
      }
    )
    const sites = JSON.parse(output)
    const app_name = path.basename(path.dirname(path.resolve(process.cwd())))
    for (const info of sites) {
      if (info.apps.includes(app_name)) {
        return info.site
      }
    }
  } catch (e) {
    // bench not available or no site found
  }
  return null
}

function detectProxyTarget() {
  const site = tryDetectSite()
  if (site) return `http://${site}:8000`
  return process.env.VITE_BACKEND_URL || 'http://muri.osaz.si'
}

export default defineConfig({
  // Served standalone (Docker/nginx) at "/"; set VITE_BASE_PATH=/it_oprema2026/
  // when the bundle is mounted under the Frappe app path instead.
  base: process.env.VITE_BASE_PATH || '/',

  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
  },

  plugins: [
    vue(),
    {
      name: 'custom-start-message',
      configureServer(server) {
        server.httpServer?.once('listening', () => {
          const site = tryDetectSite()
          const base = server.config.base
          if (site) {
            const info = server.config.server
            const url = new URL("http://localhost")
            url.hostname = site
            url.port = info.port
            url.pathname = base
            console.log("Open in Browser: " + url.href)
          } else {
            const info = server.config.server
            console.log(`Vite dev server running at http://localhost:${info.port}${base}`)
          }
        })
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: true,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: detectProxyTarget(),
        changeOrigin: true,
      },
      '/assets': {
        target: detectProxyTarget(),
        changeOrigin: true,
      },
      '/it_oprema2026/app': {
        target: detectProxyTarget(),
        changeOrigin: true,
        pathRewrite: { '^/it_oprema2026': '' },
      },
      '/files': {
        target: detectProxyTarget(),
        changeOrigin: true,
      },
      '/private': {
        target: detectProxyTarget(),
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
