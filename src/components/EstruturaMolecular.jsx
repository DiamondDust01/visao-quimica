import React, { useEffect, useRef, useState } from 'react';
import ChemText from './ChemText.jsx';
import { analisarSmiles } from '../domain/estrutura.js';

// Desenho da estrutura a partir de um SMILES, com a smiles-drawer. A biblioteca fica num arquivo
// próprio do build e só é carregada quando a primeira estrutura aparece; nada vem da internet.
let libraryPromise = null;
const loadLibrary = () => {
  libraryPromise ||= import('smiles-drawer').then((module) => module.default);
  return libraryPromise;
};

// Cores por elemento nos dois temas do app. O símbolo de cada átomo aparece escrito,
// então a cor nunca é a única informação.
const THEMES = {
  escuro: {
    FOREGROUND: '#e2e8f0', BACKGROUND: 'transparent',
    C: '#e2e8f0', H: '#94a3b8', O: '#f87171', N: '#60a5fa', S: '#facc15', P: '#fb923c',
    F: '#4ade80', CL: '#34d399', BR: '#fb923c', I: '#c084fc', B: '#fdba74', SI: '#fdba74'
  },
  claro: {
    FOREGROUND: '#1e293b', BACKGROUND: 'transparent',
    C: '#1e293b', H: '#475569', O: '#b91c1c', N: '#1d4ed8', S: '#a16207', P: '#c2410c',
    F: '#15803d', CL: '#047857', BR: '#c2410c', I: '#7e22ce', B: '#c2410c', SI: '#a16207'
  }
};

// Pixels por unidade do desenho e largura mínima (água, metano).
const SCALE = 2;
const MIN_WIDTH = 96;

const readTheme = () => (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light' ? 'claro' : 'escuro');

// Acompanha a troca de tema (o atributo data-theme do <html>).
function useDocumentTheme() {
  const [theme, setTheme] = useState(readTheme);
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return theme;
}

// descricao: texto para leitores de tela (não deve entregar a resposta de uma questão).
// onAnalise: recebe a fórmula molecular, ou null se o SMILES for inválido.
export default function EstruturaMolecular({ smiles, descricao, mostrarFormula = false, width = 320, height = 220, onAnalise }) {
  const svgRef = useRef(null);
  const onAnaliseRef = useRef(onAnalise);
  onAnaliseRef.current = onAnalise;
  const theme = useDocumentTheme();
  const [state, setState] = useState({ status: 'carregando' });

  useEffect(() => {
    let active = true;
    loadLibrary()
      .then((SmilesDrawer) => {
        if (!active || !svgRef.current) return;
        const result = analisarSmiles(SmilesDrawer, smiles);
        onAnaliseRef.current?.(result.erro ? null : result.formula);
        if (result.erro) {
          setState({ status: 'erro', mensagem: result.erro });
          return;
        }
        const svg = svgRef.current;
        svg.replaceChildren();
        new SmilesDrawer.SvgDrawer({ width, height, themes: THEMES, compactDrawing: false }).draw(result.arvore, svg, theme);
        // Mesma escala para todas as moléculas (ligações do mesmo tamanho): a largura acompanha
        // o tamanho do desenho, até o limite pedido e a largura disponível.
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        const drawingWidth = Number(svg.getAttribute('viewBox')?.split(/\s+/)[2]) || width;
        svg.style.maxWidth = `${Math.max(MIN_WIDTH, Math.min(width, drawingWidth * SCALE))}px`;
        setState({ status: 'ok', formula: result.formula });
      })
      .catch(() => {
        if (active) setState({ status: 'erro', mensagem: 'Não foi possível desenhar a estrutura.' });
      });
    return () => {
      active = false;
    };
  }, [smiles, theme, width, height]);

  return (
    <figure className="space-y-2">
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2" style={{ maxWidth: width }}>
        <svg
          ref={svgRef}
          role="img"
          aria-label={descricao || `Estrutura de ${smiles}`}
          className={`mx-auto block h-auto w-full ${state.status === 'ok' ? '' : 'hidden'}`}
        />
        {state.status === 'carregando' && <div style={{ aspectRatio: `${width} / ${height}` }} className="animate-pulse rounded-lg bg-slate-800/40" aria-hidden="true" />}
        {state.status === 'erro' && <p className="p-2 text-sm text-amber-200">{state.mensagem}</p>}
      </div>
      {mostrarFormula && state.status === 'ok' && (
        <figcaption className="text-sm text-slate-300">Fórmula molecular: <ChemText text={`\\ce{${state.formula}}`} /></figcaption>
      )}
    </figure>
  );
}
