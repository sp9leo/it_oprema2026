import vue from '@vitejs/plugin-vue'
import frappeui from 'frappe-ui/vite'
import path from 'path'
import fs from 'fs'
import { execFileSync } from "child_process";
import { defineConfig } from 'vite'

function getBenchPath() {
  let currentDir = process.cwd()
  while (currentDir !== '/') {
    if (fs.existsSync(path.join(currentDir, 'Procfile'))) {
      return path.join(currentDir)
    }
    currentDir = path.resolve(currentDir, '..')
  }
}

function getAppsSiteMap() {
  const output = execFileSync(
    "bench",
    ["--site", "all", "list-apps", "--format", "json"],
    {
      cwd: getBenchPath(),
      stdio: ["ignore", "pipe", fs.openSync("/dev/null", "w")],
      encoding: "utf-8"
    }
  )
  return JSON.parse(output)
}

function getCurrentSite(sites, app_name){
  for (const info of sites) {
    if (info.apps.includes(app_name)) {
      return info.site
    }
  }
  return null
}

export default defineConfig({
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
  },
  plugins: [
    vue(),
    frappeui({
      frappeProxy: true,
      lucideIcons: true,
      jinjaBootData: true,
      buildConfig: {
        indexHtmlPath: "../it_oprema2026/www/it_oprema2026.html",
      },
    }),
    {
      name: 'custom-start-message',
      configureServer(server) {
        server.httpServer?.once('listening', () => {
          let sites = getAppsSiteMap()
          let app_name = path.basename(path.dirname(path.resolve(process.cwd())))
          let currentSite = getCurrentSite(sites, app_name)
          if (currentSite) {
            const info = server.config.server
            const url = new URL("http://localhost")
            url.hostname = currentSite
            url.port = info.port
            url.pathname = "/it_oprema2026"
            console.log("Open in Browser: " + url.href)
          }
        })
      }
    }
  ],
  server: {
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'tailwind.config.js': path.resolve(__dirname, 'tailwind.config.js'),
    },
  },
  optimizeDeps: {
    include: [
      'frappe-ui > feather-icons',
      'showdown',
      'tailwind.config.js',
      'engine.io-client',
      'highlight.js/lib/core',
      'interactjs'
    ],
  },
})
