import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	optimizeDeps: {
        exclude: ["svelte-codemirror-editor", "codemirror", "@codemirror/state", "@codemirror/view", "@codemirror/language", "@codemirror/commands", "@codemirror/search", "@codemirror/autocomplete", "@codemirror/lint", "@uiw/codemirror-theme-duotone"],
    },
	plugins: [sveltekit(), tailwindcss()]
});
