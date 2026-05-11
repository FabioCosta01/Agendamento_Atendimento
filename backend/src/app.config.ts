type Env = Record<string, string | undefined>;

export function validateEnvironment(config: Env) {
  const nodeEnv = config.NODE_ENV ?? 'development';

  if (!config.DATABASE_URL) {
    throw new Error('DATABASE_URL nao configurada');
  }

  if (nodeEnv === 'production') {
    if (!config.JWT_SECRET || config.JWT_SECRET === 'trocar-por-um-segredo-seguro') {
      throw new Error('JWT_SECRET precisa ser definido com valor seguro em producao');
    }

    if (!config.FRONTEND_URL) {
      throw new Error('FRONTEND_URL precisa ser definido em producao');
    }
  }

  return {
    ...config,
    NODE_ENV: nodeEnv,
    PORT: config.PORT ?? '3001',
    FRONTEND_URL: config.FRONTEND_URL ?? 'http://localhost:5173',
  };
}
