import { UserRole } from 'shared';
import { useState } from 'react';

import type { PageCommonProps } from './types';

type AdminPageProps = PageCommonProps & {
  onCreateUser: (payload: {
    name: string;
    email: string;
    document: string;
    password: string;
    phone?: string;
    role: UserRole;
  }) => Promise<unknown>;
  onCreateService: (payload: {
    name: string;
    description?: string;
    durationMinutes: number;
    active: boolean;
  }) => Promise<unknown>;
};

export function AdminPage({
  currentUser,
  data,
  loading,
  error,
  onCreateUser,
  onCreateService,
}: AdminPageProps) {
  const [feedback, setFeedback] = useState('');
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    document: '',
    password: '123456',
    phone: '',
    role: UserRole.SOLICITANTE,
  });
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    durationMinutes: 60,
    active: true,
  });

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await onCreateUser(userForm);
      setFeedback('Usuario cadastrado com sucesso.');
      setUserForm({
        name: '',
        email: '',
        document: '',
        password: '123456',
        phone: '',
        role: UserRole.SOLICITANTE,
      });
    } catch (userError) {
      setFeedback('Nao foi possivel cadastrar o usuario.');
      if (import.meta.env.DEV) { console.error(userError); }
    }
  }

  async function handleCreateService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await onCreateService(serviceForm);
      setFeedback('Servico cadastrado com sucesso.');
      setServiceForm({
        name: '',
        description: '',
        durationMinutes: 60,
        active: true,
      });
    } catch (serviceError) {
      setFeedback('Nao foi possivel cadastrar o servico.');
      if (import.meta.env.DEV) { console.error(serviceError); }
    }
  }

  return (
    <section>
      <header className="page-header">
        <p className="eyebrow">Modulo administrador</p>
        <h2>Configuracao e governanca</h2>
        <p>
          O modulo administrativo concentra servicos, usuarios, parametros de agenda e trilhas de
          auditoria.
        </p>
      </header>

      {!currentUser ? <div className="card">Entre com o administrador para revisar a base do sistema.</div> : null}
      {currentUser && currentUser.role !== UserRole.ADMINISTRADOR ? (
        <div className="card">Este modulo e mais indicado para o perfil `ADMINISTRADOR`.</div>
      ) : null}
      {loading ? <div className="card">Carregando dados administrativos...</div> : null}
      {error ? <div className="card feedback-error">{error}</div> : null}
      {feedback ? <div className={feedback.includes('sucesso') ? 'card feedback-success' : 'card feedback-error'}>{feedback}</div> : null}

      <div className="card-grid">
        <article className="card">
          <h3>Usuarios</h3>
          <ul className="list">
            {data.users.map((user) => (
              <li key={user.id}>
                <strong>{user.name}</strong>
                <span className="muted">
                  {user.role} - {user.document} - {user.isActive ? 'ativo' : 'inativo'}
                </span>
              </li>
            ))}
          </ul>
        </article>
        <article className="card">
          <h3>Servicos</h3>
          <ul className="list">
            {data.services.map((service) => (
              <li key={service.id}>
                <strong>{service.name}</strong>
                <span className="muted">
                  {service.durationMinutes} min - {service.active ? 'ativo' : 'inativo'}
                </span>
              </li>
            ))}
          </ul>
        </article>
        <article className="card">
          <h3>Resumo operacional</h3>
          <ul className="list">
            <li>
              <strong>Agendamentos</strong>
              <span className="muted">{data.appointments.length} registros encontrados</span>
            </li>
            <li>
              <strong>Disponibilidade</strong>
              <span className="muted">{data.availability.length} blocos tecnicos cadastrados</span>
            </li>
            <li>
              <strong>Propriedades</strong>
              <span className="muted">{data.properties.length} unidades cadastradas</span>
            </li>
          </ul>
        </article>
      </div>

      <div className="two-column-grid" style={{ marginTop: 24 }}>
        <article className="card">
          <h3>Cadastrar usuario</h3>
          <form className="form-preview" onSubmit={handleCreateUser}>
            <div className="field">
              <label>Nome</label>
              <input value={userForm.name} onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="field">
              <label>E-mail</label>
              <input value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} />
            </div>
            <div className="field">
              <label>Documento</label>
              <input value={userForm.document} onChange={(event) => setUserForm((current) => ({ ...current, document: event.target.value }))} />
            </div>
            <div className="field">
              <label>Telefone</label>
              <input value={userForm.phone} onChange={(event) => setUserForm((current) => ({ ...current, phone: event.target.value }))} />
            </div>
            <div className="field">
              <label>Senha inicial</label>
              <input value={userForm.password} onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))} />
            </div>
            <div className="field">
              <label>Perfil</label>
              <select
                value={userForm.role}
                onChange={(event) =>
                  setUserForm((current) => ({ ...current, role: event.target.value as UserRole }))
                }
              >
                <option value={UserRole.SOLICITANTE}>SOLICITANTE</option>
                <option value={UserRole.EXTENSIONISTA}>EXTENSIONISTA</option>
                <option value={UserRole.ADMINISTRADOR}>ADMINISTRADOR</option>
              </select>
            </div>
            <button className="button-primary" type="submit" disabled={currentUser?.role !== UserRole.ADMINISTRADOR}>
              Salvar usuario
            </button>
          </form>
        </article>

        <article className="card">
          <h3>Cadastrar servico</h3>
          <form className="form-preview" onSubmit={handleCreateService}>
            <div className="field">
              <label>Nome</label>
              <input value={serviceForm.name} onChange={(event) => setServiceForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="field">
              <label>Descricao</label>
              <textarea rows={4} value={serviceForm.description} onChange={(event) => setServiceForm((current) => ({ ...current, description: event.target.value }))} />
            </div>
            <div className="field">
              <label>Duracao em minutos</label>
              <input
                type="number"
                min="15"
                step="15"
                value={serviceForm.durationMinutes}
                onChange={(event) =>
                  setServiceForm((current) => ({
                    ...current,
                    durationMinutes: Number(event.target.value),
                  }))
                }
              />
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={serviceForm.active}
                onChange={(event) =>
                  setServiceForm((current) => ({ ...current, active: event.target.checked }))
                }
              />
              Servico ativo
            </label>
            <button className="button-primary" type="submit" disabled={currentUser?.role !== UserRole.ADMINISTRADOR}>
              Salvar servico
            </button>
          </form>
        </article>
      </div>
    </section>
  );
}
