import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import { config as envConfig } from 'dotenv';
import nodeAdapter from '@sveltejs/adapter-node';
import netlifyAdapter from '@sveltejs/adapter-netlify';
import autoAdapter from '@sveltejs/adapter-auto';

// Load environment variables
envConfig({ quiet: true });
const adapter = process.env?.VITE_ADAPTER;

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter:
				adapter === 'netlify'
					? netlifyAdapter({
							// if true, will create a Netlify Edge Function rather
							// than using standard Node-based functions
							edge: false,

							// if true, will split your app into multiple functions
							// instead of creating a single one for the entire app.
							// if `edge` is true, this option cannot be used
							split: false
						})
					: adapter === 'node'
						? nodeAdapter({
								// serves on HOST/PORT env vars (default 0.0.0.0:3000)
								out: 'build'
							})
						: autoAdapter()
		})
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		setupFiles: ['src/lib/utils/vitest.setup.js']
	}
});
