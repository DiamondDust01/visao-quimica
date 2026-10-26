import React from 'react';
import { CircleCheck, Trophy } from 'lucide-react';

// Tabela de ranking. `destaque` marca a linha do próprio participante.
export default function Ranking({ ranking, totalQuestoes, destaque = null, mostrarProgresso = true }) {
  if (!ranking.length) return <p className="text-sm text-slate-400">Ninguém entrou ainda.</p>;
  return (
    <table className="w-full text-left text-sm">
      <caption className="sr-only">Ranking da sala</caption>
      <thead className="text-xs uppercase tracking-wide text-slate-400">
        <tr>
          <th scope="col" className="py-1 pr-2">Posição</th>
          <th scope="col">Apelido</th>
          <th scope="col" className="text-right">Pontos</th>
          <th scope="col" className="text-right">Acertos</th>
          {mostrarProgresso && <th scope="col" className="hidden text-right sm:table-cell">Respondidas</th>}
        </tr>
      </thead>
      <tbody>
        {ranking.map((row) => (
          <tr key={row.uid} className={`border-t border-slate-800 ${row.uid === destaque ? 'bg-teal-500/10 font-semibold text-white' : 'text-slate-200'}`}>
            <td className="py-2 pr-2 font-mono">
              {row.posicao === 1 ? <span className="inline-flex items-center gap-1"><Trophy className="h-4 w-4 text-amber-300" aria-hidden="true" />1º</span> : `${row.posicao}º`}
            </td>
            <td>
              {row.apelido}
              {row.uid === destaque && <span className="ml-2 text-xs text-teal-300">(você)</span>}
              {row.concluido && <CircleCheck className="ml-2 inline h-4 w-4 text-emerald-300" aria-label="concluiu" />}
            </td>
            <td className="text-right font-mono">{row.pontuacao}</td>
            <td className="text-right font-mono">{row.corretas}</td>
            {mostrarProgresso && <td className="hidden text-right font-mono sm:table-cell">{row.respondidas}/{totalQuestoes}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
