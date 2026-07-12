import vue from '@vitejs/plugin-vue'
import frappeui from 'frappe-ui/vite'
import path from 'path'
import fs from 'fs'
import { execFileSync } from "child_process";
import { defineConfig } from 'vite'

const VIRTUAL_PREFIX = '~icons/lucide/'
const RESOLVED_PREFIX = 'virtual:lucide/'

function lucideIconsPlugin() {
  const warnedIcons = new Set()
  return {
    name: 'lucide-icons-resolver',
    resolveId(id) {
      if (id.startsWith(VIRTUAL_PREFIX)) {
        return RESOLVED_PREFIX + id.slice(VIRTUAL_PREFIX.length)
      }
    },
    load(id) {
      const normalized = id.split('?', 1)[0]
      if (!normalized.startsWith(RESOLVED_PREFIX)) return
      const iconName = normalized.slice(RESOLVED_PREFIX.length)
      if (!warnedIcons.has(iconName)) {
        warnedIcons.add(iconName)
        this.warn(`[lucide-icons] placeholder for "${iconName}"`)
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
`
    },
  }
}

function getBenchPath() {
  let currentDir = process.cwd()
  while (currentDir !== '/') {
    if (fs.existsSync(path.join(currentDir, 'Procfile'))) {
      return path.join(currentDir)
    }
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

export default defineConfig({
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
  },
  plugins: [
    vue(),
    frappeui({
      frappeProxy: true,
      lucideIcons: false,
      jinjaBootData: true,
      buildConfig: {
        indexHtmlPath: "../it_oprema2026/www/it_oprema2026.html",
      },
    }),
    lucideIconsPlugin(),
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
      'tailwind.config.js',
      'engine.io-client',
      'highlight.js/lib/core',
      'interactjs'
    ],
  },
})
