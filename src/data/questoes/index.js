// Banco de questões: um arquivo por área da taxonomia ({ area, questoes: [...] }).
// Todas as questões são originais e começam com "revisado": false até a revisão de um
// professor de Química.
import fundamentos from './fundamentos.json' with { type: 'json' };
import estruturaAtomica from './estrutura-atomica.json' with { type: 'json' };
import tabelaPeriodica from './tabela-periodica.json' with { type: 'json' };
import ligacoes from './ligacoes.json' with { type: 'json' };
import funcoesInorganicas from './funcoes-inorganicas.json' with { type: 'json' };
import reacoesEstequiometria from './reacoes-estequiometria.json' with { type: 'json' };
import gases from './gases.json' with { type: 'json' };
import solucoes from './solucoes.json' with { type: 'json' };
import termoquimica from './termoquimica.json' with { type: 'json' };
import cinetica from './cinetica.json' with { type: 'json' };
import equilibrio from './equilibrio.json' with { type: 'json' };
import eletroquimica from './eletroquimica.json' with { type: 'json' };
import organica from './organica.json' with { type: 'json' };
import bioquimica from './bioquimica.json' with { type: 'json' };
import radioatividade from './radioatividade.json' with { type: 'json' };
import ambiental from './ambiental.json' with { type: 'json' };
import analitica from './analitica.json' with { type: 'json' };
import fisicoQuimica from './fisico-quimica.json' with { type: 'json' };
import inorganicaAvancada from './inorganica-avancada.json' with { type: 'json' };
import laboratorio from './laboratorio.json' with { type: 'json' };

const ARQUIVOS = [fundamentos, estruturaAtomica, tabelaPeriodica, ligacoes, funcoesInorganicas, reacoesEstequiometria, gases, solucoes, termoquimica, cinetica, equilibrio, eletroquimica, organica, bioquimica, radioatividade, ambiental, analitica, fisicoQuimica, inorganicaAvancada, laboratorio];

export const QUESTION_FILES = ARQUIVOS;
export const QUESTIONS = ARQUIVOS.flatMap((arquivo) => arquivo.questoes);
