import React from 'react';
import { buttonPrimary, Card } from '../components/ui.jsx';
import packageJson from '../../package.json';
import { NIVEIS, PONTOS_POR_DIFICULDADE, DESCONTO_POR_AJUDA, FATOR_MINIMO } from '../domain/pontuacao.js';
import { LIMITE_DOMINADO, LIMITE_REVISAR, MIN_RESPOSTAS } from '../domain/progresso.js';
import useSectionFocus from '../app/useSectionFocus.js';
import { corDe } from '../app/cores.js';
import { TABS } from '../app/navigation.js';

// Filete com a cor da área no topo do cartão de título.
const HERO = `border-t-4 ${corDe('como-funciona').borda}`;

const pct = (value) => `${Math.round(value * 100)}%`;

// focusSection: 'regras' ou 'creditos', quando o estudante chega pelo menu "Mais".
export default function ComoFunciona({ onOpenTab, studyAvailable, onStartGuide, focusSection }) {
  useSectionFocus('ajuda', focusSection);
  return (
    <div className="space-y-4">
      <Card className={HERO}>
        <h1 className="text-2xl font-black text-white">Ajuda e informações</h1>
        <p className="mt-2 text-slate-300">Regras de pontuação, níveis, progresso e detalhes do projeto.</p>
        {studyAvailable && onStartGuide && (
          <button type="button" onClick={onStartGuide} className={`${buttonPrimary} mt-4`}>Abrir o guia de uso</button>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-white">Para que serve cada módulo</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {TABS.map((aba) => (
            <li key={aba.id} className={`rounded-xl border border-t-4 border-slate-800 bg-slate-950/40 p-3 ${corDe(aba.id).borda}`}>
              <p className={`text-xs font-bold uppercase tracking-wide ${corDe(aba.id).titulo}`}>{aba.pergunta}</p>
              <p className="font-bold text-white">{aba.label}</p>
              <p className="text-sm text-slate-400">{aba.description}{aba.id === 'laboratorio' ? ' Aparece depois das primeiras respostas erradas.' : ''}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-slate-400">Antes de toda sessão de questões, o app mostra o tema escolhido e quantas questões vêm, e só começa quando você confirma. A sessão abre numa tela própria, por cima do módulo de onde você começou, e volta para ele no fim.</p>
      </Card>

      <Card id="ajuda-regras" tabIndex={-1} className="scroll-mt-24 outline-none">
        <h2 className="text-lg font-bold text-white">Pontuação</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>Cada acerto vale {PONTOS_POR_DIFICULDADE} pontos multiplicados pela dificuldade da questão (de 1 a 5).</li>
          <li>Na Prática, cada nível de ajuda do Mentor usado desconta {pct(DESCONTO_POR_AJUDA)} dos pontos daquela questão; ela sempre vale pelo menos {pct(FATOR_MINIMO)}.</li>
          <li>As explicações do glossário (palavras com sublinhado pontilhado nas questões) não descontam pontos. Termos que são o próprio assunto da questão só ganham explicação depois da resposta.</li>
          <li>Erros não tiram pontos.</li>
          <li>O material de leitura ("Não sei este conteúdo", na questão, ou "Ler", na Trilha) não desconta pontos. Todos os subtemas têm um texto curto, ainda sem revisão de professor.</li>
          <li>Durante a sessão, um relógio conta o tempo de estudo. Ele pausa quando o app fica em segundo plano, e o total aparece no resultado e no Início.</li>
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
          <li>Com acerto abaixo de {pct(LIMITE_REVISAR)}, o tema volta para a Revisão na Trilha, e o caminho até ele passa à frente.</li>
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-white">Sobre</h2>
        <ul className="mt-2 space-y-2 text-sm text-slate-300">
          <li>Visão Química, versão {packageJson.version}.</li>
          <li>O Laboratório do Mentor segue regras fixas escritas para o app e não usa IA generativa. A aba dele aparece depois das primeiras respostas erradas, quando ele já tem o que sugerir para revisar.</li>
          <li>Perfil, progresso, pontos e histórico do Mentor ficam neste aparelho. Não há conta nem sincronização desses dados.</li>
          <li>Em Perfil, exporte ou compartilhe manualmente um arquivo JSON para levar o progresso a outro aparelho. O lembrete semanal ou mensal só aparece quando o app é aberto; não há envio nem notificação em segundo plano.</li>
          <li>O arquivo de backup pode incluir etapa escolar, desempenho e histórico do Mentor. Se escolher e-mail ao compartilhar, o provedor de e-mail recebe o anexo e pode armazená-lo.</li>
          <li>Massas atômicas da IUPAC (CIAAW). Todo o conteúdo funciona offline, inclusive no Android e no Windows.</li>
          <li>As questões são originais e ainda passam por revisão de professores de Química.</li>
        </ul>
      </Card>

      <Card id="ajuda-creditos" tabIndex={-1} className="scroll-mt-24 outline-none">
        <h2 className="text-lg font-bold text-white">Projeto e créditos</h2>
        <p className="mt-2 text-sm text-slate-300">Informações sobre o desenvolvimento, a instituição e as trilhas de Química.</p>
        {!studyAvailable && <p className="mt-2 text-sm text-slate-400">Escolha sua etapa escolar para acessar os conteúdos de Química.</p>}
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <li>
            <a href="https://www.ifpi.edu.br/" target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-300 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300">
              IFPI
            </a>
          </li>
          <li>
            <button type="button" onClick={() => onOpenTab('fundamentos')} disabled={!studyAvailable} className={`font-semibold underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300 ${studyAvailable ? 'text-teal-300 hover:underline' : 'cursor-not-allowed text-slate-600'}`}>
              Trilhas de Química para estudantes e professores
            </button>
          </li>
        </ul>
      </Card>
    </div>
  );
}
