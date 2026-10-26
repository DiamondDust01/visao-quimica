// Taxonomia de temas (Área → Tema → Subtema). Os dados ficam nos JSON desta pasta,
// um por área, na ordem de meta.json. Nada de conteúdo fica nos componentes.
import meta from './meta.json' with { type: 'json' };
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

export const TAXONOMY_META = meta;

const BY_ID = Object.fromEntries([
  fundamentos, estruturaAtomica, tabelaPeriodica, ligacoes, funcoesInorganicas, reacoesEstequiometria,
  gases, solucoes, termoquimica, cinetica, equilibrio, eletroquimica, organica, bioquimica,
  radioatividade, ambiental, analitica, fisicoQuimica, inorganicaAvancada, laboratorio
].map((area) => [area.id, area]));

// Áreas na ordem de meta.json. Uma área listada sem arquivo aparece como `undefined`
// e é apontada pelo validador.
export const TAXONOMY_AREAS = meta.ordemAreas.map((id) => BY_ID[id]);
export const TAXONOMY_AREA_IDS_WITH_FILE = Object.keys(BY_ID);
