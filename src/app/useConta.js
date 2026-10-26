import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { STORAGE_KEYS, readValue, removeValue, writeValue } from '../platform/storage.js';
import { contaDisponivel, excluirConta, lerConta, salvarConta } from '../platform/contaNuvem.js';
import { codigoValido, derivarConta, gerarCodigo, mesclarInstantaneos, montarInstantaneo, normalizarCodigo } from '../domain/conta.js';

// Espera depois da última mudança antes de enviar (várias respostas seguidas viram um envio só).
const ESPERA_ENVIO_MS = 2500;

// Comparação sem a data de salvamento: evita reenviar o que não mudou.
const conteudo = (snapshot) => JSON.stringify({ ...snapshot, salvoEm: null });

// Conta por código de acesso: guarda o código neste aparelho, baixa e mescla o progresso ao
// entrar e envia (cifrado) a cada mudança. study: retorno de useStudyState; user: login anônimo
// do Firebase (as regras exigem login).
export default function useConta(study, user) {
  const disponivel = contaDisponivel();
  const [codigo, setCodigo] = useState(() => {
    const stored = readValue(STORAGE_KEYS.conta);
    return stored && codigoValido(stored) ? normalizarCodigo(stored) : null;
  });
  const [estado, setEstado] = useState({ status: 'parada', ultimaSincronizacao: null, erro: '' });
  const contaRef = useRef(null); // { codigo, id, chave }
  const enviadoRef = useRef(null);
  const prontoRef = useRef(false); // true depois da primeira leitura da nuvem
  const { profile, progress, points, mentorLog, applySnapshot } = study;
  const local = useMemo(() => montarInstantaneo({ profile, progress, points, mentorLog }), [profile, progress, points, mentorLog]);
  const localRef = useRef(local);
  localRef.current = local;
  const atual = useMemo(() => conteudo(local), [local]);

  const enviar = useCallback(async (snapshot) => {
    const conta = contaRef.current;
    if (!conta) return;
    setEstado((current) => ({ ...current, status: 'sincronizando', erro: '' }));
    try {
      await salvarConta(conta, snapshot);
      enviadoRef.current = conteudo(snapshot);
      setEstado({ status: 'sincronizada', ultimaSincronizacao: new Date().toISOString(), erro: '' });
    } catch (error) {
      setEstado((current) => ({ ...current, status: 'erro', erro: `Não foi possível salvar na nuvem: ${error?.message || error}` }));
    }
  }, []);

  // Baixa a conta, mescla com este aparelho, aplica e envia o resultado se mudou algo.
  const sincronizar = useCallback(async () => {
    const conta = contaRef.current;
    if (!conta) return;
    setEstado((current) => ({ ...current, status: 'sincronizando', erro: '' }));
    try {
      const remoto = await lerConta(conta);
      const mesclado = remoto ? mesclarInstantaneos(localRef.current, remoto) : localRef.current;
      applySnapshot(mesclado);
      prontoRef.current = true;
      if (!remoto || conteudo(mesclado) !== conteudo(remoto)) await enviar(mesclado);
      else {
        enviadoRef.current = conteudo(mesclado);
        setEstado({ status: 'sincronizada', ultimaSincronizacao: new Date().toISOString(), erro: '' });
      }
    } catch (error) {
      setEstado((current) => ({ ...current, status: 'erro', erro: `Não foi possível sincronizar: ${error?.message || error}` }));
    }
  }, [applySnapshot, enviar]);

  // Ao abrir o app com uma conta salva (e com login no Firebase), deriva a chave e sincroniza.
  useEffect(() => {
    if (!disponivel || !user || !codigo || contaRef.current?.codigo === codigo) return undefined;
    let active = true;
    prontoRef.current = false;
    derivarConta(codigo).then((derived) => {
      if (!active) return;
      contaRef.current = { codigo, ...derived };
      sincronizar();
    }).catch((error) => setEstado({ status: 'erro', ultimaSincronizacao: null, erro: error.message }));
    return () => { active = false; };
  }, [disponivel, user, codigo, sincronizar]);

  // Envia as mudanças de estudo, com espera para juntar várias respostas.
  useEffect(() => {
    if (!codigo || !prontoRef.current || atual === enviadoRef.current) return undefined;
    const timer = setTimeout(() => enviar(localRef.current), ESPERA_ENVIO_MS);
    return () => clearTimeout(timer);
  }, [codigo, atual, enviar]);

  const ativar = async (novoCodigo, { exigirExistente }) => {
    const derived = await derivarConta(novoCodigo);
    const conta = { codigo: normalizarCodigo(novoCodigo), ...derived };
    if (exigirExistente && !(await lerConta(conta))) {
      throw new Error('Nenhum progresso salvo com esse código. Confira se digitou certo.');
    }
    contaRef.current = conta;
    writeValue(STORAGE_KEYS.conta, conta.codigo);
    setCodigo(conta.codigo);
    await sincronizar();
  };

  // Cria a conta com o progresso deste aparelho. Devolve o código para a pessoa anotar.
  const criar = async () => {
    const novo = gerarCodigo();
    await ativar(novo, { exigirExistente: false });
    return novo;
  };

  const entrar = (texto) => {
    if (!codigoValido(texto)) return Promise.reject(new Error('Código inválido: confira os 20 caracteres.'));
    return ativar(texto, { exigirExistente: true });
  };

  // Sai da conta neste aparelho; o progresso continua aqui e na nuvem.
  const sair = () => {
    contaRef.current = null;
    enviadoRef.current = null;
    prontoRef.current = false;
    removeValue(STORAGE_KEYS.conta);
    setCodigo(null);
    setEstado({ status: 'parada', ultimaSincronizacao: null, erro: '' });
  };

  // Apaga o progresso da nuvem e sai; o que está neste aparelho continua.
  const excluir = async () => {
    if (contaRef.current) await excluirConta(contaRef.current);
    sair();
  };

  return { disponivel, logado: Boolean(codigo), codigo, ...estado, criar, entrar, sair, excluir, sincronizar };
}
