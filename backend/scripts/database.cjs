const { loadEnvFile } = require('node:process');
const path = require('node:path');
const mysql = require('mysql2/promise');

try {
  loadEnvFile(path.resolve(__dirname, '../.env'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const local = ['localhost', '127.0.0.1', '::1'].includes(
  process.env.DATABASE_HOST || '127.0.0.1',
);

exports.requireDevelopmentDatabase = () => {
  if (process.env.NODE_ENV === 'production' || !local) {
    throw new Error(
      'This development helper requires a local, non-production database.',
    );
  }
};

exports.connect = () =>
  mysql.createConnection({
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASS || '',
    database: process.env.DATABASE_NAME || 'app_db',
    connectTimeout: 5000,
  });
