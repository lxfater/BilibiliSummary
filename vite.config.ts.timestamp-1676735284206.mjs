// vite.config.ts
import { defineConfig } from "file:///D:/projects/project/BilibiliSummary/node_modules/vite/dist/node/index.js";
import vue from "file:///D:/projects/project/BilibiliSummary/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { crx } from "file:///D:/projects/project/BilibiliSummary/node_modules/@crxjs/vite-plugin/dist/index.mjs";

// manifest.json
var manifest_default = {
  manifest_version: 3,
  name: "CRXJS Vue Vite Example",
  version: "1.0.0",
  action: { default_popup: "index.html" },
  host_permissions: ["https://*.openai.com/"],
  content_scripts: [
    {
      matches: ["https://www.bilibili.com/video/*"],
      js: ["src/document_start.ts"],
      run_at: "document_start"
    },
    {
      matches: ["https://www.bilibili.com/video/*"],
      js: ["src/content-scripts/content.ts"],
      run_at: "document_start"
    }
  ],
  background: {
    service_worker: "src/background.ts",
    type: "module"
  }
};

// vite.config.ts
var vite_config_default = defineConfig({
  plugins: [
    vue(),
    crx({ manifest: manifest_default })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAibWFuaWZlc3QuanNvbiJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXHByb2plY3RzXFxcXHByb2plY3RcXFxcQmlsaWJpbGlTdW1tYXJ5XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxwcm9qZWN0c1xcXFxwcm9qZWN0XFxcXEJpbGliaWxpU3VtbWFyeVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovcHJvamVjdHMvcHJvamVjdC9CaWxpYmlsaVN1bW1hcnkvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgeyBjcnggfSBmcm9tICdAY3J4anMvdml0ZS1wbHVnaW4nXG5pbXBvcnQgbWFuaWZlc3QgZnJvbSAnLi9tYW5pZmVzdC5qc29uJyAvLyBOb2RlIDE0ICYgMTZcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICB2dWUoKSxcbiAgICBjcngoeyBtYW5pZmVzdCB9KSxcbiAgXSxcbn0pXG4iLCAie1xuICAgIFwibWFuaWZlc3RfdmVyc2lvblwiOiAzLFxuICAgIFwibmFtZVwiOiBcIkNSWEpTIFZ1ZSBWaXRlIEV4YW1wbGVcIixcbiAgICBcInZlcnNpb25cIjogXCIxLjAuMFwiLFxuICAgIFwiYWN0aW9uXCI6IHsgXCJkZWZhdWx0X3BvcHVwXCI6IFwiaW5kZXguaHRtbFwiIH0sXG4gICAgXCJob3N0X3Blcm1pc3Npb25zXCI6IFtcImh0dHBzOi8vKi5vcGVuYWkuY29tL1wiXSxcbiAgICBcImNvbnRlbnRfc2NyaXB0c1wiOiBbXG4gICAgICB7XG4gICAgICAgIFwibWF0Y2hlc1wiOiBbXCJodHRwczovL3d3dy5iaWxpYmlsaS5jb20vdmlkZW8vKlwiXSxcbiAgICAgICAgXCJqc1wiOiBbXCJzcmMvZG9jdW1lbnRfc3RhcnQudHNcIl0sXG4gICAgICAgIFwicnVuX2F0XCI6IFwiZG9jdW1lbnRfc3RhcnRcIlxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgXCJtYXRjaGVzXCI6IFsgXCJodHRwczovL3d3dy5iaWxpYmlsaS5jb20vdmlkZW8vKlwiIF0sXG4gICAgICAgIFwianNcIjogWyBcInNyYy9jb250ZW50LXNjcmlwdHMvY29udGVudC50c1wiXSxcbiAgICAgICAgXCJydW5fYXRcIjogXCJkb2N1bWVudF9zdGFydFwiXG4gICAgICB9XG4gICAgXSxcbiAgICBcImJhY2tncm91bmRcIjoge1xuICAgICAgXCJzZXJ2aWNlX3dvcmtlclwiOiBcInNyYy9iYWNrZ3JvdW5kLnRzXCIsXG4gICAgICBcInR5cGVcIjogXCJtb2R1bGVcIlxuICAgIH1cbiAgfVxuXG4gIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFtUyxTQUFTLG9CQUFvQjtBQUNoVSxPQUFPLFNBQVM7QUFDaEIsU0FBUyxXQUFXOzs7QUNGcEI7QUFBQSxFQUNJLGtCQUFvQjtBQUFBLEVBQ3BCLE1BQVE7QUFBQSxFQUNSLFNBQVc7QUFBQSxFQUNYLFFBQVUsRUFBRSxlQUFpQixhQUFhO0FBQUEsRUFDMUMsa0JBQW9CLENBQUMsdUJBQXVCO0FBQUEsRUFDNUMsaUJBQW1CO0FBQUEsSUFDakI7QUFBQSxNQUNFLFNBQVcsQ0FBQyxrQ0FBa0M7QUFBQSxNQUM5QyxJQUFNLENBQUMsdUJBQXVCO0FBQUEsTUFDOUIsUUFBVTtBQUFBLElBQ1o7QUFBQSxJQUNBO0FBQUEsTUFDRSxTQUFXLENBQUUsa0NBQW1DO0FBQUEsTUFDaEQsSUFBTSxDQUFFLGdDQUFnQztBQUFBLE1BQ3hDLFFBQVU7QUFBQSxJQUNaO0FBQUEsRUFDRjtBQUFBLEVBQ0EsWUFBYztBQUFBLElBQ1osZ0JBQWtCO0FBQUEsSUFDbEIsTUFBUTtBQUFBLEVBQ1Y7QUFDRjs7O0FEaEJGLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLElBQUk7QUFBQSxJQUNKLElBQUksRUFBRSwyQkFBUyxDQUFDO0FBQUEsRUFDbEI7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
