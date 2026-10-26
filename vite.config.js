import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Separa bibliotecas e conteúdo em arquivos próprios: o código do app muda mais que eles,
// e o navegador (ou o WebView) reaproveita o que já tem em cache.
function manualChunks(id) {
  if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) return 'firebase';
  if (id.includes('node_modules/katex')) return 'katex';
  if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react';
  if (id.includes('/src/data/')) return 'conteudo';
  return undefined;
}

// Política de segurança de conteúdo do build (web, Android e Windows). Scripts e estilos só do
// próprio app; rede só para o Firebase. 'unsafe-inline' em script-src cobre o script que aplica
// o tema antes da página aparecer e o que o Capacitor injeta no HTML do Android. Fica fora do
// modo de desenvolvimento, que precisa de scripts próprios do Vite e dos emuladores locais.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com",
  "frame-src https://*.firebaseapp.com",
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
    // O Firebase sozinho passa de 500 kB; o app inteiro funciona offline a partir do build.
    chunkSizeWarningLimit: 700,
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
