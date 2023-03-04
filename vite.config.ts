import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { crx } from '@crxjs/vite-plugin'
import { resolve } from 'path'
import manifest from './manifest.json' // Node 14 & 16
import svgLoader from 'vite-svg-loader'
// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      // add any html pages here
      input: {
        // output file at '/index.html'
        main: resolve(__dirname, 'index.html'),
        // output file at '/option.html'
        option: resolve(__dirname, 'option.html'),
      },
    },
  },
  plugins: [
    vue(),
    svgLoader(),
    crx({ manifest }),
  ],
})
