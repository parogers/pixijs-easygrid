import path from "node:path";
import { defineConfig } from "vite";
import ViteRestart from 'vite-plugin-restart'
import { playwright } from '@vitest/browser-playwright';

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
    test: {
        browser: {
            ui: false,
            provider: playwright(),
            enabled: true,
            instances: [
                {
                    browser: 'chromium',
                    viewport: {
                        width: 600,
                        height: 400,
                    },
                }
            ],
            expect: {
                toMatchScreenshot: {
                    comparatorName: 'pixelmatch',
                    comparatorOptions: {
                        // 0-1, how different can colors be?
                        threshold: 0,
                        // 1% of pixels can differ
                        allowedMismatchedPixelRatio: 0,
                    },
                },
            },
        },
    },
});
