import { createReadStream, promises as fs } from 'node:fs';
import { randomUUID, randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, sep } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { DataSource } from 'typeorm';
import { releaseLockName, verifyDatabase } from '../../database/release';
import { operatorLogger } from '../../database/operator-logger';
import { uploadFolders, uploadRoot } from '../../utils/upload-storage';
import { databaseSnapshot } from './snapshot';
import { dumpDatabase, importDatabase } from './mysql-tools';
import {
  BackupError,
  decrypt,
  decryptFile,
  discard,
  encrypt,
  inside,
  newPrivatePath,
  privateLocation,
  readKey,
  regularFile,
  uploadFiles,
} from './files';

type Digest = { bytes: number; sha256: string };
type Manifest = {
  format: 1;
  id: string;
  createdAt: string;
  sourceDatabase: string;
  tables: Awaited<ReturnType<typeof databaseSnapshot>>;
  database: Digest;
  uploads: ({ name: string } & Digest)[];
};

const cipherFile = (root: string, index: number) =>
  join(root, 'files', String(index).padStart(6, '0') + '.enc');
const same = (one: unknown, two: unknown) =>
  JSON.stringify(one) === JSON.stringify(two);

async function workDirectory() {
  const directory = await fs.mkdtemp(join(tmpdir(), 'boilerplate-backup-'));
  await fs.chmod(directory, 0o700);
  return directory;
}

async function removeWork(directory: string) {
  const root = await fs.realpath(tmpdir());
  const target = await fs.realpath(directory);
  if (
    !target.startsWith(root + sep) ||
    !basename(target).startsWith('boilerplate-backup-')
  ) {
    throw new BackupError('unsafe_cleanup');
  }
  await fs.rm(target, { recursive: true });
}

export async function createBackup(
  source: DataSource,
  options: {
    output: string;
    keyFile: string;
    quiesced: boolean;
    uploads?: string;
  },
) {
  if (options.quiesced !== true) throw new BackupError('quiescence_required');
  const output = await newPrivatePath(options.output);
  await privateLocation(output);
  const key = await readKey(options.keyFile);
  if (inside(output, await fs.realpath(options.keyFile))) {
    throw new BackupError('separate_key_required');
  }
  const uploads = await fs.realpath(options.uploads || uploadRoot());
  if (inside(uploads, output) || inside(output, uploads)) {
    throw new BackupError('public_or_live_storage');
  }

  const runner = source.createQueryRunner();
  const lock = releaseLockName(String(source.options.database));
  let acquired = false;
  let work: string | undefined;

  try {
    await runner.connect();
    const [result] = await runner.query('SELECT GET_LOCK(?,0) AS acquired', [lock]);
    if (Number(result.acquired) !== 1) {
      throw new BackupError('release_or_backup_in_progress');
    }
    acquired = true;

    await verifyDatabase(source);
    const before = await databaseSnapshot(source);
    const files = await uploadFiles(uploads);

    work = await workDirectory();
    await fs.mkdir(output, { mode: 0o700 });
    await fs.mkdir(join(output, 'files'), { mode: 0o700 });

    const id = randomUUID();
    const database = await dumpDatabase(
      source,
      work,
      join(output, 'database.enc'),
      key,
      id + ':database',
    );

    const captured: Manifest['uploads'] = [];
    for (const [index, file] of files.entries()) {
      const digest = await encrypt(
        createReadStream(file.path),
        cipherFile(output, index),
        key,
        id + ':' + file.name,
      );
      const after = await regularFile(file.path);
      if (after.size !== file.size || after.mtimeMs !== file.modified) {
        throw new BackupError('source_changed');
      }
      captured.push({ name: file.name, ...digest });
    }

    if (
      !same(before, await databaseSnapshot(source)) ||
      !same(files, await uploadFiles(uploads))
    ) {
      throw new BackupError('source_changed');
    }

    const manifest: Manifest = {
      format: 1,
      id,
      createdAt: new Date().toISOString(),
      sourceDatabase: String(source.options.database),
      tables: before,
      database,
      uploads: captured,
    };

    const manifestText = JSON.stringify(manifest);
    if (Buffer.byteLength(manifestText) > 16 * 1024 * 1024 - 128) {
      throw new BackupError('backup_limit');
    }

    await encrypt(
      Readable.from([manifestText]),
      join(output, 'manifest.enc'),
      key,
      'boilerplate:manifest:1',
    );

    return {
      status: 'created',
      id,
      tables: before.length,
      uploadFiles: captured.length,
    };
  } finally {
    key.fill(0);
    try {
      if (work) await removeWork(work);
    } finally {
      try {
        if (acquired) await runner.query('SELECT RELEASE_LOCK(?)', [lock]);
      } finally {
        await runner.release();
      }
    }
  }
}

function validDigest(value: any) {
  return (
    value &&
    Number.isSafeInteger(value.bytes) &&
    value.bytes >= 0 &&
    /^[a-f0-9]{64}$/.test(value.sha256)
  );
}

async function openBackup(input: string, keyFile: string) {
  if (!input || !isAbsolute(input)) {
    throw new BackupError('absolute_path_required');
  }
  const root = await fs.realpath(input);
  const stat = await fs.lstat(input);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new BackupError('unsafe_file');
  }
  const key = await readKey(keyFile);
  try {
    const manifestFile = join(root, 'manifest.enc');
    if ((await regularFile(manifestFile)).size > 16 * 1024 * 1024) {
      throw new BackupError('backup_limit');
    }
    const chunks: Uint8Array[] = [];
    await decrypt(
      manifestFile,
      key,
      'boilerplate:manifest:1',
      new Writable({
        write(chunk, encoding, next) {
          chunks.push(chunk);
          next();
        },
      }),
    );
    const manifest = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Manifest;
    if (
      manifest.format !== 1 ||
      !/^[a-f0-9-]{36}$/.test(manifest.id) ||
      !/^[a-zA-Z0-9_]+$/.test(manifest.sourceDatabase) ||
      !validDigest(manifest.database) ||
      !Array.isArray(manifest.uploads) ||
      manifest.uploads.length > 100000 ||
      !Array.isArray(manifest.tables) ||
      manifest.tables.length > 1000 ||
      !Number.isFinite(Date.parse(manifest.createdAt))
    ) {
      throw new BackupError('invalid_manifest');
    }
    return { root, key, manifest };
  } catch (error) {
    key.fill(0);
    throw error;
  }
}

export async function verifyBackup(input: string, keyFile: string) {
  const { root, key, manifest } = await openBackup(input, keyFile);
  try {
    await decrypt(
      join(root, 'database.enc'),
      key,
      manifest.id + ':database',
      discard(),
      manifest.database,
    );
    for (const [index, file] of manifest.uploads.entries()) {
      await decrypt(
        cipherFile(root, index),
        key,
        manifest.id + ':' + file.name,
        discard(),
        file,
      );
    }
    return {
      status: 'verified',
      id: manifest.id,
      tables: manifest.tables.length,
      uploadFiles: manifest.uploads.length,
    };
  } finally {
    key.fill(0);
  }
}

function localRestore(source: DataSource, target: string) {
  if (
    process.env.NODE_ENV === 'production' ||
    !['localhost', '127.0.0.1', '::1'].includes((source.options as any).host) ||
    !/^boilerplate_restore_[a-f0-9]{16}$/.test(target) ||
    target.toLowerCase() === String(source.options.database).toLowerCase()
  ) {
    throw new BackupError('isolated_local_target_required');
  }
}

export async function restoreBackup(
  source: DataSource,
  options: {
    input: string;
    keyFile: string;
    target: string;
    uploads: string;
    cleanup?: boolean;
  },
) {
  localRestore(source, options.target);
  const target = options.target;
  const output = await newPrivatePath(options.uploads);
  await privateLocation(output);
  const { root, key, manifest } = await openBackup(options.input, options.keyFile);
  if (
    target.toLowerCase() === manifest.sourceDatabase.toLowerCase() ||
    inside(root, output) ||
    inside(output, root) ||
    inside(output, await fs.realpath(options.keyFile))
  ) {
    key.fill(0);
    throw new BackupError('isolated_local_target_required');
  }

  let work: string | undefined;
  let created = false;
  let directoryCreated = false;
  let restored: DataSource | undefined;
  const runner = source.createQueryRunner();

  try {
    work = await workDirectory();
    const sql = join(work, 'database.sql');
    await decryptFile(
      join(root, 'database.enc'),
      sql,
      key,
      manifest.id + ':database',
      manifest.database,
    );
    await fs.mkdir(join(work, 'files'), { mode: 0o700 });
    for (const [index, file] of manifest.uploads.entries()) {
      await decryptFile(
        cipherFile(root, index),
        join(work, 'files', String(index)),
        key,
        manifest.id + ':' + file.name,
        file,
      );
    }
    await runner.connect();
    const [exists] = await runner.query(
      'SELECT COUNT(*) total FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?',
      [target],
    );
    if (Number(exists.total)) throw new BackupError('destination_exists');
    await runner.query(
      'CREATE DATABASE `' +
        target +
        '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    );
    created = true;
    await fs.mkdir(output, { mode: 0o700 });
    directoryCreated = true;
    await importDatabase(source, work, sql, target);
    restored = new DataSource({
      ...source.options,
      database: target,
      synchronize: false,
      logger: operatorLogger,
    } as any);
    await restored.initialize();
    await verifyDatabase(restored);

    for (const folder of uploadFolders) {
      await fs.mkdir(join(output, folder), { recursive: true, mode: 0o700 });
    }
    for (const [index, file] of manifest.uploads.entries()) {
      const destination = join(output, ...file.name.split('/'));
      await fs.mkdir(dirname(destination), { recursive: true, mode: 0o700 });
      await fs.copyFile(join(work, 'files', String(index)), destination, 1);
    }

    return {
      status: options.cleanup ? 'restore_checked' : 'restored',
      id: manifest.id,
      target,
      tables: manifest.tables.length,
      uploadFiles: manifest.uploads.length,
    };
  } finally {
    key.fill(0);
    if (restored?.isInitialized) await restored.destroy();
    try {
      if (options.cleanup && created) {
        localRestore(source, target);
        await runner.query('DROP DATABASE `' + target + '`');
      }
      if (options.cleanup && directoryCreated) {
        const actual = await fs.realpath(output);
        if (actual === output && /^boilerplate_restore_[a-f0-9]{16}$/.test(target)) {
          await fs.rm(actual, { recursive: true });
        }
      }
    } finally {
      try {
        await runner.release();
      } finally {
        if (work) await removeWork(work);
      }
    }
  }
}

export async function rehearseBackup(
  source: DataSource,
  input: string,
  keyFile: string,
) {
  const target = 'boilerplate_restore_' + randomBytes(8).toString('hex');
  const directory = await workDirectory();
  try {
    return await restoreBackup(source, {
      input,
      keyFile,
      target,
      uploads: join(directory, 'restored-uploads'),
      cleanup: true,
    });
  } finally {
    await removeWork(directory);
  }
}
