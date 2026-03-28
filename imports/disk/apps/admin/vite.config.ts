import path from "path"
import { fileURLToPath } from "url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
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
