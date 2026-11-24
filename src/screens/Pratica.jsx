import React, { useEffect, useMemo, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { buttonPrimary, buttonSecondary, Notice, inputClass } from '../components/ui.jsx';
import TemaSelector from '../components/questoes/TemaSelector.jsx';
import TopoDaTela from '../components/TopoDaTela.jsx';
import { unstudiedPrerequisites } from '../domain/recomendador.js';
import { SESSION_SIZES } from '../domain/questoes/sessao.js';

const MAX_WARNINGS = 5;

// Prática: o catálogo livre. O estudante escolhe qualquer tema, de qualquer etapa, e monta
// uma sessão. A sessão em si abre numa tela própria (screens/Sessao.jsx), pelo App.
// request: { subtemaIds } pré-seleciona temas (ao voltar de uma sessão, ou quando um tema
// pedido em outra tela não tem questões).
export default function Pratica({ index, questions, etapas, progress, request, onRequestHandled, onStart }) {
  const [selected, setSelected] = useState(() => new Set());
  const [quantidade, setQuantidade] = useState(10);
  const [notice, setNotice] = useState('');

  const countBySubtema = useMemo(() => {
    const counts = new Map();
    questions.forEach((question) => counts.set(question.temaId, (counts.get(question.temaId) || 0) + 1));
    return counts;
  }, [questions]);
  const questionCount = (id) => countBySubtema.get(id) || 0;

  useEffect(() => {
    if (!request) return;
    const ids = request.subtemaIds.filter((id) => questionCount(id) > 0);
    setSelected(new Set(ids));
    setNotice(ids.length || !request.subtemaIds.length ? '' : 'Esse tema ainda não tem questões. Escolha outro tema abaixo.');
    onRequestHandled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  const warnings = useMemo(() => unstudiedPrerequisites(index, [...selected], progress), [index, selected, progress]);
  const missingIds = [...new Set(warnings.flatMap((warning) => warning.faltando))].filter((id) => questionCount(id) > 0);
  const available = [...selected].reduce((sum, id) => sum + questionCount(id), 0);

  return (
    <div className="space-y-4 pb-40">
      <TopoDaTela tela="pratica">
        <p className="mt-3 text-sm text-slate-400">Marque os temas, escolha quantas questões quer e comece. A resolução passo a passo aparece depois de cada resposta.</p>
      </TopoDaTela>
      {notice && <Notice tone="warn">{notice}</Notice>}

      <TemaSelector index={index} progress={progress} questionCount={questionCount} etapas={etapas} selected={selected} onChange={setSelected} />

      {/* Barra fixa com o resumo da seleção. */}
      <div data-guia="barra-sessao" className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4rem)] z-20 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md md:bottom-0">
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-3">
          {warnings.length > 0 && (
            <Notice tone="warn">
              <span className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Alguns temas usam conteúdos que você ainda não estudou. Você pode continuar mesmo assim.
                  <ul className="mt-1 list-disc pl-5">
                    {warnings.slice(0, MAX_WARNINGS).map((warning) => (
                      <li key={warning.subtemaId}>{index.get(warning.subtemaId).nome} usa: {warning.faltando.map((id) => index.get(id).nome).join(', ')}</li>
                    ))}
                    {warnings.length > MAX_WARNINGS && <li>e mais {warnings.length - MAX_WARNINGS} tema(s).</li>}
                  </ul>
                  {missingIds.length > 0 && (
                    <button type="button" onClick={() => setSelected(new Set([...selected, ...missingIds]))} className="mt-2 font-semibold underline underline-offset-2">
                      Incluir esses pré-requisitos na sessão
                    </button>
                  )}
                </span>
              </span>
            </Notice>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <p className="min-w-0 flex-1 text-sm text-slate-300" aria-live="polite">
              <strong className="text-white">{selected.size}</strong> tema(s) · {available} questões disponíveis
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              Questões
              <select value={quantidade} onChange={(event) => setQuantidade(Number(event.target.value))} className={`${inputClass} w-20 py-2`}>
                {SESSION_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
            {selected.size > 0 && <button type="button" onClick={() => setSelected(new Set())} className={buttonSecondary}>Limpar</button>}
            <button type="button" disabled={!available} onClick={() => onStart([...selected], quantidade)} className={buttonPrimary}>Começar sessão</button>
          </div>
        </div>
      </div>
    </div>
  );
}
