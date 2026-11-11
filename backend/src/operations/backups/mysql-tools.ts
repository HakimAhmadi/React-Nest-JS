import { spawn } from 'node:child_process';
import { createReadStream, promises as fs } from 'node:fs';
import { join } from 'node:path';
import { Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { DataSource } from 'typeorm';
import { BackupError, encrypt } from './files';

const quoted = (value: string) =>
  '"' +
  value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t') +
  '"';

export async function clientFile(source: DataSource, directory: string) {
  const options = source.options as any;
  const file = join(directory, 'mysql.cnf');
  const tls = options.ssl
    ? options.ssl.rejectUnauthorized === false
      ? 'REQUIRED'
      : 'VERIFY_IDENTITY'
    : 'DISABLED';
  if (tls === 'VERIFY_IDENTITY' && !process.env.BACKUP_MYSQL_CA_FILE) {
    throw new BackupError('mysql_ca_required');
  }
  const lines = [
    '[client]',
    'protocol=TCP',
    'host=' + quoted(String(options.host)),
    'port=' + Number(options.port || 3306),
    'user=' + quoted(String(options.username)),
    'password=' + quoted(String(options.password || '')),
    'ssl-mode=' + tls,
  ];
  if (process.env.BACKUP_MYSQL_CA_FILE) {
    lines.push('ssl-ca=' + quoted(process.env.BACKUP_MYSQL_CA_FILE));
  }
  await fs.writeFile(file, lines.join('\n') + '\n', {
    flag: 'wx',
    mode: 0o600,
  });
  return file;
}

export function mysqlProcess(
  executable: string,
  options: string[],
  directory: string,
  timeoutMs = 300000,
) {
  const env: NodeJS.ProcessEnv = {
    MYSQL_TEST_LOGIN_FILE: join(directory, 'no-login-file'),
  };
  for (const [name, value] of Object.entries(process.env)) {
    if (
      /^(path|pathext|systemroot|windir|temp|tmp|tmpdir|home|userprofile|localappdata|appdata|lang|lc_all|tz|systemdrive|comspec)$/i.test(
        name,
      )
    ) {
      env[name] = value;
    }
  }
  const child = spawn(executable, options, {
    shell: false,
    windowsHide: true,
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  child.stderr.resume();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    child.kill();
  }, timeoutMs);
  const done = new Promise<void>((accept, reject) => {
    child.once('error', () => reject(new BackupError('mysql_tool_unavailable')));
    child.once('close', (code) =>
      code === 0 && !timedOut
        ? accept()
        : reject(
            new BackupError(timedOut ? 'mysql_tool_timeout' : 'mysql_tool_failed'),
          ),
    );
  }).finally(() => clearTimeout(timer));
  void done.catch(() => {});
  return { child, done };
}

export async function dumpDatabase(
  source: DataSource,
  directory: string,
  target: string,
  key: Uint8Array,
  context: string,
) {
  const config = await clientFile(source, directory);
  const { child, done } = mysqlProcess(
    process.env.BACKUP_MYSQLDUMP || 'mysqldump',
    [
      '--defaults-file=' + config,
      '--single-transaction',
      '--quick',
      '--skip-lock-tables',
      '--set-gtid-purged=OFF',
      '--no-tablespaces',
      '--hex-blob',
      '--default-character-set=utf8mb4',
      '--skip-comments',
      '--no-create-db',
      '--skip-add-drop-table',
      '--skip-add-locks',
      '--skip-disable-keys',
      '--column-statistics=0',
      String(source.options.database),
    ],
    directory,
  );
  child.stdin.end();
  try {
    const [result] = await Promise.all([
      encrypt(child.stdout, target, key, context),
      done,
    ]);
    return result;
  } catch (error) {
    child.kill();
    await done.catch(() => {});
    throw error;
  }
}

export async function importDatabase(
  source: DataSource,
  directory: string,
  sql: string,
  database: string,
) {
  const config = await clientFile(source, directory);
  const { child, done } = mysqlProcess(
    process.env.BACKUP_MYSQL || 'mysql',
    [
      '--defaults-file=' + config,
      '--binary-mode=1',
      '--local-infile=0',
      '--default-character-set=utf8mb4',
      '--database=' + database,
    ],
    directory,
  );
  child.stdout.pipe(
    new Writable({
      write(chunk, encoding, next) {
        next();
      },
    }),
  );
  try {
    await Promise.all([pipeline(createReadStream(sql), child.stdin), done]);
  } catch (error) {
    child.kill();
    await done.catch(() => {});
    throw error;
  }
}
