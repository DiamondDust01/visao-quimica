import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Bar, buttonPrimary, buttonSecondary, Card } from '../components/ui.jsx';
import SessionPlayer from '../components/questoes/SessionPlayer.jsx';
import { corDe } from '../app/cores.js';

// Sessão de questões: uma tela própria, aberta por cima da aba de onde o estudante começou
// (Início, Trilha, Prática ou Mentor). No fim, "Voltar" leva de volta a essa aba.
// sessao: { id, questions, subtemaIds, origem, summary }
function SessionResult({ summary, index, origemNome, onRepeat, onBack }) {
  return (
    <div className="space-y-4">
      <Card className={`border-t-4 ${corDe('pratica').borda}`}>
        <h1 className="text-2xl font-black text-white">Resultado da sessão</h1>
        <p className="mt-2 text-slate-300">
          Você acertou <strong className="text-white">{summary.corretas}</strong> de <strong className="text-white">{summary.total}</strong> questões
          {summary.dicasUsadas > 0 && `, com ajuda do Mentor em ${summary.dicasUsadas}`}, e somou <strong className="text-teal-200">{summary.pontos} pontos</strong>.
        </p>
        <div className="mt-4"><Bar label="Acertos" value={summary.percentual} large /></div>
      </Card>

      {summary.total > 0 && (
        <Card>
          <h2 className="text-lg font-bold text-white">Por subtema</h2>
          <ul className="mt-3 space-y-3">
            {Object.entries(summary.porSubtema).map(([id, item]) => (
              <li key={id}>
                <Bar label={index.get(id)?.nome || id} value={item.corretas} max={item.total} suffix={` de ${item.total}`} />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">O progresso já foi salvo. Temas com acerto baixo voltam para a revisão na Trilha.</p>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onRepeat} className={buttonPrimary}>Nova sessão com os mesmos temas</button>
        <button type="button" onClick={onBack} className={buttonSecondary}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar para {origemNome}
        </button>
      </div>
    </div>
  );
}

export default function Sessao({ sessao, index, origemNome, onAnswer, onFinish, onRepeat, onBack }) {
  if (sessao.summary) {
    return <SessionResult summary={sessao.summary} index={index} origemNome={origemNome} onRepeat={onRepeat} onBack={onBack} />;
  }
  return (
    <SessionPlayer
      key={sessao.id}
      questions={sessao.questions}
      index={index}
      onAnswer={onAnswer}
      onFinish={onFinish}
    />
  );
}
