export function deploymentConfiguration(values: Record<string, unknown> = process.env) {
  const get = (key: string) => String(values[key] || '').trim();
  const checks: { id: string; ok: boolean; message?: string }[] = [];
  const check = (id: string, ok: boolean, message?: string) =>
    checks.push({ id, ok, message });

  const nodeEnv = get('NODE_ENV') || 'development';
  check('environment_defined', !!nodeEnv);

  const jwtSecret = get('JWT_SECRET');
  const validJwt =
    jwtSecret.length >= 32 &&
    jwtSecret !== 'replace_me_with_a_long_random_secret_at_least_32_chars';
  check(
    'jwt_secret_secure',
    validJwt,
    'JWT_SECRET must be at least 32 characters and not the placeholder',
  );

  const dbHost = get('DATABASE_HOST') || '127.0.0.1';
  const dbName = get('DATABASE_NAME') || 'app_db';
  const dbUser = get('DATABASE_USER') || 'root';
  check(
    'database_configured',
    !!dbHost && !!dbName && !!dbUser,
    'Database host, name, and user must be set',
  );
  check(
    'database_name_valid',
    /^[a-zA-Z0-9_-]+$/.test(dbName),
    'Database name must be alphanumeric/underscores/hyphens',
  );

  const allowedOrigins = get('ALLOWED_ORIGINS');
  check(
    'cors_allowed_origins_set',
    allowedOrigins.length > 0 && !allowedOrigins.includes('*'),
    'ALLOWED_ORIGINS must be explicit, not wildcard',
  );

  const allPassed = checks.every((c) => c.ok);
  return {
    readyForHostValidation: allPassed,
    checks,
  };
}
