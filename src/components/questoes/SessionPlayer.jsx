import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, CircleCheck, CircleX, Lightbulb, Timer } from 'lucide-react';
import ChemText from '../ChemText.jsx';
import { GlossarioProvider } from '../Glossario.jsx';
import LeituraPainel from '../LeituraPainel.jsx';
import { leituraDe } from '../../data/leituras/index.js';
import EstruturaMolecular from '../EstruturaMolecular.jsx';
import AnswerInput, { initialOrder } from './AnswerInput.jsx';
import { Difficulty } from '../SubtemaItem.jsx';
import { Bar, buttonPrimary, buttonSecondary, Card, Notice } from '../ui.jsx';
import { checkAnswer, describeAnswer, TYPE_LABELS } from '../../domain/questoes/correcao.js';
import { helpLevels } from '../../domain/mentor/estrategias.js';
import { diagnose } from '../../domain/mentor/diagnostico.js';
import { pointsFor, DESCONTO_POR_AJUDA } from '../../domain/pontuacao.js';
import { formatarDuracao, formatarRelogio } from '../../domain/tempo.js';

// Uma questão: resposta, ajuda progressiva do Mentor (opcional), correção imediata,
// padrões de erro detectados e resolução.
// É montada de novo a cada questão (key = id), então resposta, ajuda e retorno sempre
// começam vazios e no formato do tipo (a ordenação já começa embaralhada).
function QuestionStep({ question, index, last, onAnswered, onNext }) {
  const [answer, setAnswer] = useState(() => (question.tipo === 'ordenacao' ? initialOrder(question) : undefined));
  const [helpShown, setHelpShown] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [record, setRecord] = useState(null);
  const headingRef = useRef(null);
  const feedbackRef = useRef(null);
  const subtema = index.get(question.temaId);
  const answered = feedback && feedback.status !== 'invalida';
  const levels = helpLevels(question);
  // Material de leitura do subtema, para quando o estudante diz que não sabe o conteúdo.
  const leitura = leituraDe(question.temaId);
  const [lendo, setLendo] = useState(false);

  useEffect(() => { headingRef.current?.focus(); }, []);
  useEffect(() => { if (answered) feedbackRef.current?.focus(); }, [answered]);

  const submit = (event) => {
    event.preventDefault();
    if (answered) return;
    const result = checkAnswer(question, answer);
    setFeedback(result);
    if (result.status !== 'invalida') {
      const notes = diagnose(question, answer, result);
      const next = {
        questaoId: question.id,
        temaId: question.temaId,
        status: result.status,
        nivelAjuda: helpShown,
        dicaUsada: helpShown > 0,
        pontos: pointsFor({ dificuldade: question.dificuldade, status: result.status, nivelAjuda: helpShown }),
        padroes: notes.map((note) => note.padrao),
        observacoes: notes
      };
      setRecord(next);
      onAnswered(next);
    }
  };

  return (
    <GlossarioProvider temaId={question.temaId} respondida={Boolean(answered)}>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <div data-guia="enunciado" className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="font-semibold uppercase tracking-wide text-teal-300">{subtema?.nome}</span>
            <span className="text-slate-400">{TYPE_LABELS[question.tipo]}</span>
            <Difficulty value={question.dificuldade} />
          </div>
          <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold leading-relaxed text-white outline-none">
            <ChemText text={question.enunciado} />
          </h2>
          </div>
          {question.estrutura && <EstruturaMolecular smiles={question.estrutura.smiles} descricao={`Estrutura da molécula do enunciado, fórmula molecular ${question.estrutura.formula}`} width={300} height={200} />}

          <div data-guia="resposta"><AnswerInput question={question} value={answer} onChange={setAnswer} disabled={answered} /></div>

          {levels.slice(0, helpShown).map((level) => (
            <Notice key={level.nivel} tone="info">
              <span className="font-semibold">Mentor · {level.titulo}: </span><ChemText text={level.texto} />
            </Notice>
          ))}
          {feedback?.status === 'invalida' && <Notice tone="warn">{feedback.mensagem}</Notice>}

          {!answered && (
            <div data-guia="acoes" className="flex flex-wrap items-center gap-2">
              <button type="submit" className={buttonPrimary}>Responder</button>
              {helpShown < levels.length && (
                <button type="button" onClick={() => setHelpShown((value) => value + 1)} className={buttonSecondary}>
                  <Lightbulb className="h-4 w-4" aria-hidden="true" />
                  {helpShown === 0 ? 'Pedir ajuda ao Mentor' : 'Mais ajuda'} ({helpShown + 1} de {levels.length})
                </button>
              )}
              {leitura && (
                <button type="button" data-nao-sei="" onClick={() => setLendo(true)} className={buttonSecondary}>
                  <BookOpen className="h-4 w-4" aria-hidden="true" /> Não sei este conteúdo
                </button>
              )}
              {helpShown < levels.length && levels.length > 0 && (
                <span className="text-xs text-slate-500">Cada ajuda usada desconta {Math.round(DESCONTO_POR_AJUDA * 100)}% dos pontos desta questão.</span>
              )}
            </div>
          )}
        </form>
      </Card>

      {answered && (
        <Card className={feedback.status === 'correta' ? 'border-emerald-500/50' : 'border-rose-500/50'}>
          <div ref={feedbackRef} tabIndex={-1} role="status" className="space-y-3 outline-none">
            <p className={`flex items-center gap-2 text-lg font-black ${feedback.status === 'correta' ? 'text-emerald-300' : 'text-rose-300'}`}>
              {feedback.status === 'correta'
                ? <><CircleCheck className="h-6 w-6" aria-hidden="true" /> Correto!</>
                : <><CircleX className="h-6 w-6" aria-hidden="true" /> Incorreto</>}
            </p>
            <p className="text-slate-200">{feedback.mensagem}</p>
            {feedback.erroComum && (
              <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                <span className="font-semibold">Erro comum: </span><ChemText text={feedback.erroComum} />
              </p>
            )}
            {record?.observacoes.filter((note) => note.padrao !== 'erro-previsto').map((note) => (
              <p key={note.padrao} className="rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-100">
                <span className="font-semibold">O Mentor notou: </span>{note.mensagem}
              </p>
            ))}
            {feedback.status !== 'correta' && (
              <p className="text-sm text-slate-300"><span className="font-semibold">Resposta esperada: </span><ChemText text={describeAnswer(question)} /></p>
            )}
            {record?.status === 'correta' && (
              <p className="text-sm font-semibold text-teal-200">
                +{record.pontos} pontos{record.nivelAjuda > 0 ? ` (com ${record.nivelAjuda} ajuda${record.nivelAjuda > 1 ? 's' : ''} do Mentor)` : ''}
              </p>
            )}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Resolução passo a passo</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-300">
                {question.resolucaoPassoAPasso.map((step, stepIndex) => <li key={stepIndex}><ChemText text={step} /></li>)}
              </ol>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onNext} className={buttonPrimary}>{last ? 'Ver resultado' : 'Próxima questão'}</button>
              {leitura && (
                <button type="button" onClick={() => setLendo(true)} className={buttonSecondary}>
                  <BookOpen className="h-4 w-4" aria-hidden="true" /> Ler sobre o tema
                </button>
              )}
            </div>
          </div>
        </Card>
      )}
      {lendo && leitura && (
        <LeituraPainel leitura={leitura} node={subtema} areaNome={index.areaOf(question.temaId)?.nome} voltarLabel="Voltar à questão" onClose={() => setLendo(false)} />
      )}
    </GlossarioProvider>
  );
}

// Tempo de estudo da sessão, em segundos. Conta de 1 em 1 segundo e pausa enquanto o app
// está em segundo plano (outra aba ou app aberto), para medir só o tempo de estudo.
const useCronometro = () => {
  const [segundos, setSegundos] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) setSegundos((valor) => valor + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return segundos;
};

// Uma sessão de questões: uma por vez, até o fim ou até o estudante encerrar.
// onFinish(respostas, segundos): segundos é o tempo de estudo da sessão.
export default function SessionPlayer({ questions, index, onAnswer, onFinish, endLabel = 'Encerrar sessão' }) {
  const [position, setPosition] = useState(0);
  const [answers, setAnswers] = useState([]);
  const question = questions[position];
  const last = position === questions.length - 1;
  const segundos = useCronometro();

  const handleAnswered = (record) => {
    setAnswers((current) => [...current, record]);
    onAnswer(record);
  };

  const next = () => {
    if (last) onFinish(answers, segundos);
    else setPosition((value) => value + 1);
  };

  return (
    <div className="space-y-4">
      <div data-guia="sessao-topo" className="space-y-2">
        <div className="flex items-center justify-between gap-3 text-sm text-slate-400">
          <span>Questão {position + 1} de {questions.length}</span>
          <span data-cronometro="" className="inline-flex items-center gap-1 font-mono text-slate-300" title="Tempo de estudo nesta sessão">
            <Timer className="h-4 w-4 text-teal-300" aria-hidden="true" />
            <span aria-hidden="true">{formatarRelogio(segundos)}</span>
            <span className="sr-only">Tempo de estudo: {formatarDuracao(segundos)}</span>
          </span>
          <button type="button" onClick={() => onFinish(answers, segundos)} className="font-semibold text-slate-400 underline-offset-2 hover:text-white hover:underline">{endLabel}</button>
        </div>
        <Bar label="Progresso da sessão" value={Math.round((position / questions.length) * 100)} />
      </div>
      <QuestionStep key={question.id} question={question} index={index} last={last} onAnswered={handleAnswered} onNext={next} />
    </div>
  );
}
