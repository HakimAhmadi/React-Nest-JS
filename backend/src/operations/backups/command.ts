import { BackupError, createKey } from './files';
import { loadEnvFile } from 'node:process';
import { resolve } from 'node:path';
import { createBackup, rehearseBackup, restoreBackup, verifyBackup } from './backup';

async function main() {
  const [mode, ...args] = process.argv.slice(2);
  const allowed: Record<string, string[]> = {
    keygen: ['key-file'],
    create: ['output', 'key-file', 'quiesced'],
    verify: ['input', 'key-file'],
    restore: ['input', 'key-file', 'target', 'uploads'],
    'restore-check': ['input', 'key-file'],
  };
  if (!allowed[mode]) throw new BackupError('invalid_arguments');

  const flags: Record<string, string | boolean> = {};
  for (let index = 0; index < args.length; index++) {
    const flag = args[index].replace(/^--/, '');
    if (
      !args[index].startsWith('--') ||
      !allowed[mode].includes(flag) ||
      flag in flags
    ) {
      throw new BackupError('invalid_arguments');
    }
    if (flag === 'quiesced') {
      flags[flag] = true;
    } else {
      const value = args[++index];
      if (!value || value.startsWith('--')) {
        throw new BackupError('invalid_arguments');
      }
      flags[flag] = value;
    }
  }

  try {
    loadEnvFile(resolve(__dirname, '../../../.env'));
  } catch (error: any) {
    if (error.code !== 'ENOENT') throw error;
  }

  const keyFile = String(flags['key-file'] || process.env.BACKUP_KEY_FILE || '');
  let result: unknown;

  if (mode === 'keygen') {
    await createKey(keyFile);
    result = { status: 'key_created' };
  } else if (mode === 'verify') {
    result = await verifyBackup(String(flags.input || ''), keyFile);
  } else {
    const { AppDataSource } = await import('../../database/data-source');
    await AppDataSource.initialize();
    try {
      if (mode === 'create') {
        result = await createBackup(AppDataSource, {
          output: String(flags.output || ''),
          keyFile,
          quiesced: flags.quiesced === true,
        });
      } else if (mode === 'restore-check') {
        result = await rehearseBackup(
          AppDataSource,
          String(flags.input || ''),
          keyFile,
        );
      } else {
        result = await restoreBackup(AppDataSource, {
          input: String(flags.input || ''),
          keyFile,
          target: String(flags.target || ''),
          uploads: String(flags.uploads || ''),
        });
      }
    } finally {
      await AppDataSource.destroy();
    }
  }
  console.log(JSON.stringify(result));
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      status: 'failed',
      code:
        error instanceof BackupError ? error.code : error.message || 'backup_failed',
    }),
  );
  process.exitCode = 1;
});
