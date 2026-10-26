import { useCallback, useState } from 'react';
import { STORAGE_KEYS, clearAppStorage, readJson, writeJson } from '../platform/storage.js';
import { createProfile, readValidProfile } from '../domain/perfil.js';
import { registerAnswer } from '../domain/progresso.js';
import { appendLog } from '../domain/mentor/revisao.js';

const readObject = (key) => {
  const stored = readJson(key, {});
  return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
};

const readList = (key) => {
  const stored = readJson(key, []);
  return Array.isArray(stored) ? stored : [];
};

// Estado de estudo guardado neste aparelho: perfil (etapa), progresso por subtema,
// pontos acumulados e registro de erros do Mentor.
export default function useStudyState(etapaIds) {
  const [profile, setProfile] = useState(() => readValidProfile(readJson(STORAGE_KEYS.perfil), etapaIds));
  const [progress, setProgress] = useState(() => readObject(STORAGE_KEYS.progresso));
  const [points, setPoints] = useState(() => {
    const stored = Number(readJson(STORAGE_KEYS.pontos, 0));
    return Number.isFinite(stored) && stored >= 0 ? stored : 0;
  });
  const [mentorLog, setMentorLog] = useState(() => readList(STORAGE_KEYS.mentor));

  const chooseEtapa = useCallback((etapaId) => {
    const next = createProfile(etapaId);
    writeJson(STORAGE_KEYS.perfil, next);
    setProfile(next);
  }, []);

  const updateProgress = useCallback((update) => {
    setProgress((current) => {
      const next = typeof update === 'function' ? update(current) : update;
      writeJson(STORAGE_KEYS.progresso, next);
      return next;
    });
  }, []);

  // Uma resposta corrigida: atualiza progresso, pontos e, se errada, o registro do Mentor.
  // record: { questaoId, temaId, status, pontos, padroes }
  const recordAnswer = useCallback((record) => {
    updateProgress((current) => registerAnswer(current, record.temaId, record.status === 'correta'));
    if (record.pontos) {
      setPoints((current) => {
        const next = current + record.pontos;
        writeJson(STORAGE_KEYS.pontos, next);
        return next;
      });
    }
    if (record.status !== 'correta') {
      setMentorLog((current) => {
        const next = appendLog(current, { em: new Date().toISOString(), questaoId: record.questaoId, temaId: record.temaId, padroes: record.padroes || [] });
        writeJson(STORAGE_KEYS.mentor, next);
        return next;
      });
    }
  }, [updateProgress]);

  // Apaga tudo o que o app guardou neste aparelho; o onboarding aparece de novo.
  const clearDevice = useCallback(() => {
    const removed = clearAppStorage();
    setProfile(null);
    setProgress({});
    setPoints(0);
    setMentorLog([]);
    return removed;
  }, []);

  return { profile, progress, points, mentorLog, chooseEtapa, updateProgress, recordAnswer, clearDevice };
}
