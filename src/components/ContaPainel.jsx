import React, { useRef, useState } from 'react';
import { Cloud, Copy, Download, KeyRound, LogOut, RefreshCw, Upload } from 'lucide-react';
import { buttonDanger, buttonPrimary, buttonSecondary, Card, Notice, downloadText, inputClass } from './ui.jsx';
import { formatarCodigo, instantaneoValido, mesclarInstantaneos, montarInstantaneo } from '../domain/conta.js';

const copiar = async (texto) => {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
};

const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '');

const STATUS_TEXTO = {
  parada: 'Conectando…',
  sincronizando: 'Sincronizando…',
  sincronizada: 'Progresso salvo na nuvem',
  erro: 'Erro ao sincronizar'
};

// Conta por código de acesso (sem dados pessoais) e backup do progresso em arquivo.
export default function ContaPainel({ conta, study, conectando, servidorPronto }) {
  const [entrada, setEntrada] = useState('');
  const [novoCodigo, setNovoCodigo] = useState(null);
  const [mostrarCodigo, setMostrarCodigo] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState(null); // { tom, texto }
  const arquivoRef = useRef(null);

  const executar = async (acao, sucesso) => {
    setOcupado(true);
    setMensagem(null);
    try {
      const result = await acao();
      if (sucesso) setMensagem({ tom: 'success', texto: sucesso });
      return result;
    } catch (error) {
      setMensagem({ tom: 'error', texto: error?.message || String(error) });
      return null;
    } finally {
      setOcupado(false);
    }
  };

  const criar = async () => {
    const codigo = await executar(() => conta.criar());
    if (codigo) setNovoCodigo(codigo);
  };

  const entrar = async (event) => {
    event.preventDefault();
    const ok = await executar(() => conta.entrar(entrada).then(() => true), 'Pronto: o progresso da conta foi juntado ao deste aparelho.');
    if (ok) setEntrada('');
  };

  const salvarCodigo = (codigo) => downloadText('visao-quimica-codigo-de-acesso.txt', `Código de acesso do Visão Química\r\n\r\n${formatarCodigo(codigo)}\r\n\r\nQuem tiver este código acessa o seu progresso. Guarde em lugar seguro: ele não pode ser recuperado.\r\n`);

  const exportar = () => {
    const snapshot = montarInstantaneo(study);
    downloadText(`visao-quimica-progresso-${snapshot.salvoEm.slice(0, 10)}.json`, JSON.stringify(snapshot, null, 2), 'application/json');
  };

  const importar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    await executar(async () => {
      let parsed;
      try {
        parsed = JSON.parse(await file.text());
      } catch {
        throw new Error('O arquivo não é um backup do Visão Química.');
      }
      if (!instantaneoValido(parsed)) throw new Error('O arquivo não é um backup do Visão Química (ou é de uma versão incompatível).');
      study.applySnapshot(mesclarInstantaneos(montarInstantaneo(study), parsed));
    }, 'Backup importado e juntado ao progresso deste aparelho.');
  };

  return (
    <Card>
      <h2 className="flex items-center gap-2 text-lg font-bold text-white"><Cloud className="h-5 w-5 text-teal-300" aria-hidden="true" /> Conta e backup</h2>
      <p className="mt-2 text-sm text-slate-300">
        A conta não usa e-mail, senha nem nome: você recebe um <strong>código de acesso</strong>. Com ele, o progresso
        fica salvo e pode ser aberto em outro aparelho. O progresso é cifrado neste aparelho antes de ir para a nuvem,
        então o servidor guarda só dados ilegíveis, sem nada que identifique você.
      </p>

      <div className="mt-4 space-y-3">
        {!conta.disponivel && (
          <Notice tone="info">A conta na nuvem precisa do servidor do app, que não está configurado nesta versão. Use o backup em arquivo abaixo para levar o progresso para outro aparelho.</Notice>
        )}

        {conta.disponivel && !servidorPronto && (
          <Notice tone="info">{conectando ? 'Conectando ao servidor…' : 'Sem conexão com o servidor agora. A conta volta a funcionar sozinha quando a conexão voltar; o progresso continua salvo neste aparelho.'}</Notice>
        )}

        {conta.disponivel && servidorPronto && !conta.logado && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-semibold text-white">Criar conta</h3>
              <p className="text-sm text-slate-400">Gera um código novo e salva o progresso deste aparelho.</p>
              <button type="button" disabled={ocupado} onClick={criar} className={buttonPrimary}><KeyRound className="h-4 w-4" aria-hidden="true" /> Criar conta</button>
            </div>
            <form onSubmit={entrar} className="space-y-2">
              <h3 className="font-semibold text-white">Já tenho um código</h3>
              <label className="flex flex-col gap-1 text-sm text-slate-300">
                Código de acesso
                <input type="text" value={entrada} onChange={(event) => setEntrada(event.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="XXXXX-XXXXX-XXXXX-XXXXX" className={`${inputClass} font-mono tracking-wider`} />
              </label>
              <button type="submit" disabled={ocupado || !entrada.trim()} className={buttonSecondary}>Entrar</button>
            </form>
          </div>
        )}

        {novoCodigo && (
          <div className="space-y-3 rounded-xl border border-amber-400/50 bg-amber-500/10 p-4" role="alert">
            <p className="font-semibold text-amber-100">Anote ou salve seu código agora. Ele não aparece de novo por conta própria e não pode ser recuperado.</p>
            <p className="break-all font-mono text-2xl font-black tracking-wider text-white">{formatarCodigo(novoCodigo)}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={async () => setMensagem(await copiar(formatarCodigo(novoCodigo)) ? { tom: 'success', texto: 'Código copiado.' } : { tom: 'warn', texto: 'Não foi possível copiar; anote o código.' })} className={buttonSecondary}><Copy className="h-4 w-4" aria-hidden="true" /> Copiar</button>
              <button type="button" onClick={() => salvarCodigo(novoCodigo)} className={buttonSecondary}><Download className="h-4 w-4" aria-hidden="true" /> Salvar em arquivo</button>
              <button type="button" onClick={() => setNovoCodigo(null)} className={buttonPrimary}>Já guardei o código</button>
            </div>
          </div>
        )}

        {conta.logado && !novoCodigo && (
          <div className="space-y-3">
            <p className="text-sm text-slate-200" aria-live="polite">
              <strong>{STATUS_TEXTO[conta.status]}</strong>
              {conta.status === 'sincronizada' && conta.ultimaSincronizacao ? ` às ${hora(conta.ultimaSincronizacao)}` : ''}.
              {' '}As novas respostas são enviadas sozinhas.
            </p>
            {conta.erro && <Notice tone="error">{conta.erro}</Notice>}
            <p className="text-sm text-slate-300">
              Código: <span className="font-mono text-white">{mostrarCodigo ? formatarCodigo(conta.codigo) : '•••••-•••••-•••••-•••••'}</span>{' '}
              <button type="button" onClick={() => setMostrarCodigo((value) => !value)} className="text-teal-300 underline underline-offset-2">{mostrarCodigo ? 'esconder' : 'mostrar'}</button>
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={ocupado} onClick={() => executar(() => conta.sincronizar())} className={buttonSecondary}><RefreshCw className="h-4 w-4" aria-hidden="true" /> Sincronizar agora</button>
              <button type="button" onClick={() => salvarCodigo(conta.codigo)} className={buttonSecondary}><Download className="h-4 w-4" aria-hidden="true" /> Salvar código em arquivo</button>
              <button type="button" onClick={() => { conta.sair(); setMensagem({ tom: 'info', texto: 'Você saiu da conta neste aparelho. O progresso continua aqui e na nuvem.' }); }} className={buttonSecondary}><LogOut className="h-4 w-4" aria-hidden="true" /> Sair desta conta</button>
              {!confirmarExclusao && <button type="button" onClick={() => setConfirmarExclusao(true)} className={buttonDanger}>Apagar conta da nuvem</button>}
            </div>
            {confirmarExclusao && (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-rose-200">Apaga o progresso salvo na nuvem (o deste aparelho continua). Não dá para desfazer.</p>
                <button type="button" disabled={ocupado} onClick={async () => { await executar(() => conta.excluir(), 'Conta apagada da nuvem.'); setConfirmarExclusao(false); }} className={buttonDanger}>Sim, apagar da nuvem</button>
                <button type="button" onClick={() => setConfirmarExclusao(false)} className={buttonSecondary}>Cancelar</button>
              </div>
            )}
          </div>
        )}

        {mensagem && <Notice tone={mensagem.tom}>{mensagem.texto}</Notice>}

        <div className="border-t border-slate-800 pt-4">
          <h3 className="font-semibold text-white">Backup em arquivo</h3>
          <p className="mt-1 text-sm text-slate-400">Funciona sem internet. Importar junta o arquivo ao progresso deste aparelho, sem contar nada duas vezes.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={exportar} className={buttonSecondary}><Download className="h-4 w-4" aria-hidden="true" /> Exportar progresso</button>
            <button type="button" disabled={ocupado} onClick={() => arquivoRef.current?.click()} className={buttonSecondary}><Upload className="h-4 w-4" aria-hidden="true" /> Importar progresso</button>
            <input ref={arquivoRef} type="file" accept="application/json,.json" onChange={importar} className="hidden" aria-hidden="true" tabIndex={-1} />
          </div>
        </div>
      </div>
    </Card>
  );
}
