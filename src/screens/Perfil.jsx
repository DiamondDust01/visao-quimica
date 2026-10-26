import React, { useEffect, useState } from 'react';
import { buttonDanger, buttonPrimary, buttonSecondary, Card, Notice } from '../components/ui.jsx';
import EtapaPicker from '../components/EtapaPicker.jsx';
import NivelCard from '../components/NivelCard.jsx';

export default function Perfil({ etapas, profile, points = 0, onChooseEtapa, onClearDevice }) {
  const [etapaId, setEtapaId] = useState(profile?.etapaId || '');
  const [saved, setSaved] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);

  useEffect(() => setEtapaId(profile?.etapaId || ''), [profile?.etapaId]);

  const save = (event) => {
    event.preventDefault();
    if (!etapaId) return;
    onChooseEtapa(etapaId);
    setSaved(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-2xl font-black text-white">Perfil</h1>
        <p className="mt-2 text-slate-300">Este app não pede nome nem e-mail. Seu perfil é a etapa escolar e os seus pontos, guardados neste aparelho.</p>
        <div className="mt-4 max-w-md"><NivelCard points={points} /></div>
      </Card>

      <Card>
        <form onSubmit={save} className="space-y-4">
          <h2 className="text-lg font-bold text-white">Etapa escolar</h2>
          <EtapaPicker etapas={etapas} value={etapaId} onChange={(id) => { setEtapaId(id); setSaved(false); }} name="perfil-etapa" />
          {saved && <Notice tone="success">Etapa atualizada. A trilha em Fundamentos já foi recalculada.</Notice>}
          <div className="flex justify-end">
            <button type="submit" disabled={!etapaId || etapaId === profile?.etapaId} className={buttonPrimary}>Salvar etapa</button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-white">Dados deste aparelho</h2>
        <p className="mt-2 text-sm text-slate-300">Apaga a etapa, o progresso, os pontos, o registro do Mentor e as preferências guardados aqui. Não dá para desfazer.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {!confirmingClear && <button type="button" onClick={() => setConfirmingClear(true)} className={buttonDanger}>Apagar dados deste aparelho</button>}
          {confirmingClear && (
            <>
              <button type="button" onClick={onClearDevice} className={buttonDanger}>Sim, apagar tudo</button>
              <button type="button" onClick={() => setConfirmingClear(false)} className={buttonSecondary}>Cancelar</button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
