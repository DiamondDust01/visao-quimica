import React, { useRef, useState } from 'react';
import { Download, Share2, Upload } from 'lucide-react';
import { buttonPrimary, buttonSecondary, Card, Notice, downloadText } from './ui.jsx';
import {
  concluirBackup, criarLembreteBackup, instantaneoValido, lembreteBackupVencido,
  mesclarInstantaneos, montarInstantaneo, normalizarLembreteBackup
} from '../domain/backup.js';
import { readJson, STORAGE_KEYS, writeJson } from '../platform/storage.js';

const formatarData = (value) => {
  if (!value) return 'nenhum backup salvo neste aparelho';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString('pt-BR') : 'data desconhecida';
};

const mensagemDeErro = (error) => error?.message || 'Não foi possível concluir a operação.';

export default function BackupPainel({ study }) {
  const [lembrete, setLembrete] = useState(() => normalizarLembreteBackup(readJson(STORAGE_KEYS.lembreteBackup)));
  const [mensagem, setMensagem] = useState(null);
  const arquivoRef = useRef(null);
  const vencido = lembreteBackupVencido(lembrete);

  const registrarBackup = () => {
    const atualizado = concluirBackup(lembrete);
    setLembrete(atualizado);
    return writeJson(STORAGE_KEYS.lembreteBackup, atualizado);
  };

  const exportar = () => {
    try {
      const snapshot = montarInstantaneo(study);
      downloadText(`visao-quimica-progresso-${snapshot.salvoEm.slice(0, 10)}.json`, JSON.stringify(snapshot, null, 2), 'application/json');
      setMensagem(registrarBackup()
        ? { tom: 'success', texto: 'Backup baixado. Guarde o arquivo em um local seguro.' }
        : { tom: 'warn', texto: 'O backup foi baixado, mas o aparelho não conseguiu atualizar o lembrete.' });
    } catch (error) {
      setMensagem({ tom: 'error', texto: mensagemDeErro(error) });
    }
  };

  const compartilhar = async () => {
    try {
      const snapshot = montarInstantaneo(study);
      const nome = `visao-quimica-progresso-${snapshot.salvoEm.slice(0, 10)}.json`;
      const arquivo = new File([JSON.stringify(snapshot, null, 2)], nome, { type: 'application/json' });
      if (navigator.share && navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({
          files: [arquivo],
          title: 'Backup do Visão Química',
          text: 'Backup do seu progresso de estudo.'
        });
        setMensagem(registrarBackup()
          ? { tom: 'success', texto: 'Compartilhamento concluído.' }
          : { tom: 'warn', texto: 'O arquivo foi compartilhado, mas o aparelho não conseguiu atualizar o lembrete.' });
        return;
      }
      downloadText(nome, JSON.stringify(snapshot, null, 2), 'application/json');
      setMensagem(registrarBackup()
        ? { tom: 'info', texto: 'Este aparelho não oferece compartilhamento de arquivo. O backup foi baixado; anexe-o manualmente ao e-mail.' }
        : { tom: 'warn', texto: 'O backup foi baixado, mas o aparelho não conseguiu atualizar o lembrete.' });
    } catch (error) {
      setMensagem(error?.name === 'AbortError'
        ? { tom: 'info', texto: 'Compartilhamento cancelado; nenhum envio foi feito.' }
        : { tom: 'error', texto: mensagemDeErro(error) });
    }
  };

  const importar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      let parsed;
      try {
        parsed = JSON.parse(await file.text());
      } catch {
        throw new Error('O arquivo não é um backup do Visão Química.');
      }
      if (!instantaneoValido(parsed)) throw new Error('O arquivo não é um backup do Visão Química (ou é de uma versão incompatível).');
      study.applySnapshot(mesclarInstantaneos(montarInstantaneo(study), parsed));
      setMensagem({ tom: 'success', texto: 'Backup importado e juntado ao progresso deste aparelho.' });
    } catch (error) {
      setMensagem({ tom: 'error', texto: mensagemDeErro(error) });
    }
  };

  const alterarLembrete = (event) => {
    const atualizado = criarLembreteBackup(event.target.value, new Date(), lembrete.ultimoBackupEm);
    setLembrete(atualizado);
    setMensagem(writeJson(STORAGE_KEYS.lembreteBackup, atualizado)
      ? { tom: 'success', texto: 'Preferência de lembrete salva neste aparelho.' }
      : { tom: 'error', texto: 'Não foi possível salvar a preferência neste aparelho.' });
  };

  return (
    <Card>
      <h2 className="text-lg font-bold text-white">Backup local</h2>
      <p className="mt-2 text-sm text-slate-300">
        Seu perfil, progresso, pontos e histórico do Mentor ficam neste aparelho. Não há conta nem envio automático
        desses dados. O backup pode conter etapa escolar, desempenho e histórico do Mentor; compartilhe-o somente
        com quem você escolher.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={exportar} className={buttonSecondary}><Download className="h-4 w-4" aria-hidden="true" /> Exportar progresso</button>
        <button type="button" onClick={compartilhar} className={buttonPrimary}><Share2 className="h-4 w-4" aria-hidden="true" /> Compartilhar backup</button>
        <button type="button" onClick={() => arquivoRef.current?.click()} className={buttonSecondary}><Upload className="h-4 w-4" aria-hidden="true" /> Importar progresso</button>
        <input ref={arquivoRef} type="file" accept="application/json,.json" onChange={importar} className="hidden" aria-hidden="true" tabIndex={-1} />
      </div>
      <p className="mt-3 text-sm text-slate-400">
        Se escolher e-mail na janela de compartilhamento, o provedor de e-mail receberá o anexo. Sem compartilhamento
        de arquivo, baixe o JSON e anexe-o manualmente.
      </p>
      <div className="mt-5 space-y-3 border-t border-slate-800 pt-4">
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-200 sm:flex-row sm:items-center sm:justify-between">
          Lembrete de backup
          <select aria-label="Frequência do lembrete de backup" value={lembrete.frequencia} onChange={alterarLembrete} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-base text-white focus:border-teal-400 focus:outline-none">
            <option value="nunca">Desativado</option>
            <option value="semanal">Semanal</option>
            <option value="mensal">Mensal</option>
          </select>
        </label>
        <p className="text-sm text-slate-400">Último backup: {formatarData(lembrete.ultimoBackupEm)}.</p>
        {vencido && <Notice tone="warn">Está na hora de salvar um novo backup.</Notice>}
        <p className="text-xs text-slate-500">O lembrete aparece aqui quando você abre o Perfil. Não envia e-mail nem notifica em segundo plano.</p>
      </div>
      {mensagem && <div className="mt-4"><Notice tone={mensagem.tom}>{mensagem.texto}</Notice></div>}
    </Card>
  );
}
