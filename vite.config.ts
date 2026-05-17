import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import authGatePlugin from './vite-plugin-auth-gate.js';
import blobAssetPlugin from './vite-plugin-blob.js';
import svgUse from './vite-plugin-svg-use.js';
import uploadPlugin from './vite-plugin-upload.js';
import { playwright } from '@vitest/browser-playwright';
import { execSync } from 'child_process';

function proxyAudioPlugin() {
    return {
        name: 'proxy-audio-dev',
        configureServer(server) {
            // No longer needed: local proxy-audio middleware replaced by remote proxy
        },
    };
}

function getGitCommitHash() {
    try {
        return execSync('git rev-parse --short HEAD').toString().trim();
    } catch {
        return 'unknown';
    }
}

export default defineConfig((options) => {
    const commitHash = getGitCommitHash();

    // TAILSCALE: detect network mode via `--mode network` or presence of env var
    const isNetworkMode = (options && options.mode === 'network') || !!process.env.TAILSCALE_HOSTNAME;
    // TAILSCALE: hostname to allow (replace <TAILSCALE_HOSTNAME> with your actual tailscale name or set env TAILSCALE_HOSTNAME)
    const tailscaleHost = process.env.TAILSCALE_HOSTNAME || '<TAILSCALE_HOSTNAME>';

    if (isNetworkMode) {
        // TAILSCALE: print the full URL to use from the phone
        const port = process.env.PORT || 5173;
        const scheme = process.env.HTTPS && process.env.HTTPS !== 'false' ? 'https' : 'http';
        console.log(`\nTAILSCALE: dev server network mode enabled`);
        console.log(`TAILSCALE: Use this URL on your device: ${scheme}://${tailscaleHost}:${port}\n`);
    }

    return {
        test: {
            // https://vitest.dev/guide/browser/
            browser: {
                enabled: true,
                provider: playwright(),
                headless: !!process.env.HEADLESS,
                instances: [{ browser: 'chromium' }],
            },
        },
        base: './',
        define: {
            __COMMIT_HASH__: JSON.stringify(commitHash),
            __VITEST__: !!process.env.VITEST,
        },
        worker: {
            format: 'es',
        },
        resolve: {
            alias: {
                '!lucide': '/node_modules/lucide-static/icons',
                '!simpleicons': '/node_modules/simple-icons/icons',
                '!': '/node_modules',

                events: '/node_modules/events/events.js',
                pocketbase: '/node_modules/pocketbase/dist/pocketbase.es.js',
                stream: path.resolve(__dirname, 'stream-stub.js'), // Stub for stream module
            },
        },
        optimizeDeps: {
            exclude: ['pocketbase', '@ffmpeg/ffmpeg', '@ffmpeg/util'],
        },
        // TAILSCALE: build server config and enable network options only when requested
        // TAILSCALE: serverConfig will be injected below
        server: (() => {
            const serverConfig = {
                fs: {
                    allow: ['.', 'node_modules'],
                },
                proxy: {
                    // WORKER: Local Cloudflare Pages Functions development proxy
                    '/functions': {
                        target: 'http://127.0.0.1:8788',
                        changeOrigin: true,
                        secure: false,
                        rewrite: (path) => path.replace(/^\/functions/, ''),
                    },
                    '/workers': {
                        target: 'http://127.0.0.1:8788',
                        changeOrigin: true,
                        secure: false,
                        rewrite: (path) => path.replace(/^\/workers/, ''),
                    },
                    '/api/stream': {
                        target: 'https://monochrome.tf',
                        changeOrigin: true,
                        secure: false,
                    },
                    '/api': {
                        target: 'http://127.0.0.1:8788',
                        changeOrigin: true,
                        secure: false,
                    },
                },
            };

            if (isNetworkMode) {
                // TAILSCALE: allow external hosts to connect to dev server
                serverConfig.host = true;
                // TAILSCALE: enable CORS so device browsers can load assets without CORS errors
                serverConfig.cors = true;
                // TAILSCALE: add permissive headers for development over tailscale
                serverConfig.headers = {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                };
                // TAILSCALE: restrict allowedHosts if a specific hostname was provided
                serverConfig.allowedHosts = [tailscaleHost];
            }

            return serverConfig;
        })(),
        // preview: {
        //     host: true,
        //     allowedHosts: ['<your_tailscale_hostname>'], // e.g. pi5.tailf5f622.ts.net
        // },
        build: {
            outDir: 'dist',
            emptyOutDir: true,
            sourcemap: false,
            minify: 'esbuild',
            reportCompressedSize: false,
            rollupOptions: {
                treeshake: true,
            },
        },
        plugins: [
            proxyAudioPlugin(),
            authGatePlugin(),
            uploadPlugin(),
            blobAssetPlugin(),
            svgUse(),
            VitePWA({
                registerType: 'prompt',
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
                    cleanupOutdatedCaches: true,
                    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MiB limit
                    // Define runtime caching strategies
                    runtimeCaching: [
                        {
                            urlPattern: ({ request }) => request.destination === 'image',
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'images',
                                expiration: {
                                    maxEntries: 100,
                                    maxAgeSeconds: 60 * 24 * 60 * 60, // 60 Days
                                },
                            },
                        },
                        {
                            urlPattern: ({ request }) =>
                                request.destination === 'audio' || request.destination === 'video',
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'media',
                                expiration: {
                                    maxEntries: 50,
                                    maxAgeSeconds: 60 * 24 * 60 * 60, // 60 Days
                                },
                                rangeRequests: true, // Support scrubbing
                            },
                        },
                    ],
                },
                includeAssets: ['discord.html'],
                manifest: false, // Use existing public/manifest.json
            }),
        ],
    };
});
