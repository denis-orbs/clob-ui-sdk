import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    "process.env": process.env,
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/lib/index.ts"),
      formats: ["es", "umd"],
      fileName: (format) => `main.${format}.js`,
      name: "main",
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },

  plugins: [
    react(),
    tsconfigPaths(),
    dts({
      include: "src/lib/**/*",
    }),
  ],
});
