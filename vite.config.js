import { defineConfig } from "vite"
import { resolve, extname, dirname, basename } from "path"
import { readdirSync, statSync } from "fs"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const input = Object.fromEntries(
  readdirSync(__dirname)
    .filter(name => extname(name) === ".html" && statSync(resolve(__dirname, name)).isFile())
    .map(name => [basename(name, ".html"), resolve(__dirname, name)])
)

export default defineConfig({
  build: {
    rollupOptions: { input }
  }
})
