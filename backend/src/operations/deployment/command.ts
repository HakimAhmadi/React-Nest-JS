import 'reflect-metadata';
import { loadEnvFile } from 'node:process';
import { resolve } from 'node:path';
import { deploymentConfiguration } from './configuration';

async function main() {
  try {
    loadEnvFile(resolve(__dirname, '../../../.env'));
  } catch (error: any) {
    if (error.code !== 'ENOENT') throw error;
  }

  const command = process.argv[2] || 'check';
  if (command === 'check') {
    const result = deploymentConfiguration(process.env);
    console.log(JSON.stringify(result, null, 2));
    if (!result.readyForHostValidation) {
      process.exitCode = 1;
    }
    return;
  }

  if (command === 'monitor') {
    const { AppDataSource } = await import('../../database/data-source');
    try {
      await AppDataSource.initialize();
      const [dbPing] = await AppDataSource.query('SELECT 1 as alive');
      console.log(
        JSON.stringify({
          status: dbPing?.alive === 1 ? 'healthy' : 'unhealthy',
          database: AppDataSource.options.database,
          timestamp: new Date().toISOString(),
        }),
      );
    } catch (err: any) {
      console.error(
        JSON.stringify({
          status: 'unhealthy',
          error: err.message,
          timestamp: new Date().toISOString(),
        }),
      );
      process.exitCode = 1;
    } finally {
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
      }
    }
    return;
  }

  throw new Error(`unknown_command: ${command}`);
}

main().catch((err) => {
  console.error(JSON.stringify({ status: 'failed', error: err.message }));
  process.exitCode = 1;
});
