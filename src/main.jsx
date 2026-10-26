import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './app/App.jsx';
// Estilos e fontes do KaTeX vêm do pacote e entram no build (funciona offline).
import 'katex/dist/katex.min.css';
import './styles.css';

if (Capacitor.getPlatform() === 'android') {
  document.documentElement.classList.add('android-app');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
