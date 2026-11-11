import 'reflect-metadata';
import { loadEnvFile } from 'node:process';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';
import { databaseOptions } from './options';
import { operatorLogger } from './operator-logger';

export function loadBackendEnvironment() {
  try {
    loadEnvFile(resolve(__dirname, '../../.env'));
  } catch (error: any) {
    if (error.code !== 'ENOENT') throw error;
  }
}

loadBackendEnvironment();

export const appDatabaseOptions = databaseOptions();
export const dataSourceOptions = appDatabaseOptions;

export const AppDataSource = new DataSource({
  ...appDatabaseOptions,
  logger: operatorLogger,
});

export function requireLocalDevelopmentDatabase() {
  const host = appDatabaseOptions.host || '';
  if (
    process.env.NODE_ENV === 'production' ||
    !['localhost', '127.0.0.1', '::1'].includes(host)
  ) {
    throw new Error(
      'Development setup/seed commands require a local, non-production database.',
    );
  }
}

export default AppDataSource;
