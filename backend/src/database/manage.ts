import { createConnection } from 'mysql2/promise';
import { releaseDatabase, verifyDatabase } from './release';
import { DatabaseReleaseError } from './release-error';

async function main() {
  const command = process.argv[2];
  if (process.argv.slice(2).length !== 1 || !['check', 'init'].includes(command)) {
    throw new DatabaseReleaseError('invalid_arguments');
  }

  const { AppDataSource, appDatabaseOptions, requireLocalDevelopmentDatabase } =
    await import('./data-source');

  if (command === 'init') {
    requireLocalDevelopmentDatabase();
    const options = appDatabaseOptions;
    const connection = await createConnection({
      host: options.host,
      port: options.port,
      user: options.username,
      password: options.password,
      connectTimeout: 5000,
    });
    try {
      await connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${options.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      );
    } finally {
      await connection.end();
    }
  }

  await AppDataSource.initialize();
  try {
    if (command === 'init') {
      await releaseDatabase(AppDataSource);
    } else {
      await verifyDatabase(AppDataSource);
    }

    const counts: Record<string, number> = {};
    for (const entity of AppDataSource.entityMetadatas) {
      counts[entity.tableName] = await AppDataSource.getRepository(
        entity.target,
      ).count();
    }

    console.log(
      JSON.stringify(
        { database: AppDataSource.options.database, schema: 'ready', counts },
        null,
        2,
      ),
    );
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      status: 'failed',
      code:
        error instanceof DatabaseReleaseError
          ? error.code
          : error.message || 'database_unavailable',
    }),
  );
  process.exitCode = 1;
});
