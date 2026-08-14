import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import tailwindcss from '@tailwindcss/vite';
import istanbul from 'vite-plugin-istanbul';
import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		chunkSizeWarningLimit: 850
	},
	plugins: [
		tailwindcss(),
		sveltekit(),
		...(process.env.VITE_COVERAGE === 'true'
			? [
					istanbul({
						include: 'src/**/*',
						exclude: ['node_modules', 'tests/', '**/*.test.ts'],
						extension: ['.ts', '.svelte'],
						requireEnv: true,
						forceBuildInstrument: true
					})
				]
			: []),
		SvelteKitPWA({
			scope: '/',
			buildBase: '/',
			registerType: 'autoUpdate',
			manifest: {
				name: 'Keepy',
				short_name: 'Keepy',
				description: 'GitHub同期対応のプライベートメモアプリ',
				start_url: '/',
				display: 'standalone',
				background_color: '#f8f9fa',
				theme_color: '#e7a900',
				icons: [
					{ src: 'keepy-icon.png', sizes: '1024x1024', type: 'image/png', purpose: 'any maskable' }
				]
			},
			workbox: {
				globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}'],
				navigateFallback: null,
				runtimeCaching: [
					{
						urlPattern: ({ request }) => request.mode === 'navigate',
						handler: 'NetworkFirst',
						options: {
							cacheName: 'pages-cache',
							networkTimeoutSeconds: 3,
							expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }
						}
					},
					{
						urlPattern: ({ request, url }) =>
							request.method === 'GET' &&
							/\/api\/notes\/.*\/attachments\?attachmentId=/.test(url.href),
						handler: 'CacheFirst',
						options: {
							cacheName: 'attachment-cache',
							expiration: { maxEntries: 200, maxAgeSeconds: 365 * 24 * 60 * 60 }
						}
					},
					{
						urlPattern: ({ request, url }) =>
							request.method === 'GET' && /\/api\//.test(url.pathname),
						handler: 'NetworkFirst',
						options: {
							cacheName: 'api-cache',
							expiration: { maxEntries: 50, maxAgeSeconds: 300 }
						}
					},
					{
						urlPattern: /^https?:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-cache',
							expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 }
						}
					}
				]
			}
		})
	]
});
