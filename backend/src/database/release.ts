import { createHash } from 'node:crypto';
import { DataSource, MigrationExecutor, QueryRunner } from 'typeorm';
import { DatabaseReleaseError } from './release-error';
import { schemaState } from './schema-state';

export async function migrationPlan(source: DataSource, supplied?: QueryRunner) {
  const runner = supplied || source.createQueryRunner();
  try {
    const state = await schemaState(runner);
    const required = source.migrations
      .map((migration) => {
        const name = migration.name || migration.constructor.name;
        const timestampMatch = name.match(/\d{13,14}/);
        const timestamp = timestampMatch ? Number(timestampMatch[0]) : 0;
        return { name, timestamp };
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    if (new Set(required.map((value) => value.name)).size !== required.length) {
      throw new DatabaseReleaseError('invalid_migration_definition');
    }

    const rows: { name: string; timestamp?: string | number }[] = state.tracking
      ? await runner.query('SELECT name, timestamp FROM migrations ORDER BY id')
      : [];

    const known = new Map(required.map((value) => [value.name, value.timestamp]));
    const seen = new Set<string>();
    let invalidHistory = 0;
    let unknownMigrations = 0;

    for (const row of rows) {
      if (!known.has(row.name)) unknownMigrations++;
      if (seen.has(row.name)) invalidHistory++;
      seen.add(row.name);
    }

    return {
      database: String(source.options.database),
      schema: state.mode,
      tracking: state.tracking,
      required: required.map((value) => value.name),
      applied: required
        .filter((value) => seen.has(value.name))
        .map((value) => value.name),
      pending: required
        .filter((value) => !seen.has(value.name))
        .map((value) => value.name),
      unknownMigrations,
      invalidHistory,
    };
  } finally {
    if (!supplied) await runner.release();
  }
}

function requireSupportedPlan(plan: Awaited<ReturnType<typeof migrationPlan>>) {
  if (plan.schema === 'unsupported') {
    throw new DatabaseReleaseError('unsupported_schema');
  }
  if (plan.schema === 'empty' && plan.applied.length > 0) {
    throw new DatabaseReleaseError('unsupported_schema');
  }
  if (plan.unknownMigrations > 0) {
    throw new DatabaseReleaseError('newer_or_unknown_migrations');
  }
  if (plan.invalidHistory > 0) {
    throw new DatabaseReleaseError('invalid_migration_history');
  }
}

export async function verifyDatabase(source: DataSource, supplied?: QueryRunner) {
  const plan = await migrationPlan(source, supplied);
  requireSupportedPlan(plan);
  if (plan.pending.length > 0) {
    throw new DatabaseReleaseError('pending_migrations');
  }
  const changes = await source.driver.createSchemaBuilder().log();
  if (changes.upQueries.length > 0) {
    throw new DatabaseReleaseError('schema_drift');
  }
  return { ...plan, status: 'ready' as const };
}

export function releaseLockName(database: string) {
  return (
    'boilerplate-release-' +
    createHash('sha256').update(database.toLowerCase()).digest('hex').slice(0, 40)
  );
}

export async function releaseDatabase(source: DataSource) {
  const runner = source.createQueryRunner();
  const lock = releaseLockName(String(source.options.database));
  let acquired = false;
  try {
    await runner.connect();
    const [result] = await runner.query('SELECT GET_LOCK(?, 0) AS acquired', [lock]);
    if (Number(result.acquired) !== 1) {
      throw new DatabaseReleaseError('release_in_progress');
    }
    acquired = true;
    const before = await migrationPlan(source, runner);
    requireSupportedPlan(before);
    const executor = new MigrationExecutor(source, runner);
    executor.transaction = 'each';
    const applied = await executor.executePendingMigrations();
    const verified = await verifyDatabase(source, runner);
    return {
      database: verified.database,
      status: verified.status,
      applied: applied.map((value) => value.name),
      required: verified.required.length,
    };
  } finally {
    try {
      if (acquired) await runner.query('SELECT RELEASE_LOCK(?)', [lock]);
    } finally {
      await runner.release();
    }
  }
}
