import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})