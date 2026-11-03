export const VERSAO_BACKUP = 1;

const newer = (a, b) => (String(a || '') >= String(b || ''));
const validTimestamp = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));

export const montarInstantaneo = ({ profile, progress, points, mentorLog }, now = new Date().toISOString()) => ({
  versao: VERSAO_BACKUP,
  salvoEm: now,
  perfil: profile || null,
  progresso: progress || {},
  pontos: Number.isFinite(points) ? points : 0,
  mentor: Array.isArray(mentorLog) ? mentorLog : []
});

export const mesclarInstantaneos = (local, importado, limiteMentor = 200) => {
  const a = local || {};
  const b = importado || {};
  const progresso = { ...(a.progresso || {}) };
  Object.entries(b.progresso || {}).forEach(([id, entry]) => {
    const current = progresso[id];
    const more = !current || (entry?.respondidas || 0) > (current.respondidas || 0)
      || ((entry?.respondidas || 0) === (current.respondidas || 0) && !newer(current.atualizadoEm, entry?.atualizadoEm));
    if (more) progresso[id] = entry;
  });
  const seen = new Set();
  const mentor = [...(a.mentor || []), ...(b.mentor || [])]
    .filter((item) => {
      const key = `${item?.em}|${item?.questaoId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((x, y) => String(x.em).localeCompare(String(y.em)))
    .slice(-limiteMentor);
  const perfil = !a.perfil ? b.perfil || null : !b.perfil ? a.perfil : (newer(a.perfil.atualizadoEm, b.perfil.atualizadoEm) ? a.perfil : b.perfil);
  return {
    versao: VERSAO_BACKUP,
    salvoEm: newer(a.salvoEm, b.salvoEm) ? a.salvoEm || null : b.salvoEm || null,
    perfil,
    progresso,
    pontos: Math.max(Number(a.pontos) || 0, Number(b.pontos) || 0),
    mentor
  };
};

export const instantaneoValido = (value) => Boolean(value)
  && typeof value === 'object'
  && value.versao === VERSAO_BACKUP
  && typeof value.progresso === 'object' && value.progresso !== null && !Array.isArray(value.progresso)
  && Number.isFinite(Number(value.pontos))
  && Array.isArray(value.mentor);

export const normalizarLembreteBackup = (value, now = new Date()) => {
  const frequency = ['nunca', 'semanal', 'mensal'].includes(value?.frequencia) ? value.frequencia : 'nunca';
  return {
    frequencia: frequency,
    configuradoEm: validTimestamp(value?.configuradoEm) ? value.configuradoEm : now.toISOString(),
    ultimoBackupEm: validTimestamp(value?.ultimoBackupEm) ? value.ultimoBackupEm : null
  };
};

export const criarLembreteBackup = (frequency, now = new Date(), lastBackupAt = null) => ({
  frequencia: ['nunca', 'semanal', 'mensal'].includes(frequency) ? frequency : 'nunca',
  configuradoEm: now.toISOString(),
  ultimoBackupEm: validTimestamp(lastBackupAt) ? lastBackupAt : null
});

export const concluirBackup = (reminder, now = new Date()) => ({
  ...normalizarLembreteBackup(reminder, now),
  ultimoBackupEm: now.toISOString()
});

export const lembreteBackupVencido = (reminder, now = new Date()) => {
  const normalized = normalizarLembreteBackup(reminder, now);
  if (!['semanal', 'mensal'].includes(normalized.frequencia)) return false;
  const lastBackup = normalized.ultimoBackupEm || normalized.configuradoEm;
  const due = new Date(lastBackup);
  if (normalized.frequencia === 'semanal') {
    due.setUTCDate(due.getUTCDate() + 7);
  } else {
    const day = due.getUTCDate();
    due.setUTCDate(1);
    due.setUTCMonth(due.getUTCMonth() + 1);
    const lastDayOfMonth = new Date(Date.UTC(due.getUTCFullYear(), due.getUTCMonth() + 1, 0)).getUTCDate();
    due.setUTCDate(Math.min(day, lastDayOfMonth));
  }
  return now.getTime() >= due.getTime();
};
