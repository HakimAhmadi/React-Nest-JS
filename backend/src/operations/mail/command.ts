import 'reflect-metadata';
import { loadEnvFile } from 'node:process';
import { resolve } from 'node:path';

try {
  loadEnvFile(resolve(__dirname, '../../../.env'));
} catch (error: any) {
  if (error.code !== 'ENOENT') throw error;
}

async function main() {
  const command = process.argv[2] || 'status';

  if (command === 'status') {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpFrom = process.env.SMTP_FROM || 'no-reply@example.com';
    const configured = Boolean(smtpHost && smtpUser);

    console.log(
      JSON.stringify(
        {
          status: 'ok',
          provider: configured ? 'smtp' : 'console_fallback',
          smtpHost: smtpHost || 'none (logging to console)',
          smtpPort: Number(smtpPort),
          smtpFrom,
          requiresAuth: Boolean(smtpUser),
        },
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'capture-demo') {
    const to = process.argv[3] || 'demo@example.com';
    const sampleEmail = {
      from: process.env.SMTP_FROM || 'no-reply@example.com',
      to,
      subject: '[Demo] Password Reset Request',
      text: `Hello,\n\nPlease reset your password using the following link:\n${process.env.APP_URL || 'http://localhost:5173'}/auth/reset-password?token=sample_token\n\nIf you did not request this, please ignore this email.`,
      capturedAt: new Date().toISOString(),
    };

    console.log(
      JSON.stringify(
        {
          status: 'captured',
          message: sampleEmail,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'retention-plan') {
    console.log(
      JSON.stringify(
        {
          status: 'retention_plan',
          retentionDays: 30,
          eligibleCount: 0,
          previewOnly: true,
          action: 'no records deleted',
        },
        null,
        2,
      ),
    );
    return;
  }

  throw new Error(`unknown_command: ${command}`);
}

main().catch((err) => {
  console.error(JSON.stringify({ status: 'failed', error: err.message }));
  process.exitCode = 1;
});
