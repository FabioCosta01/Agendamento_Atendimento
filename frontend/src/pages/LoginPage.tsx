import type { FormEvent } from 'react';

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

type LoginPageProps = {
  document: string;
  password: string;
  loginError: string;
  submitting?: boolean;
  onDocumentChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LoginPage({
  document,
  password,
  loginError,
  submitting = false,
  onDocumentChange,
  onPasswordChange,
  onSubmit,
}: LoginPageProps) {
  const maskedDocument = formatCpf(document);

  return (
    <div className="login-shell">
      <section className="login-hero">
        <p className="eyebrow">Portal institucional</p>
        <h1>Agendamento de Atendimento</h1>
        <p className="login-copy">
          Ambiente oficial para solicitacao, acompanhamento e administracao de atendimentos,
          protocolos e disponibilidade tecnica.
        </p>

        <div className="login-feature-list">
          <article className="login-feature-card">
            <strong>Atendimento centralizado</strong>
            <span>Controle de agenda, servicos, usuarios e protocolos em um unico sistema.</span>
          </article>
          <article className="login-feature-card">
            <strong>Perfis separados</strong>
            <span>Experiencias distintas para solicitante, extensionista e administrador.</span>
          </article>
          <article className="login-feature-card">
            <strong>Rastreabilidade</strong>
            <span>Protocolo e historico para acompanhar cada atendimento.</span>
          </article>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <p className="eyebrow">Acesso ao sistema</p>
          <h2>Identificacao do usuario</h2>
          <p className="muted">
            Informe seu documento e senha para acessar o portal oficial de agendamento.
          </p>

          <form className="form-preview" onSubmit={onSubmit}>
            <div className="field">
              <label>Documento</label>
              <input
                value={maskedDocument}
                inputMode="numeric"
                maxLength={14}
                placeholder="000.000.000-00"
                onChange={(event) => onDocumentChange(event.target.value.replace(/\D/g, '').slice(0, 11))}
              />
            </div>

            <div className="field">
              <label>Senha</label>
              <input
                type="password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
              />
            </div>

            <button className="button-primary login-button" type="submit" disabled={submitting}>
              {submitting ? 'Entrando...' : 'Acessar sistema'}
            </button>

            {loginError ? <p className="feedback-error">{loginError}</p> : null}
          </form>

          <div className="login-help">
            <strong>Acesso institucional</strong>
            <span>Utilize as credenciais cadastradas para seu perfil de acesso.</span>
            <span>Em caso de indisponibilidade, contate o administrador do sistema.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
