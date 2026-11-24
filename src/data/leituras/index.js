// Materiais de leitura: um texto curto por subtema, que o estudante abre quando diz que não
// sabe o conteúdo. Um arquivo por área ({ area, revisado, leituras: [...] }). Os textos são
// originais e começam com "revisado": false até a revisão de um professor de Química.
// Cada leitura: { subtemaId, introducao, secoes: [{ titulo, texto }], exemplo, pontosChave: [] }.
// Os textos aceitam fórmulas \ce{...}, como as questões.
import fundamentos from './fundamentos.json' with { type: 'json' };
import termoquimica from './termoquimica.json' with { type: 'json' };
import estruturaAtomica from './estrutura-atomica.json' with { type: 'json' };
import tabelaPeriodica from './tabela-periodica.json' with { type: 'json' };
import ligacoes from './ligacoes.json' with { type: 'json' };
import funcoesInorganicas from './funcoes-inorganicas.json' with { type: 'json' };
import reacoesEstequiometria from './reacoes-estequiometria.json' with { type: 'json' };
import gases from './gases.json' with { type: 'json' };
import solucoes from './solucoes.json' with { type: 'json' };
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

export const ARQUIVOS_LEITURA = [fundamentos, estruturaAtomica, tabelaPeriodica, ligacoes, funcoesInorganicas, reacoesEstequiometria, gases, solucoes, termoquimica, cinetica, equilibrio, eletroquimica, organica, bioquimica, radioatividade, ambiental, analitica, fisicoQuimica, inorganicaAvancada, laboratorio];

export const LEITURAS = new Map(ARQUIVOS_LEITURA.flatMap((arquivo) => arquivo.leituras.map((leitura) => [leitura.subtemaId, leitura])));

export const leituraDe = (subtemaId) => LEITURAS.get(subtemaId) || null;
