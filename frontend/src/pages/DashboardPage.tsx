import { AppointmentStatus } from 'shared';

import type { PageCommonProps } from './types';

export function DashboardPage({ currentUser, data, loading, error }: PageCommonProps) {
  const approvedCount = data.appointments.filter(
    (appointment) => appointment.status === AppointmentStatus.APROVADO,
  ).length;

  const summary = [
    {
      label: 'Agendamentos',
      value: String(data.appointments.length),
      detail: `${approvedCount} aprovados`,
    },
    {
      label: 'Extensionistas ativos',
      value: String(data.users.filter((user) => user.role === 'EXTENSIONISTA' && user.isActive).length),
      detail: `${data.availability.length} blocos de agenda`,
    },
    {
      label: 'Propriedades',
      value: String(data.properties.length),
      detail: `${data.properties.filter((property) => property.hasHabiteSe).length} com habite-se`,
    },
    {
      label: 'Servicos ativos',
      value: String(data.services.filter((service) => service.active).length),
      detail: 'catalogo atual do sistema',
    },
  ];

  return (
    <section>
      <header className="page-header">
        <p className="eyebrow">Visao inicial</p>
        <h2>Painel de controle do atendimento</h2>
        <p>
          Esta tela resume os blocos principais do sistema: solicitacoes, disponibilidade tecnica,
          administracao e emissao de protocolos.
        </p>
      </header>

      {loading ? <div className="card">Carregando dados do backend...</div> : null}
      {error ? <div className="card feedback-error">{error}</div> : null}
      {currentUser ? (
        <div className="card banner-card">
          <span className="pill">Sessao ativa</span>
          <h3>{currentUser.name}</h3>
          <p className="muted">Perfil atual: {currentUser.role}. O painel abaixo usa dados reais da API.</p>
        </div>
      ) : null}

      <div className="stats-grid">
        {summary.map((item) => (
          <article key={item.label} className="card">
            <span className="pill">{item.label}</span>
            <p className="metric">{item.value}</p>
            <p className="muted">{item.detail}</p>
          </article>
        ))}
      </div>

      <div className="feature-grid" style={{ marginTop: 24 }}>
        <article className="card">
          <h3>Fluxo do solicitante</h3>
          <p className="muted">
            Login, selecao do imovel, escolha do servico, preferencia de data e geracao de
            protocolo.
          </p>
        </article>
        <article className="card">
          <h3>Fluxo do extensionista</h3>
          <p className="muted">
            Cadastro de blocos de agenda, capacidade por horario e controle de reagendamento.
          </p>
        </article>
        <article className="card">
          <h3>Fluxo administrativo</h3>
          <p className="muted">
            Gestao de usuarios, servicos, parametros, trilha de auditoria e acompanhamento geral.
          </p>
        </article>
      </div>

      <div className="two-column-grid" style={{ marginTop: 24 }}>
        <article className="card">
          <h3>Ultimos protocolos</h3>
          <ul className="list">
            {data.appointments.slice(0, 4).map((appointment) => (
              <li key={appointment.id}>
                <strong>{appointment.protocolCode}</strong>
                <span className="muted">
                  {appointment.service?.name ?? 'Servico'} - {appointment.property?.displayName ?? 'Propriedade'} - {appointment.status}
                </span>
              </li>
            ))}
            {data.appointments.length === 0 ? (
              <li>
                <strong>Nenhum agendamento encontrado</strong>
                <span className="muted">Entre com um usuario e crie o primeiro protocolo.</span>
              </li>
            ) : null}
          </ul>
        </article>

        <article className="card">
          <h3>Base inicial carregada</h3>
          <ul className="list">
            <li>
              <strong>Usuarios</strong>
              <span className="muted">{data.users.map((user) => user.name).join(', ') || 'Nenhum usuario'}</span>
            </li>
            <li>
              <strong>Servicos</strong>
              <span className="muted">{data.services.map((service) => service.name).join(', ') || 'Nenhum servico'}</span>
            </li>
            <li>
              <strong>Disponibilidade</strong>
              <span className="muted">
                {data.availability[0]
                  ? new Date(data.availability[0].startDateTime).toLocaleString('pt-BR')
                  : 'Sem blocos cadastrados'}
              </span>
            </li>
          </ul>
        </article>
      </div>
    </section>
  );
}
