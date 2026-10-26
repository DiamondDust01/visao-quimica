// Guarda e lê o progresso cifrado de uma conta no Firestore, em artifacts/{appId}/contas/{id}.
// O id é o hash do código de acesso e o conteúdo vem cifrado de src/domain/conta.js: o servidor
// não recebe o código, nem dados de estudo legíveis, nem nada que identifique a pessoa.
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { appId, db } from './firebase.js';
import { cifrar, decifrar } from '../domain/conta.js';

export const contaDisponivel = () => Boolean(db);

const contaRef = (id) => doc(db, 'artifacts', appId, 'contas', id);

// Devolve o instantâneo decifrado, ou null se não há nada salvo com esse código.
export const lerConta = async ({ id, chave }) => {
  const snapshot = await getDoc(contaRef(id));
  if (!snapshot.exists()) return null;
  return decifrar(chave, snapshot.data());
};

export const salvarConta = async ({ id, chave }, instantaneo) => {
  const sealed = await cifrar(chave, instantaneo);
  await setDoc(contaRef(id), { ...sealed, atualizadoEm: serverTimestamp() });
};

export const excluirConta = ({ id }) => deleteDoc(contaRef(id));
