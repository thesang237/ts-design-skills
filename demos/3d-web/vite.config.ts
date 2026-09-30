import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// base: './' so the built demo also works when opened from any folder or static host.
// three.js is large on its own (~220 kB gzipped); the WebGPU chunk loads only on request.
export default defineConfig({ base: './', plugins: [react()], build: { chunkSizeWarningLimit: 1000 } });
