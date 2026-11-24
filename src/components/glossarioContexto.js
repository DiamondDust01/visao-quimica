import { createContext } from 'react';

// Presente só dentro de uma questão (GlossarioProvider). Fora dela, o ChemText mostra o
// texto sem marcar palavras.
export const GlossarioContexto = createContext(null);
