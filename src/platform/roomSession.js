// Código da sala, link de entrada (?sala=CÓDIGO) e base do QR code.

export const ROOM_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_PATTERN = /^[A-Z0-9]{6}$/;

// O alfabeto evita caracteres confundíveis (0/O, 1/I/L).
export const createRoomCode = (random = Math.random) => {
  let code = '';
  for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
    code += ROOM_CODE_ALPHABET[Math.min(ROOM_CODE_ALPHABET.length - 1, Math.floor(random() * ROOM_CODE_ALPHABET.length))];
  }
  return code;
};

export const normalizeRoomCode = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, ROOM_CODE_LENGTH);

export const isValidRoomCode = (value) => ROOM_CODE_PATTERN.test(String(value || ''));

// Lê `?sala=CÓDIGO` da URL de abertura.
export const parseRoomParam = (search = '') => {
  try {
    const params = new URLSearchParams(search);
    const code = normalizeRoomCode(params.get('sala'));
    return isValidRoomCode(code) ? code : null;
  } catch {
    return null;
  }
};

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);

// Decide a base do link do QR. Preferência: VITE_PUBLIC_APP_URL (hospedagem HTTPS).
// Sem ela, usa o endereço atual quando é http(s); avisa quando celulares não alcançam.
export const resolveJoinBaseUrl = ({ configuredUrl = '', location = null } = {}) => {
  const configured = String(configuredUrl || '').trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol === 'https:') return { baseUrl: url.toString(), warning: '' };
      return { baseUrl: url.toString(), warning: 'O endereço configurado não usa HTTPS. Alguns celulares podem bloquear o link.' };
    } catch {
      return { baseUrl: '', warning: 'VITE_PUBLIC_APP_URL não é um endereço válido. Use a entrada por código.' };
    }
  }
  if (location && /^https?:$/.test(location.protocol || '')) {
    const baseUrl = `${location.origin}${location.pathname}`;
    if (LOCAL_HOSTS.has(location.hostname)) {
      return { baseUrl, warning: 'Este endereço só funciona neste computador. Para o QR funcionar nos celulares, publique o app (ex.: Firebase Hosting) ou abra pelo IP da rede.' };
    }
    return { baseUrl, warning: '' };
  }
  return { baseUrl: '', warning: 'No app instalado não há link público. Os participantes entram digitando o código; para usar o QR, configure VITE_PUBLIC_APP_URL com o endereço publicado.' };
};

export const buildJoinUrl = (baseUrl, code) => {
  if (!baseUrl || !isValidRoomCode(code)) return '';
  try {
    const url = new URL(baseUrl);
    url.search = '';
    url.hash = '';
    url.searchParams.set('sala', code);
    return url.toString();
  } catch {
    return '';
  }
};

// CSV com BOM UTF-8, CRLF e aspas em todas as células (abre certo no Excel em pt-BR).
export const toCsv = (rows) => `﻿${rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n')}`;
