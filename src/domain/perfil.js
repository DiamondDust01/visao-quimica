// Perfil do estudante neste aparelho: só a etapa escolar escolhida. Nenhum dado pessoal.
// Formato: { etapaId, atualizadoEm }

export const isValidProfile = (profile, etapaIds) => Boolean(profile) && etapaIds.includes(profile.etapaId);

export const createProfile = (etapaId, now = new Date().toISOString()) => ({ etapaId, atualizadoEm: now });

// Perfil salvo com etapa que não existe mais (ex.: depois de uma atualização) conta como ausente,
// e o onboarding aparece de novo.
export const readValidProfile = (stored, etapaIds) => (isValidProfile(stored, etapaIds) ? stored : null);
