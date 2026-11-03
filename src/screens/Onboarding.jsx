import React, { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { buttonPrimary, Card } from '../components/ui.jsx';
import EtapaPicker from '../components/EtapaPicker.jsx';

// Primeiro uso: o estudante informa a etapa escolar para receber uma trilha sugerida.
export default function Onboarding({ etapas, observacao, onChoose }) {
  const [etapaId, setEtapaId] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (etapaId) onChoose(etapaId);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Card>
        <div className="flex items-center gap-3">
          <FlaskConical className="h-8 w-8 shrink-0 text-teal-300" aria-hidden="true" />
          <h1 className="text-2xl font-black text-white sm:text-3xl">Boas-vindas ao Visão Química</h1>
        </div>
        <p className="mt-3 max-w-2xl text-slate-300">
          Escolha sua etapa para receber uma trilha sugerida, ou selecione Estudo livre para escolher os temas por conta própria. Você pode mudar essa opção depois, em Perfil.
        </p>
      </Card>
      <Card>
        <EtapaPicker etapas={etapas} value={etapaId} onChange={setEtapaId} name="onboarding-etapa" />
        <p className="mt-4 text-xs text-slate-500">{observacao}</p>
        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={!etapaId} className={buttonPrimary}>Continuar</button>
        </div>
      </Card>
    </form>
  );
}
