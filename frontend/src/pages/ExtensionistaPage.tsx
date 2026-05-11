import { useState } from 'react';
import { AppointmentStatus, UserRole } from 'shared';

import type { AppointmentRecord } from '../lib/api';
import type { PageCommonProps } from './types';

type ExtensionistaPageProps = PageCommonProps & {
  onApproveAppointment: (protocolCode: string, extensionistId?: string) => Promise<AppointmentRecord>;
  onCreateAvailability: (payload: {
    extensionistId: string;
    startDateTime: string;
    endDateTime: string;
    capacity: number;
    notes?: string;
  }) => Promise<unknown>;
};

export function ExtensionistaPage({
  currentUser,
  data,
  loading,
  error,
  onApproveAppointment,
  onCreateAvailability,
}: ExtensionistaPageProps) {
  const [feedback, setFeedback] = useState('');
  const [availabilityForm, setAvailabilityForm] = useState({
    startDateTime: '',
    endDateTime: '',
    capacity: 1,
    notes: '',
  });
  const mySlots = data.availability.filter(
    (slot) => !currentUser || currentUser.role === UserRole.ADMINISTRADOR || slot.extensionistId === currentUser.id,
  );
  const myAppointments = data.appointments.filter((appointment) => {
    if (!currentUser) {
      return false;
    }

    if (currentUser.role === UserRole.ADMINISTRADOR) {
      return true;
    }

    return appointment.extensionistId === currentUser.id || appointment.availability?.extensionistId === currentUser.id;
  });

  async function handleApprove(protocolCode: string, extensionistId?: string | null) {
    setFeedback('');

    try {
      const result = await onApproveAppointment(protocolCode, extensionistId ?? currentUser?.id);
      setFeedback(`Agendamento ${result.protocolCode} aprovado com sucesso.`);
    } catch (approveError) {
      setFeedback('Nao foi possivel aprovar o agendamento.');
      console.error(approveError);
    }
  }

  async function handleCreateAvailability(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser) {
      return;
    }

    try {
      await onCreateAvailability({
        extensionistId: currentUser.id,
        startDateTime: new Date(availabilityForm.startDateTime).toISOString(),
        endDateTime: new Date(availabilityForm.endDateTime).toISOString(),
        capacity: Number(availabilityForm.capacity),
        notes: availabilityForm.notes,
      });
      setFeedback('Bloco de agenda cadastrado com sucesso.');
      setAvailabilityForm({
        startDateTime: '',
        endDateTime: '',
        capacity: 1,
        notes: '',
      });
    } catch (availabilityError) {
      setFeedback('Nao foi possivel cadastrar a disponibilidade.');
      console.error(availabilityError);
    }
  }

  return (
    <section>
      <header className="page-header">
        <p className="eyebrow">Modulo extensionista</p>
        <h2>Agenda tecnica e capacidade</h2>
        <p>
          Aqui entra o gerenciamento dos blocos de horario, ocupacao por periodo e a justificativa
          obrigatoria para alteracoes sensiveis.
        </p>
      </header>

      {!currentUser ? <div className="card">Entre com um extensionista para gerenciar os atendimentos.</div> : null}
      {currentUser && ![UserRole.EXTENSIONISTA, UserRole.ADMINISTRADOR].includes(currentUser.role) ? (
        <div className="card">Este modulo pede perfil `EXTENSIONISTA` ou `ADMINISTRADOR`.</div>
      ) : null}
      {loading ? <div className="card">Carregando agenda tecnica...</div> : null}
      {error ? <div className="card feedback-error">{error}</div> : null}
      {feedback ? <div className={feedback.includes('sucesso') ? 'card feedback-success' : 'card feedback-error'}>{feedback}</div> : null}

      <div className="card-grid">
        {mySlots.map((slot) => (
          <article key={slot.id} className="card">
            <span className="pill">{slot.extensionist?.name ?? 'Agenda tecnica'}</span>
            <h3>{new Date(slot.startDateTime).toLocaleString('pt-BR')}</h3>
            <p className="muted">
              ate {new Date(slot.endDateTime).toLocaleString('pt-BR')} - {slot.capacity} vagas
            </p>
            <div className="button-row">
              <button className="button-primary" type="button">
                Liberar vagas
              </button>
              <button className="button-secondary" type="button">
                Bloquear periodo
              </button>
            </div>
          </article>
        ))}
        {mySlots.length === 0 ? <article className="card">Nenhum bloco de horario encontrado.</article> : null}
      </div>

      <div className="two-column-grid" style={{ marginTop: 24 }}>
        <article className="card">
          <h3>Regras previstas</h3>
          <ul className="list">
            <li>
              <strong>Cadastro em lote</strong>
              <span className="muted">Criacao de horarios por semana ou por mes.</span>
            </li>
            <li>
              <strong>Capacidade por bloco</strong>
              <span className="muted">Controle de quantidade de atendimentos por horario.</span>
            </li>
            <li>
              <strong>Reagendamento com motivo</strong>
              <span className="muted">Toda mudanca critica deve registrar justificativa.</span>
            </li>
          </ul>
        </article>

        <article className="card">
          <h3>Atendimentos do dia</h3>
          <ul className="list">
            {myAppointments.map((appointment) => (
              <li key={appointment.id}>
                <strong>{appointment.protocolCode}</strong>
                <span className="muted">
                  {appointment.service?.name ?? 'Servico'} - {appointment.property?.displayName ?? 'Propriedade'} -{' '}
                  {appointment.status}
                </span>
                {appointment.status !== AppointmentStatus.APROVADO ? (
                  <button
                    className="button-secondary compact-button"
                    type="button"
                    onClick={() => handleApprove(appointment.protocolCode, appointment.extensionistId)}
                  >
                    Aprovar
                  </button>
                ) : null}
              </li>
            ))}
            {myAppointments.length === 0 ? (
              <li>
                <strong>Nenhum atendimento vinculado</strong>
                <span className="muted">Crie um agendamento primeiro no fluxo do solicitante.</span>
              </li>
            ) : null}
          </ul>
        </article>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Novo bloco de agenda</h3>
        <form className="form-preview" onSubmit={handleCreateAvailability}>
          <div className="two-column-grid">
            <div className="field">
              <label>Inicio</label>
              <input
                type="datetime-local"
                value={availabilityForm.startDateTime}
                onChange={(event) =>
                  setAvailabilityForm((current) => ({ ...current, startDateTime: event.target.value }))
                }
              />
            </div>
            <div className="field">
              <label>Fim</label>
              <input
                type="datetime-local"
                value={availabilityForm.endDateTime}
                onChange={(event) =>
                  setAvailabilityForm((current) => ({ ...current, endDateTime: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="two-column-grid">
            <div className="field">
              <label>Capacidade</label>
              <input
                type="number"
                min="1"
                value={availabilityForm.capacity}
                onChange={(event) =>
                  setAvailabilityForm((current) => ({
                    ...current,
                    capacity: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="field">
              <label>Observacoes</label>
              <input
                value={availabilityForm.notes}
                onChange={(event) =>
                  setAvailabilityForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </div>
          </div>
          <button className="button-primary" type="submit" disabled={!currentUser}>
            Salvar bloco
          </button>
        </form>
      </div>
    </section>
  );
}
