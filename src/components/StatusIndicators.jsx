import React from 'react';
import packageJson from '../../package.json';

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
