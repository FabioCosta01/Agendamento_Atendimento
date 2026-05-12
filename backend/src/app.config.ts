type Env = Record<string, string | undefined>;

export function validateEnvironment(config: Env) {
  const nodeEnv = config.NODE_ENV ?? 'development';

  if (!config.DATABASE_URL) {
    throw new Error('DATABASE_URL nao configurada');
  }

  // JWT_SECRET validation - always required and must be secure
  const jwtSecret = config.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET e obrigatorio');
  }

  if (jwtSecret === 'trocar-por-um-segredo-seguro') {
    throw new Error('JWT_SECRET nao pode usar valor padrao inseguro');
  }

  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres');
  }

  const jwtExpiresIn = config.JWT_EXPIRES_IN ?? '8h';
  const jwtIssuer = config.JWT_ISSUER ?? 'agendamento-atendimento';
  const jwtAudience = config.JWT_AUDIENCE ?? 'agendamento-atendimento-client';

  // Additional security checks for production
  if (nodeEnv === 'production') {
    if (!config.FRONTEND_URL) {
      throw new Error('FRONTEND_URL precisa ser definido em producao');
    }

    if (!config.JWT_EXPIRES_IN) {
      throw new Error('JWT_EXPIRES_IN precisa ser definido em producao');
    }

    if (!config.JWT_ISSUER) {
      throw new Error('JWT_ISSUER precisa ser definido em producao');
    }

    if (!config.JWT_AUDIENCE) {
      throw new Error('JWT_AUDIENCE precisa ser definido em producao');
    }

    // Ensure JWT_SECRET contains a mix of character types for better security
    const hasUpperCase = /[A-Z]/.test(jwtSecret);
    const hasLowerCase = /[a-z]/.test(jwtSecret);
    const hasNumbers = /\d/.test(jwtSecret);
    const hasSpecialChars = /[^a-zA-Z0-9]/.test(jwtSecret);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChars) {
      throw new Error('JWT_SECRET deve conter letras maiusculas, minusculas, numeros e caracteres especiais');
    }
  }

  return {
    ...config,
    NODE_ENV: nodeEnv,
    PORT: config.PORT ?? '3001',
    FRONTEND_URL: config.FRONTEND_URL ?? 'http://localhost:5173',
    JWT_EXPIRES_IN: jwtExpiresIn,
    JWT_ISSUER: jwtIssuer,
    JWT_AUDIENCE: jwtAudience,
  };
}
