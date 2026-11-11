const { loadEnvFile } = require('node:process');
const { resolve } = require('node:path');

async function checkHealth({ url, timeoutMs = 5000 }) {
  let httpStatus = null;
  try {
    const target = new URL(url);
    const response = await fetch(target, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: 'application/json' },
    });
    httpStatus = response.status;
    const body = await response.json();
    return { ok: response.ok, status: body.status || 'unknown', httpStatus };
  } catch (err) {
    return { ok: false, status: 'unavailable', error: err.message, httpStatus };
  }
}

async function main() {
  try {
    loadEnvFile(resolve(__dirname, '../.env'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const port = process.env.PORT || 3003;
  const url = process.argv[2] || `http://127.0.0.1:${port}/api/health`;
  const result = await checkHealth({ url });

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}
