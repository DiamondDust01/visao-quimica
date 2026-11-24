import React, { useContext, useMemo } from 'react';
import katex from 'katex';
import 'katex/contrib/mhchem';
import { splitCe } from '../domain/textoQuimico.js';
import { marcarTermos } from '../domain/glossario.js';
import { GlossarioContexto } from './glossarioContexto.js';

// Mostra texto com trechos \ce{...} renderizados pelo KaTeX com a extensão mhchem.
// A saída inclui MathML (lido por leitores de tela) e HTML (visual). Tudo vem do
// pacote instalado: nada é baixado em tempo de execução.
// Dentro de uma questão (GlossarioProvider), as palavras do glossário viram botões
// que abrem a explicação; `semGlossario` desliga isso (usado no próprio balão).
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

export default function ChemText({ text, as: Tag = 'span', className = '', semGlossario = false }) {
  const glossario = useContext(GlossarioContexto);
  const ativo = Boolean(glossario) && !semGlossario;
  const buscador = glossario?.buscador;
  const bloqueadoNaQuestao = glossario?.bloqueado;
  const parts = useMemo(() => {
    const partes = splitCe(text);
    if (!ativo) return partes;
    // Um termo marcado num trecho não se repete nos trechos seguintes do mesmo texto.
    const usados = new Set();
    const bloqueado = (entrada) => usados.has(entrada.id) || bloqueadoNaQuestao(entrada);
    return partes.flatMap((part) => {
      if (part.tipo !== 'texto') return [part];
      const segmentos = marcarTermos(part.valor, buscador, bloqueado);
      segmentos.forEach((segmento) => { if (segmento.tipo === 'termo') usados.add(segmento.entrada.id); });
      return segmentos;
    });
  }, [text, ativo, buscador, bloqueadoNaQuestao]);

  return (
    <Tag className={className}>
      {parts.map((part, index) => {
        if (part.tipo === 'texto') return <React.Fragment key={index}>{part.valor}</React.Fragment>;
        if (part.tipo === 'termo') return <glossario.Termo key={index} texto={part.valor} entrada={part.entrada} contexto={glossario} />;
        const html = renderCe(part.valor);
        // Fórmula inválida (só acontece com texto digitado pelo estudante): mostra o texto cru.
        if (html === null) return <code key={index} className="text-slate-300">{part.valor}</code>;
        return <span key={index} className="chem" dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </Tag>
  );
}
