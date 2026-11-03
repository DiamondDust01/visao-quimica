import React from 'react';

export const buttonPrimary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 disabled:cursor-not-allowed disabled:opacity-40';
export const buttonSecondary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-teal-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 disabled:cursor-not-allowed disabled:opacity-40';
export const buttonDanger = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-500/60 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300';
export const inputClass = 'block w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-base text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none';

export const Card = ({ children, className = '' }) => (
  <section className={`rounded-2xl border border-slate-800 bg-slate-900/85 p-4 backdrop-blur-sm sm:p-6 ${className}`}>{children}</section>
);

export const Notice = ({ tone = 'info', children, role = 'status' }) => {
  const tones = {
    info: 'border-sky-500/40 bg-sky-500/10 text-sky-100',
    warn: 'border-amber-500/40 bg-amber-500/10 text-amber-100',
    error: 'border-rose-500/40 bg-rose-500/10 text-rose-100',
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
  };
  return (
    <div role={role} aria-live="polite" className="rounded-xl bg-slate-950/80 backdrop-blur-sm">
      <div className={`rounded-xl border px-3 py-2 text-sm leading-relaxed ${tones[tone] || tones.info}`}>{children}</div>
    </div>
  );
};

export const Bar = ({ label, value, max = 100, color = 'bg-teal-400', suffix = '%', large = false }) => {
  const safe = Number.isFinite(value) ? value : 0;
  const width = max > 0 ? Math.min(100, Math.round((safe / max) * 100)) : 0;
  return (
    <div className={large ? 'space-y-2' : 'space-y-1'}>
      <div className={`flex items-baseline justify-between gap-3 ${large ? 'text-2xl sm:text-3xl' : 'text-sm'}`}>
        <span className="min-w-0 font-semibold">{label}</span>
        <span className="shrink-0 font-mono font-black">{Number.isFinite(value) ? `${value}${suffix}` : '—'}</span>
      </div>
      <div className={`${large ? 'h-6' : 'h-3'} overflow-hidden rounded-full bg-slate-700/60`} role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={safe} aria-label={label}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
};

export const downloadText = (filename, content, type = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
