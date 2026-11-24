import React from 'react';
import { Card } from './ui.jsx';
import { getTab } from '../app/navigation.js';
import { corDe } from '../app/cores.js';

// Cartão de título das abas. Todas usam o mesmo formato: a pergunta que a aba responde
// (na cor dela), o nome e uma frase dizendo para que ela serve. Assim cada tela se apresenta
// do mesmo jeito que aparece na tela de boas-vindas e no guia de uso.
export default function TopoDaTela({ tela, acoes, children, ...rest }) {
  const aba = getTab(tela);
  const cor = corDe(tela);
  return (
    <Card className={`border-t-4 ${cor.borda}`} {...rest}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-xs font-bold uppercase tracking-wide ${cor.titulo}`}>{aba.pergunta}</p>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">{aba.label}</h1>
          <p className="mt-1 max-w-2xl text-slate-300">{aba.description}</p>
        </div>
        {acoes}
      </div>
      {children}
    </Card>
  );
}
