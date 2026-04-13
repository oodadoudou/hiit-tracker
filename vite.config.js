import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Electron loads the built app via file:// protocol. Chromium enforces strict
// CORS on <script type="module" crossorigin>, which blocks the JS bundle from
// executing when served over file://. Strip all crossorigin attributes from the
// generated HTML so modules load normally under file://.
function removeElectronCrossorigin() {
  return {
    name: 'remove-crossorigin-for-electron',
    transformIndexHtml(html) {
      return html.replace(/ crossorigin/g, '');
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), removeElectronCrossorigin()],
});
