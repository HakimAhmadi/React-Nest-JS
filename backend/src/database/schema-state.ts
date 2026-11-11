import { QueryRunner } from 'typeorm';

export const baseTables = [
  'users',
  'refresh_tokens',
  'system_settings',
  'audit_logs',
] as const;

export async function schemaState(runner: QueryRunner) {
  const objects: { name: string; kind: string }[] = await runner.query(
    'SELECT TABLE_NAME AS name, TABLE_TYPE AS kind FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()',
  );
  const tables = new Set(
    objects.filter((value) => value.kind === 'BASE TABLE').map((value) => value.name),
  );
  const invalidTracking = objects.some(
    (value) => value.name === 'migrations' && value.kind !== 'BASE TABLE',
  );

  const mode = invalidTracking
    ? 'unsupported'
    : baseTables.every((name) => tables.has(name))
      ? 'existing'
      : objects.every(
            (value) => value.name === 'migrations' && value.kind === 'BASE TABLE',
          ) || tables.size === 0
        ? 'empty'
        : 'unsupported';

  return { mode, tracking: tables.has('migrations') } as const;
}
