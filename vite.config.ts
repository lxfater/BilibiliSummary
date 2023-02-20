import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { crx } from '@crxjs/vite-plugin'
import { resolve } from 'path'
import manifest from './manifest.json' // Node 14 & 16

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      // add any html pages here
      input: {
        // output file at '/index.html'
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  plugins: [
    vue(),
    crx({ manifest }),
  ],
})
