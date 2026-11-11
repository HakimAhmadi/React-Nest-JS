import { migrationPlan, releaseDatabase, verifyDatabase } from './release';
import { DatabaseReleaseError } from './release-error';

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || '--apply';
  if (args.length > 1 || !['--apply', '--plan', '--check'].includes(mode)) {
    throw new DatabaseReleaseError('invalid_arguments');
  }

  const { AppDataSource, requireLocalDevelopmentDatabase } =
    await import('./data-source');

  if (mode === '--apply' && process.env.NODE_ENV !== 'production') {
    requireLocalDevelopmentDatabase();
  }

  await AppDataSource.initialize();
  try {
    const result =
      mode === '--plan'
        ? await migrationPlan(AppDataSource)
        : mode === '--check'
          ? await verifyDatabase(AppDataSource)
          : await releaseDatabase(AppDataSource);
    console.log(JSON.stringify(result, null, 2));
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
