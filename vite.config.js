import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Separa bibliotecas e conteúdo em arquivos próprios: o código do app muda mais que eles,
// e o navegador (ou o WebView) reaproveita o que já tem em cache.
function manualChunks(id) {
  if (id.includes('node_modules/katex')) return 'katex';
  if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react';
  if (id.includes('/src/data/')) return 'conteudo';
  return undefined;
}

// Política de segurança de conteúdo do build (web, Android e Windows). Scripts, estilos e rede
// só do próprio app. 'unsafe-inline' em script-src cobre o script que aplica
// o tema antes da página aparecer e o que o Capacitor injeta no HTML do Android. Fica fora do
// modo de desenvolvimento, que precisa de scripts próprios do Vite.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const contentSecurityPolicy = {
  name: 'content-security-policy',
  apply: 'build',
  transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }],
};

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), contentSecurityPolicy],
  build: {
    rollupOptions: { output: { manualChunks } },
    // O app inteiro funciona offline a partir do build.
    chunkSizeWarningLimit: 700,
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    // Pastas geradas que não fazem parte do app: vigiá-las só gasta recursos.
    watch: { ignored: ['**/.cache/**', '**/release/**', '**/android/**', '**/dist/**', '**/installers/**'] },
  },
});
