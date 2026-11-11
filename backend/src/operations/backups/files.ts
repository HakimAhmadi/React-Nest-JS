import {
  constants,
  createReadStream,
  createWriteStream,
  promises as fs,
} from 'node:fs';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { Readable, Transform, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { basename, dirname, isAbsolute, join, resolve, sep } from 'node:path';
import { uploadRoot } from '../../utils/upload-storage';

export class BackupError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

const magicText = 'BOILERPLATE-BACKUP-1\0';
const magic = new TextEncoder().encode(magicText);

export const inside = (parent: string, target: string) =>
  target === parent || target.startsWith(parent + sep);

export async function newPrivatePath(value: string) {
  if (!value || !isAbsolute(value)) {
    throw new BackupError('absolute_path_required');
  }
  const normalized = resolve(value);
  const path = join(await fs.realpath(dirname(normalized)), basename(normalized));
  try {
    await fs.lstat(path);
  } catch (error: any) {
    if (error.code === 'ENOENT') return path;
    throw error;
  }
  throw new BackupError('destination_exists');
}

export async function regularFile(path: string) {
  const stat = await fs.lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new BackupError('unsafe_file');
  }
  return stat;
}

export async function privateLocation(path: string) {
  const target = resolve(path);
  const uploads = await fs.realpath(uploadRoot()).catch(() => resolve(uploadRoot()));
  const frontend = resolve(__dirname, '../../../..', 'frontend');
  if (inside(uploads, target) || inside(target, uploads) || inside(frontend, target)) {
    throw new BackupError('public_or_live_storage');
  }
}

export async function createKey(path: string) {
  const target = await newPrivatePath(path);
  await privateLocation(target);
  await fs.writeFile(target, randomBytes(32).toString('base64') + '\n', {
    flag: 'wx',
    mode: 0o600,
  });
}

export async function readKey(path: string) {
  if (!path || !isAbsolute(path)) throw new BackupError('key_required');
  if ((await regularFile(path)).size > 128) {
    throw new BackupError('invalid_key');
  }
  await privateLocation(await fs.realpath(path));
  const text = (await fs.readFile(path, 'utf8')).trim();
  if (!/^[A-Za-z0-9+/]{43}=$/.test(text)) throw new BackupError('invalid_key');
  const key = new Uint8Array(Buffer.from(text, 'base64'));
  if (key.length !== 32) throw new BackupError('invalid_key');
  return key;
}

export async function encrypt(
  input: Readable,
  target: string,
  key: Uint8Array,
  context: string,
) {
  const iv = new Uint8Array(randomBytes(12));
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const hash = createHash('sha256');
  cipher.setAAD(new TextEncoder().encode(context));
  let bytes = 0;
  const measure = new Transform({
    transform(chunk, encoding, done) {
      bytes += chunk.length;
      hash.update(chunk);
      done(null, chunk);
    },
  });

  const file = await fs.open(target, 'wx', 0o600);
  try {
    await file.writeFile(new Uint8Array([...magic, ...iv]));
    const output = new Writable({
      write(chunk, encoding, done) {
        file.writeFile(chunk).then(() => done(), done);
      },
    });
    await pipeline(input, measure, cipher, output);
    await file.writeFile(new Uint8Array(cipher.getAuthTag()));
    await file.sync();
  } finally {
    await file.close();
  }
  return { bytes, sha256: hash.digest('hex') };
}

export async function decrypt(
  path: string,
  key: Uint8Array,
  context: string,
  output: Writable,
  expected?: { bytes: number; sha256: string },
) {
  const stat = await regularFile(path);
  const headerLength = magic.length + 12;
  if (stat.size < headerLength + 16) throw new BackupError('archive_integrity');
  const file = await fs.open(path, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
  try {
    const header = new Uint8Array(headerLength);
    const tag = new Uint8Array(16);
    await file.read(header, 0, header.length, 0);
    await file.read(tag, 0, 16, stat.size - 16);
    if (new TextDecoder().decode(header.subarray(0, magic.length)) !== magicText) {
      throw new BackupError('archive_integrity');
    }
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      header.subarray(magic.length),
    );
    decipher.setAAD(new TextEncoder().encode(context));
    decipher.setAuthTag(tag);
    const hash = createHash('sha256');
    let bytes = 0;
    const measure = new Transform({
      transform(chunk, encoding, done) {
        bytes += chunk.length;
        hash.update(chunk);
        done(null, chunk);
      },
    });
    const input =
      stat.size === headerLength + 16
        ? Readable.from([])
        : createReadStream(path, {
            flags: 'r',
            start: headerLength,
            end: stat.size - 17,
          });
    try {
      await pipeline(input, decipher, measure, output);
    } catch {
      throw new BackupError('archive_integrity');
    }
    const sha256 = hash.digest('hex');
    if (expected && (expected.bytes !== bytes || expected.sha256 !== sha256)) {
      throw new BackupError('archive_integrity');
    }
    return { bytes, sha256 };
  } finally {
    await file.close();
  }
}

export const discard = () =>
  new Writable({
    write(chunk, encoding, done) {
      done();
    },
  });

export async function decryptFile(
  input: string,
  output: string,
  key: Uint8Array,
  context: string,
  expected: { bytes: number; sha256: string },
) {
  await decrypt(
    input,
    key,
    context,
    createWriteStream(output, { flags: 'wx', mode: 0o600 }),
    expected,
  );
}

export function uploadName(name: string) {
  const parts = name.split('/');
  if (
    parts.length < 2 ||
    parts.some(
      (part) =>
        !part ||
        part === '.' ||
        part === '..' ||
        // eslint-disable-next-line no-control-regex
        /[\\:\x00-\x1f<>"|?*]/.test(part) ||
        /[. ]$/.test(part) ||
        /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part),
    )
  ) {
    throw new BackupError('unsafe_upload_path');
  }
  return name;
}

export async function uploadFiles(root: string) {
  const files: {
    name: string;
    path: string;
    size: number;
    modified: number;
  }[] = [];
  async function visit(directory: string, prefix: string) {
    let stat;
    try {
      stat = await fs.lstat(directory);
    } catch (e: any) {
      if (e.code === 'ENOENT') return;
      throw e;
    }
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new BackupError('unsafe_upload_storage');
    }
    for (const entry of (await fs.readdir(directory, { withFileTypes: true })).sort(
      (a, b) => a.name.localeCompare(b.name),
    )) {
      if (entry.name.startsWith('.health-')) continue;
      const name = prefix ? prefix + '/' + entry.name : entry.name;
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        throw new BackupError('unsafe_upload_storage');
      }
      if (entry.isDirectory()) {
        await visit(path, name);
      } else {
        uploadName(name);
        const file = await regularFile(path);
        files.push({ name, path, size: file.size, modified: file.mtimeMs });
      }
    }
  }

  await visit(root, '');
  if (files.length > 100000) throw new BackupError('backup_limit');
  return files;
}

export async function fileHash(path: string) {
  const hash = createHash('sha256');
  let bytes = 0;
  for await (const chunk of createReadStream(path)) {
    hash.update(chunk);
    bytes += chunk.length;
  }
  return { bytes, sha256: hash.digest('hex') };
}
