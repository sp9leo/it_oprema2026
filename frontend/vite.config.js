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
  return process.env.VITE_BACKEND_URL || 'http://192.168.1.111:8000'
}

export default defineConfig({
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
          if (site) {
            const info = server.config.server
            const url = new URL("http://localhost")
            url.hostname = site
            url.port = info.port
            url.pathname = "/it_oprema2026"
            console.log("Open in Browser: " + url.href)
          } else {
            const info = server.config.server
            console.log(`Vite dev server running at http://localhost:${info.port}/it_oprema2026`)
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
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
