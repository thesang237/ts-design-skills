import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// base: './' so the built demo also works when opened from any folder or static host.
export default defineConfig({ base: './', plugins: [react()] });
