import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves project sites from a /<repo-name>/ subpath.
  // Only apply the subpath when building for GitHub Pages (set by the
  // deploy workflow); local dev/preview stay at the root path.
  base: process.env.GITHUB_PAGES ? '/sqlplan-web/' : '/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
