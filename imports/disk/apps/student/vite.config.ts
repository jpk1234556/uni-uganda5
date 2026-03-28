import path from "path"
import { fileURLToPath } from "url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          // Check more specific 'react' strings first
          if (id.includes("lucide-react") || id.includes("date-fns")) {
            return "ui-vendor";
          }

          if (id.includes("react-router")) {
            return "router-vendor";
          }

          // Then check the core react packages
          if (id.includes("/node_modules/react/") || id.includes("/node_modules/react-dom/") || id.includes("scheduler")) {
            return "react-vendor";
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@/components/ui": path.resolve(__dirname, "../../packages/ui/src/components/ui"),
      "@/lib/utils": path.resolve(__dirname, "../../packages/ui/src/lib/utils"),
      "@/context": path.resolve(__dirname, "../../packages/shared/src/context"),
      "@/types": path.resolve(__dirname, "../../packages/shared/src/types"),
      "@/lib/supabase": path.resolve(__dirname, "../../packages/shared/src/lib/supabase"),
      "@/components/layout": path.resolve(__dirname, "../../packages/shared/src/components/layout"),
      "@/components/ErrorBoundary": path.resolve(__dirname, "../../packages/shared/src/components/ErrorBoundary"),
      "@/pages/Auth": path.resolve(__dirname, "../../packages/shared/src/components/Auth"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
