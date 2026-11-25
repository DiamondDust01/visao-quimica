import React, { useEffect, useState } from 'react';
import { Notice, buttonPrimary, buttonSecondary } from './ui.jsx';
import { STORAGE_KEYS, readJson, writeJson } from '../platform/storage.js';

const COPY = {
  inicio: ['Quer uma dica para se orientar?', 'No Início você encontra o próximo passo sugerido e pode continuar de onde parou.'],
  fundamentos: ['Quer uma dica para usar a Trilha?', 'Veja a ordem sugerida para sua etapa e os temas que podem precisar de revisão.'],
  pratica: ['Quer uma dica para escolher temas?', 'Na Prática você pode filtrar e marcar os assuntos que quiser, sem uma ordem fixa.'],
  sessao: ['Quer uma dica sobre a sessão?', 'Acompanhe o tempo e o progresso; peça ajuda quando precisar ou encerre quando quiser.'],
  laboratorio: ['Conheça o Laboratório do Mentor?', 'Ele reúne sugestões de revisão com base nas suas respostas. Usá-lo é opcional.'],
  ferramentas: ['Quer conhecer as ferramentas?', 'A Tabela periódica, a Massa molar e as Estruturas ficam reunidas nesta área.'],
  perfil: ['Quer conhecer seu Perfil?', 'Aqui você gerencia etapa, progresso local e backups do aparelho.']
};

const hasSeen = (area) => Boolean(readJson(STORAGE_KEYS.guiaDicas, {})[area]);
const markSeen = (area) => writeJson(STORAGE_KEYS.guiaDicas, { ...readJson(STORAGE_KEYS.guiaDicas, {}), [area]: true });

export default function DicaGuia({ area, onStart, onDismiss }) {
  const [visible, setVisible] = useState(() => !hasSeen(area));

  useEffect(() => {
    if (visible && COPY[area]) markSeen(area);
  }, [area, visible]);

  if (!visible || !COPY[area]) return null;
  const [titulo, texto] = COPY[area];
  const dismiss = () => {
    markSeen(area);
    setVisible(false);
    onDismiss?.();
  };
  return (
    <Notice>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="min-w-0 flex-1"><strong>{titulo}</strong> {texto}</span>
        <span className="flex gap-2">
          <button type="button" onClick={() => { markSeen(area); setVisible(false); onStart(area); }} className={buttonPrimary}>Ver dica</button>
          <button type="button" onClick={dismiss} className={buttonSecondary}>Agora não</button>
        </span>
      </div>
    </Notice>
  );
}
