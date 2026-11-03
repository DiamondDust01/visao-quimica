import React from 'react';
import { Card } from '../components/ui.jsx';
import packageJson from '../../package.json';
import { NIVEIS, PONTOS_POR_DIFICULDADE, DESCONTO_POR_AJUDA, FATOR_MINIMO } from '../domain/pontuacao.js';
import { LIMITE_DOMINADO, LIMITE_REVISAR, MIN_RESPOSTAS } from '../domain/progresso.js';

const pct = (value) => `${Math.round(value * 100)}%`;

export default function ComoFunciona({ onOpenTab, studyAvailable }) {
  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-2xl font-black text-white">Como funciona</h1>
        <p className="mt-2 text-slate-300">Regras de pontuação, níveis e progresso.</p>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-white">Pontuação</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>Cada acerto vale {PONTOS_POR_DIFICULDADE} pontos multiplicados pela dificuldade da questão (de 1 a 5).</li>
          <li>Na Prática, cada nível de ajuda do Mentor usado desconta {pct(DESCONTO_POR_AJUDA)} dos pontos daquela questão; ela sempre vale pelo menos {pct(FATOR_MINIMO)}.</li>
          <li>Erros não tiram pontos.</li>
          <li>Respostas que não puderam ser lidas (número, unidade ou fórmula mal escritos) não contam: é só corrigir e responder de novo.</li>
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-white">Níveis</h2>
        <ol className="mt-2 grid gap-1 text-sm text-slate-300 sm:grid-cols-2">
          {NIVEIS.map((level) => <li key={level.nivel}>Nível {level.nivel} · <strong className="text-white">{level.nome}</strong>: a partir de {level.minimo} pontos</li>)}
        </ol>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-white">Progresso nos temas</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>Um tema só é avaliado depois de {MIN_RESPOSTAS} respostas.</li>
          <li>Com acerto de {pct(LIMITE_DOMINADO)} ou mais, o tema conta como concluído e sai da fila da trilha.</li>
          <li>Com acerto abaixo de {pct(LIMITE_REVISAR)}, o tema volta para a Revisão em Fundamentos, e o caminho até ele passa à frente.</li>
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-white">Sobre</h2>
        <ul className="mt-2 space-y-2 text-sm text-slate-300">
          <li>Visão Química, versão {packageJson.version}.</li>
          <li>O Laboratório do Mentor segue regras fixas escritas para o app e não usa IA generativa.</li>
          <li>Perfil, progresso, pontos e histórico do Mentor ficam neste aparelho. Não há conta nem sincronização desses dados.</li>
          <li>Em Perfil, exporte ou compartilhe manualmente um arquivo JSON para levar o progresso a outro aparelho. O lembrete semanal ou mensal só aparece quando o app é aberto; não há envio nem notificação em segundo plano.</li>
          <li>O arquivo de backup pode incluir etapa escolar, desempenho e histórico do Mentor. Se escolher e-mail ao compartilhar, o provedor de e-mail recebe o anexo e pode armazená-lo.</li>
          <li>Massas atômicas da IUPAC (CIAAW). Todo o conteúdo funciona offline, inclusive no Android e no Windows.</li>
          <li>As questões são originais e ainda passam por revisão de professores de Química.</li>
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-white">Projeto e créditos</h2>
        <p className="mt-2 text-sm text-slate-300">Informações sobre o desenvolvimento, a instituição, a matéria e o uso por professores.</p>
        {!studyAvailable && <p className="mt-2 text-sm text-slate-400">Escolha sua etapa escolar para acessar os conteúdos de Química.</p>}
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <li>
            <a href="https://github.com/DiamondDust01/visao-quimica" target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-300 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300">
              Desenvolvedores (GitHub)
            </a>
          </li>
          <li>
            <a href="https://www.ifpi.edu.br/" target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-300 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300">
              IFPI
            </a>
          </li>
          <li>
            <button type="button" onClick={() => onOpenTab('fundamentos')} disabled={!studyAvailable} className={`font-semibold underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300 ${studyAvailable ? 'text-teal-300 hover:underline' : 'cursor-not-allowed text-slate-600'}`}>
              Matéria: Química
            </button>
          </li>
          <li>
            <button type="button" onClick={() => onOpenTab('fundamentos')} disabled={!studyAvailable} className={`font-semibold underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300 ${studyAvailable ? 'text-teal-300 hover:underline' : 'cursor-not-allowed text-slate-600'}`}>
              Para professores: trilhas de apoio às aulas
            </button>
          </li>
        </ul>
      </Card>
    </div>
  );
}
