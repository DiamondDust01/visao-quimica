// Materiais de leitura: um texto curto por subtema, que o estudante abre quando diz que não
// sabe o conteúdo. Um arquivo por área ({ area, revisado, leituras: [...] }). Os textos são
// originais e começam com "revisado": false até a revisão de um professor de Química.
// Cada leitura: { subtemaId, introducao, secoes: [{ titulo, texto }], exemplo, pontosChave: [] }.
// Os textos aceitam fórmulas \ce{...}, como as questões.
import fundamentos from './fundamentos.json' with { type: 'json' };
import termoquimica from './termoquimica.json' with { type: 'json' };

export const ARQUIVOS_LEITURA = [fundamentos, termoquimica];

export const LEITURAS = new Map(ARQUIVOS_LEITURA.flatMap((arquivo) => arquivo.leituras.map((leitura) => [leitura.subtemaId, leitura])));

export const leituraDe = (subtemaId) => LEITURAS.get(subtemaId) || null;
