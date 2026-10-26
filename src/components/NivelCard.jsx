import React from 'react';
import { Bar } from './ui.jsx';
import { levelFor } from '../domain/pontuacao.js';

// Nível e pontos do estudante neste aparelho.
export default function NivelCard({ points }) {
  const level = levelFor(points);
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-300">
        Nível <strong className="text-white">{level.nivel} · {level.nome}</strong> · {level.pontos} pontos
      </p>
      {level.proximo ? (
        <>
          <Bar label={`Rumo ao nível ${level.proximo.nivel} (${level.proximo.nome})`} value={level.percentual} />
          <p className="text-xs text-slate-500">Faltam {level.faltam} pontos.</p>
        </>
      ) : (
        <p className="text-xs text-slate-500">Você chegou ao nível mais alto.</p>
      )}
    </div>
  );
}
