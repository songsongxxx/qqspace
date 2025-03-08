import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
// svelte.config.js
import svelte from 'rollup-plugin-svelte';
import { resolve } from 'path';
// svelte.config.js
import sveltePreprocess from 'svelte-preprocess';

export default {

  plugins: [svelte()],
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: vitePreprocess(),

    preprocess: sveltePreprocess(),
  kit: {
    target: '#svelte',
  },

}
