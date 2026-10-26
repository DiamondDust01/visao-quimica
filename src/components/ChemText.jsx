import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/contrib/mhchem';
import { splitCe } from '../domain/textoQuimico.js';

// Mostra texto com trechos \ce{...} renderizados pelo KaTeX com a extensão mhchem.
// A saída inclui MathML (lido por leitores de tela) e HTML (visual). Tudo vem do
// pacote instalado: nada é baixado em tempo de execução.
const cache = new Map();

const renderCe = (content) => {
  if (!cache.has(content)) {
    let html;
    try {
      html = katex.renderToString(`\\ce{${content}}`, { throwOnError: true, output: 'htmlAndMathml' });
    } catch {
      html = null;
    }
    cache.set(content, html);
  }
  return cache.get(content);
};

export default function ChemText({ text, as: Tag = 'span', className = '' }) {
  const parts = useMemo(() => splitCe(text), [text]);
  return (
    <Tag className={className}>
      {parts.map((part, index) => {
        if (part.tipo === 'texto') return <React.Fragment key={index}>{part.valor}</React.Fragment>;
        const html = renderCe(part.valor);
        // Fórmula inválida (só acontece com texto digitado pelo estudante): mostra o texto cru.
        if (html === null) return <code key={index} className="text-slate-300">{part.valor}</code>;
        return <span key={index} className="chem" dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </Tag>
  );
}
