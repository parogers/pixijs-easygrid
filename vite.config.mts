import path from "node:path";
import { defineConfig } from "vite";
import ViteRestart from 'vite-plugin-restart'

export default defineConfig({
    resolve: {
        alias: {
            "pixijs-easygrid": path.resolve(__dirname, "src"),
        },
    },
    plugins: [
        ViteRestart({
            restart: [
                'examples/assets/*.png',
                'examples/assets/*.json',
            ]
        }),
    ],
});
