import React, { useMemo, useState } from 'react';
import ChemText from './ChemText.jsx';
import { inputClass, Notice } from './ui.jsx';
import { molarMass } from '../domain/massaMolar.js';
import { FormulaError } from '../domain/formula.js';

const EXEMPLOS = ['H2O', 'CO2', 'H2SO4', 'Ca(OH)2', 'C6H12O6', 'CuSO4·5H2O', 'Al2(SO4)3'];

const fmt = (value, digits = 3) => value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

// Calculadora de massa molar com as massas atômicas da IUPAC (src/data/elementos.json).
export default function CalculadoraMassaMolar({ elementos, fonte }) {
  const [formula, setFormula] = useState('H2SO4');

  const result = useMemo(() => {
    const text = formula.trim();
    if (!text) return null;
    try {
      return { ok: true, ...molarMass(text, elementos) };
    } catch (error) {
      if (error instanceof FormulaError) return { ok: false, mensagem: error.message };
      throw error;
    }
  }, [formula, elementos]);

  return (
    <div className="space-y-4">
      <label className="flex flex-col gap-1 text-sm text-slate-300">
        Fórmula
        <input
          type="text"
          value={formula}
          onChange={(event) => setFormula(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder="Ex.: H2SO4, Ca(OH)2, CuSO4·5H2O"
          className={inputClass}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-slate-400">Exemplos:</span>
        {EXEMPLOS.map((example) => (
          <button key={example} type="button" onClick={() => setFormula(example)} className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-teal-400">
            <ChemText text={`\\ce{${example}}`} />
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">Use maiúsculas e minúsculas como nos símbolos (Co é cobalto, CO é monóxido de carbono), parênteses para grupos e · ou * para hidratos.</p>

      {result && !result.ok && <Notice tone="warn">Não consegui ler a fórmula: {result.mensagem}</Notice>}
      {result?.ok && (
        <div aria-live="polite" className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/85 p-4 backdrop-blur-sm">
          <p className="text-lg text-slate-200">
            <ChemText text={`\\ce{${formula.trim()}}`} className="text-xl text-white" />{' '}
            <span className="text-slate-400">=</span>{' '}
            <strong className="text-2xl font-black text-teal-200">{fmt(result.total)} g/mol</strong>
          </p>
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Contribuição de cada elemento para a massa molar</caption>
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr><th scope="col" className="py-1">Elemento</th><th scope="col">Quantidade</th><th scope="col">Massa atômica (u)</th><th scope="col" className="text-right">Subtotal (g/mol)</th></tr>
            </thead>
            <tbody>
              {result.parcelas.map((parcela) => (
                <tr key={parcela.simbolo} className="border-t border-slate-800">
                  <td className="py-1">{parcela.nome} ({parcela.simbolo})</td>
                  <td>{parcela.quantidade}</td>
                  <td>{parcela.massaAtomicaTexto.replace('.', ',')}</td>
                  <td className="text-right font-mono">{fmt(parcela.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.aproximada && <Notice tone="info">Há elemento radioativo sem peso atômico padrão; foi usado o número de massa do isótopo mais estável, então o valor é aproximado.</Notice>}
          {result.carga !== 0 && <p className="text-xs text-slate-400">A carga do íon não altera a massa molar de forma perceptível (a massa dos elétrons é desprezível aqui).</p>}
        </div>
      )}
      <p className="text-xs text-slate-500">Massas atômicas: {fonte.instituicao}, consultado em {fonte.consultadoEm.split('-').reverse().join('/')}.</p>
    </div>
  );
}
