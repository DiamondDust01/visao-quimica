import React, { useEffect, useState } from 'react';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import packageJson from '../../package.json';
import { readLocalConnectionQuality } from '../platform/localConnection.js';
import { summarizePeerConnection } from '../platform/peerPairing.js';

// Os elementos flutuantes ficam acima da barra inferior no celular.
const floatingBottom = 'bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] md:bottom-3';

export function AppVersion() {
  return (
    <span
      className={`fixed ${floatingBottom} right-3 z-40 rounded-full border border-slate-800 bg-slate-950/80 px-2 py-1 font-mono text-[10px] text-slate-500 backdrop-blur-sm`}
      aria-label={`Versão ${packageJson.version}`}
    >
      v{packageJson.version}
    </span>
  );
}

export function LocalConnectionIndicator() {
  const [connection, setConnection] = useState(() => readLocalConnectionQuality());

  useEffect(() => {
    const refresh = () => setConnection(readLocalConnectionQuality());
    const browserConnection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    browserConnection?.addEventListener?.('change', refresh);
    return () => {
      window.removeEventListener('online', refresh);
      window.removeEventListener('offline', refresh);
      browserConnection?.removeEventListener?.('change', refresh);
    };
  }, []);

  const tone = !connection.online
    ? 'text-rose-300'
    : connection.quality === 'good' ? 'text-emerald-300'
      : connection.quality === 'fair' ? 'text-amber-300'
        : connection.quality === 'poor' ? 'text-rose-300' : 'text-slate-300';
  const ConnectionIcon = connection.online ? Wifi : WifiOff;

  return (
    <details className={`fixed ${floatingBottom} left-3 z-40`}>
      <summary
        className={`flex max-w-[calc(100vw-6rem)] cursor-pointer list-none items-center gap-2 rounded-full border border-slate-800 bg-slate-950/90 px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur-sm marker:hidden ${tone}`}
        title="Estado da rede detectado localmente; nenhum teste é enviado a servidores."
      >
        <ConnectionIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">Conexão: {connection.label}</span>
        {connection.typeLabel && <span className="hidden truncate text-slate-500 sm:inline">· {connection.typeLabel}</span>}
      </summary>
      <div className="absolute bottom-full left-0 mb-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-slate-700 bg-slate-950/95 p-4 text-xs text-slate-300 shadow-2xl backdrop-blur-md">
        <div className={`font-bold ${tone}`}>Qualidade estimada neste dispositivo: {connection.label}</div>
        <div className="mt-2 space-y-1 text-slate-400">
          <div>Estado da rede: {connection.online ? 'conectada, segundo o sistema' : 'desconectada, segundo o sistema'}</div>
          {connection.typeLabel && <div>Tipo: {connection.typeLabel}</div>}
          {connection.effectiveType && <div>Categoria local: {connection.effectiveType.toUpperCase()}</div>}
          {connection.downlinkMbps !== null && <div>Taxa estimada: {connection.downlinkMbps} Mbps</div>}
          {connection.rttMs !== null && <div>Latência estimada pelo sistema: {connection.rttMs} ms</div>}
          {connection.quality === 'unknown' && <div>Este navegador não fornece estimativas locais de qualidade.</div>}
        </div>
        <p className="mt-3 border-t border-slate-800 pt-2 text-[10px] leading-relaxed text-slate-500">
          Indicador local baseado no estado e nas estimativas de rede do dispositivo. Não envia tráfego de teste nem mede a latência até um servidor.
        </p>
      </div>
    </details>
  );
}

export function PeerConnectionIndicator({ roomCode, peers, participants }) {
  if (!roomCode) return null;

  const pingStatus = summarizePeerConnection(peers);
  const label = pingStatus.averagePing !== null
    ? `${pingStatus.averagePing} ms`
    : ({
      unresponsive: 'Sem resposta',
      measuring: 'Medindo…',
      connecting: 'Conectando…',
      disconnected: 'Desconectado',
      waiting: 'Aguardando par'
    })[pingStatus.state];
  const tone = pingStatus.averagePing === null
    ? 'text-slate-300'
    : pingStatus.averagePing <= 50 ? 'text-emerald-300'
      : pingStatus.averagePing <= 100 ? 'text-cyan-300'
        : pingStatus.averagePing <= 200 ? 'text-amber-300' : 'text-rose-300';

  return (
    <details className="fixed bottom-[calc(env(safe-area-inset-bottom)+7rem)] right-3 z-40 md:bottom-14">
      <summary className={`flex max-w-[calc(100vw-6rem)] cursor-pointer list-none items-center gap-2 rounded-full border border-slate-800 bg-slate-950/90 px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur-sm marker:hidden ${tone}`}>
        <Activity className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">Ping P2P: {label}</span>
      </summary>
      <div className="absolute bottom-full right-0 mb-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-slate-700 bg-slate-950/95 p-4 text-xs text-slate-300 shadow-2xl backdrop-blur-md">
        <div className={`font-bold ${tone}`}>Conexão direta da sala: {label}</div>
        <p className="mt-2 text-slate-400">
          Sala {roomCode}. Medição real de ida e volta pelo canal WebRTC entre os aparelhos; não é a qualidade geral da internet nem o ping de um servidor.
        </p>
        {peers.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-slate-800 pt-2 text-slate-400">
            {peers.map((peer) => (
              <li key={peer.uid} className="flex justify-between gap-3">
                <span className="truncate">{participants?.[peer.uid]?.apelido || peer.uid}</span>
                <span className="shrink-0">
                  {pingStatus.measuredPeers.includes(peer)
                    ? `${peer.average} ms`
                    : peer.channelState !== 'open' ? peer.state : peer.lastPingAt ? 'sem resposta' : 'medindo'}
                </span>
              </li>
            ))}
          </ul>
        )}
        {peers.length === 0 && <p className="mt-2 text-slate-500">Entre na sala com outro aparelho para medir a latência P2P.</p>}
      </div>
    </details>
  );
}
