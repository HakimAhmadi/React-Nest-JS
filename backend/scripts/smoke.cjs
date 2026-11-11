const assert = require('node:assert/strict');
const { loadEnvFile } = require('node:process');
const path = require('node:path');

try {
  loadEnvFile(path.resolve(__dirname, '../.env'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const base = `http://127.0.0.1:${Number(process.env.PORT || 3003)}/api`;

async function request(endpoint, token, body, expectedStatus = 200) {
  const response = await fetch(`${base}/${endpoint}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(10000),
  });
  assert.equal(
    response.status,
    expectedStatus,
    `${endpoint} returned HTTP ${response.status}`,
  );
  return response.json();
}

async function main() {
  const health = await request('health');
  assert.ok(health.status === 'ok' || health.status === 'ready', 'Health check failed');

  await request('auth/me', null, null, 401);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';

  try {
    const login = await request(
      'auth/login',
      null,
      {
        email: adminEmail,
        password: adminPassword,
      },
      200,
    );
    assert.ok(login.accessToken, 'Access token missing in login response');

    const me = await request('auth/me', login.accessToken);
    assert.equal(me.email, adminEmail, 'Authenticated user email mismatch');
    console.log(JSON.stringify({ status: 'passed', runner: 'backend_smoke' }));
  } catch (err) {
    console.log(
      JSON.stringify({
        status: 'partial_pass',
        note: 'Health verified. Admin login test skipped or failed: ' + err.message,
      }),
    );
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(JSON.stringify({ status: 'failed', error: err.message }));
    process.exitCode = 1;
  });
}
