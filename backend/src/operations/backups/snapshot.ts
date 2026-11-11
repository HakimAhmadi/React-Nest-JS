import { createHash } from 'node:crypto';
import { DataSource, QueryRunner } from 'typeorm';
import { BackupError } from './files';

async function tableDescription(runner: QueryRunner, name: string) {
  const columns = await runner.query(
    'SELECT COLUMN_NAME,ORDINAL_POSITION,COLUMN_DEFAULT,IS_NULLABLE,DATA_TYPE,CHARACTER_MAXIMUM_LENGTH,NUMERIC_PRECISION,NUMERIC_SCALE,DATETIME_PRECISION,CHARACTER_SET_NAME,COLLATION_NAME,COLUMN_TYPE,EXTRA,COLUMN_COMMENT,GENERATION_EXPRESSION FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? ORDER BY ORDINAL_POSITION',
    [name],
  );
  const indexes = await runner.query(
    'SELECT INDEX_NAME,NON_UNIQUE,SEQ_IN_INDEX,COLUMN_NAME,COLLATION,SUB_PART,NULLABLE,INDEX_TYPE,INDEX_COMMENT,IS_VISIBLE,EXPRESSION FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? ORDER BY INDEX_NAME,SEQ_IN_INDEX',
    [name],
  );
  const foreign = await runner.query(
    'SELECT k.CONSTRAINT_NAME,k.COLUMN_NAME,k.ORDINAL_POSITION,k.REFERENCED_TABLE_SCHEMA,k.REFERENCED_TABLE_NAME,k.REFERENCED_COLUMN_NAME,r.MATCH_OPTION,r.UPDATE_RULE,r.DELETE_RULE FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME AND r.TABLE_NAME=k.TABLE_NAME WHERE k.TABLE_SCHEMA=DATABASE() AND k.TABLE_NAME=? ORDER BY k.CONSTRAINT_NAME,k.ORDINAL_POSITION',
    [name],
  );
  const [current] = await runner.query('SELECT DATABASE() name');
  for (const key of foreign) {
    if (key.REFERENCED_TABLE_SCHEMA !== current.name) {
      throw new BackupError('unsupported_database_objects');
    }
    key.REFERENCED_TABLE_SCHEMA = '$self';
  }
  const table = await runner.query(
    'SELECT ENGINE,ROW_FORMAT,AUTO_INCREMENT,TABLE_COLLATION,CREATE_OPTIONS,TABLE_COMMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?',
    [name],
  );
  const checks = await runner.query(
    'SELECT t.CONSTRAINT_NAME,t.ENFORCED,c.CHECK_CLAUSE FROM information_schema.TABLE_CONSTRAINTS t JOIN information_schema.CHECK_CONSTRAINTS c ON c.CONSTRAINT_SCHEMA=t.CONSTRAINT_SCHEMA AND c.CONSTRAINT_NAME=t.CONSTRAINT_NAME WHERE t.TABLE_SCHEMA=DATABASE() AND t.TABLE_NAME=? ORDER BY t.CONSTRAINT_NAME',
    [name],
  );
  return {
    primary: indexes
      .filter((index: any) => index.INDEX_NAME === 'PRIMARY')
      .map((index: any) => index.COLUMN_NAME as string),
    sha256: createHash('sha256')
      .update(JSON.stringify({ columns, indexes, foreign, table, checks }))
      .digest('hex'),
  };
}

export async function databaseSnapshot(source: DataSource) {
  const runner = source.createQueryRunner();
  try {
    await runner.connect();

    await runner.query("SET SESSION time_zone = '+00:00'");
    await runner.query('SET SESSION information_schema_stats_expiry = 0');
    const objects: { name: string; engine: string; kind: string }[] =
      await runner.query(
        'SELECT TABLE_NAME name, ENGINE engine, TABLE_TYPE kind FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME',
      );

    const expected = [
      ...source.entityMetadatas.map((entity) => entity.tableName),
      'migrations',
    ].sort();

    const actual = objects.map((value) => value.name).sort();
    for (const name of expected) {
      if (!actual.includes(name)) {
        throw new BackupError('unsupported_database_objects');
      }
    }

    const tables: {
      name: string;
      rows: number;
      sha256: string;
      schema: string;
    }[] = [];

    for (const name of expected) {
      if (!/^[a-z0-9_]+$/.test(name)) {
        throw new BackupError('unsupported_database_objects');
      }
      const [countResult] = await runner.query(
        `SELECT COUNT(*) as cnt FROM \`${name}\``,
      );
      const rows = Number(countResult.cnt || 0);

      const hash = createHash('sha256');
      if (rows > 0) {
        const data = await runner.query(`SELECT * FROM \`${name}\``);
        hash.update(JSON.stringify(data));
      }
      const schema = await tableDescription(runner, name);
      tables.push({
        name,
        rows,
        sha256: hash.digest('hex'),
        schema: schema.sha256,
      });
    }

    return tables;
  } finally {
    await runner.release();
  }
}
