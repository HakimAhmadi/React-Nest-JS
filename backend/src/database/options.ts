import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';

export function databaseOptions(
  read: (key: string) => string | undefined = (key) => process.env[key],
): MysqlConnectionOptions {
  const host = read('DATABASE_HOST') || read('DB_HOST') || '127.0.0.1';
  const local = ['localhost', '127.0.0.1', '::1'].includes(host);
  const ssl = read('DATABASE_SSL');
  const useTls = ssl ? ssl === 'true' : !local;
  const rawDatabase =
    read('DATABASE_NAME') || read('DB_DATABASE') || read('DB_NAME') || 'app_db';
  const database = rawDatabase.trim().replace(/^["']|["']$/g, '');

  if (!database) {
    throw new Error(
      'DATABASE_NAME environment variable is missing or empty. Please set DATABASE_NAME in your deployment environment.',
    );
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(database)) {
    throw new Error(
      'DATABASE_NAME must contain only letters, numbers, hyphens, or underscores.',
    );
  }

  return {
    type: 'mysql',
    host,
    port: Number(read('DATABASE_PORT') || read('DB_PORT') || 3306),
    username: (
      read('DATABASE_USER') ||
      read('DB_USERNAME') ||
      read('DB_USER') ||
      'root'
    ).replace(/^["']|["']$/g, ''),
    password: (
      read('DATABASE_PASS') ||
      read('DB_PASSWORD') ||
      read('DB_PASS') ||
      ''
    ).replace(/^["']|["']$/g, ''),
    database,
    entities: [__dirname + '/entities/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    migrationsTableName: 'migrations',
    synchronize: false,
    timezone: 'Z',
    charset: 'utf8mb4',
    extra: {
      connectionLimit: 10,
    },
    ...(useTls
      ? {
          ssl: {
            rejectUnauthorized: read('DATABASE_SSL_REJECT_UNAUTHORIZED') !== 'false',
          },
        }
      : {}),
  };
}
