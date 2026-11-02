import React from 'react';
import { Card } from '../components/ui.jsx';
import packageJson from '../../package.json';
import { NIVEIS, PONTOS_POR_DIFICULDADE, DESCONTO_POR_AJUDA, FATOR_MINIMO } from '../domain/pontuacao.js';
import { LIMITE_DOMINADO, LIMITE_REVISAR, MIN_RESPOSTAS } from '../domain/progresso.js';
import { MAX_ROOM_PLAYERS } from '../platform/competitionRooms.js';

const pct = (value) => `${Math.round(value * 100)}%`;

export default function ComoFunciona({ firebaseEnabled, onOpenTab, studyAvailable }) {
  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-2xl font-black text-white">Como funciona</h1>
        <p className="mt-2 text-slate-300">Regras de pontuação, níveis, progresso e uso das salas.</p>
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
        <h2 className="text-lg font-bold text-white">Desafios em sala</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>O professor escolhe os temas, o número de questões, o tempo e os limites de participantes (até {MAX_ROOM_PLAYERS}). As questões são sorteadas na criação, e todos respondem as mesmas, na mesma ordem.</li>
          <li>Os participantes entram com o código ou o QR e recebem um apelido sorteado: ninguém digita nome.</li>
          <li>Na sala não há ajuda do Mentor. O ranking ordena por pontos, depois por acertos, depois por quem chegou antes à pontuação.</li>
          <li>Cada aparelho calcula a própria pontuação. Isso basta para uma atividade em sala, mas não é uma prova oficial nem à prova de fraude.</li>
          <li>
            {firebaseEnabled
              ? 'Este app está ligado a um servidor: alunos em outros aparelhos podem entrar na sala.'
              : 'Sem servidor configurado, as salas funcionam só como demonstração entre abas do mesmo navegador.'}
          </li>
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-white">Sobre</h2>
        <ul className="mt-2 space-y-2 text-sm text-slate-300">
          <li>Visão Química, versão {packageJson.version}.</li>
          <li>O Laboratório do Mentor segue regras fixas escritas para o app. Ele não usa IA generativa, e nada do que você digita sai deste aparelho.</li>
          <li>{firebaseEnabled ? 'O login é anônimo: nenhum nome ou e-mail é pedido.' : 'Seu progresso, seus pontos e seu perfil ficam neste aparelho.'}</li>
          <li>{firebaseEnabled
            ? 'Conta opcional, em Perfil: você recebe um código de acesso, sem e-mail nem senha. O progresso é cifrado no aparelho antes de ir para a nuvem, e o servidor não consegue lê-lo. Quem perde o código perde o acesso.'
            : 'Para levar o progresso a outro aparelho, use o backup em arquivo, em Perfil.'}</li>
          <li>Massas atômicas da IUPAC (CIAAW). Todo o conteúdo funciona offline, inclusive no Android e no Windows.</li>
          <li>As questões são originais e ainda passam por revisão de professores de Química.</li>
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-white">Projeto e créditos</h2>
        <p className="mt-2 text-sm text-slate-300">Informações sobre o desenvolvimento, a instituição, a matéria e o uso por professores.</p>
        {!studyAvailable && <p className="mt-2 text-sm text-slate-400">Escolha sua etapa escolar para acessar os conteúdos de Química e os desafios em sala.</p>}
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
            <button type="button" onClick={() => onOpenTab('desafios')} disabled={!studyAvailable} className={`font-semibold underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300 ${studyAvailable ? 'text-teal-300 hover:underline' : 'cursor-not-allowed text-slate-600'}`}>
              Para professores: desafios em sala
            </button>
          </li>
        </ul>
      </Card>
    </div>
  );
}
