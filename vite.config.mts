import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
    resolve: {
        alias: {
            "pixijs-easygrid": path.resolve(__dirname, "src"),
        },
    },
});
