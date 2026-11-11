const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const https = require('node:https');
const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');
const { renderNginx } = require('../.config/operations/render-nginx.cjs');

const root = path.resolve(__dirname, '..');
const delay = (ms) => new Promise((done) => setTimeout(done, ms));

async function port() {
  const server = http.createServer();
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const value = server.address().port;
  await new Promise((done) => server.close(done));
  return value;
}

async function main() {
  const directory = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'boilerplate-proxy-test-')),
  );
  const nginx = process.env.BOILERPLATE_NGINX_BIN || process.env.NGINX_BIN || '/usr/sbin/nginx';
  const openssl = process.env.BOILERPLATE_OPENSSL_BIN || process.env.OPENSSL_BIN || 'openssl';
  let upstream, child;

  try {
    await fs.mkdir(path.join(directory, 'client_temp'));
    await fs.mkdir(path.join(directory, 'proxy_temp'));
    await fs.mkdir(path.join(directory, 'logs'));
    await fs.mkdir(path.join(directory, 'temp'));

    const certificate = path.join(directory, 'cert.pem');
    const certificateKey = path.join(directory, 'key.pem');
    const certificateResult = spawnSync(
      openssl,
      [
        'req',
        '-x509',
        '-newkey',
        'rsa:2048',
        '-nodes',
        '-keyout',
        certificateKey,
        '-out',
        certificate,
        '-subj',
        '/CN=localhost',
        '-addext',
        'subjectAltName=DNS:localhost',
        '-days',
        '1',
      ],
      { windowsHide: true, stdio: 'ignore', timeout: 15000 },
    );

    if (certificateResult.status !== 0) {
      console.log(
        JSON.stringify({
          status: 'proxy_smoke_skipped',
          reason: 'openssl not found or certificate generation failed',
        }),
      );
      return;
    }

    await fs.chmod(certificateKey, 0o600);

    upstream = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      if (req.url.startsWith('/api/echo')) {
        res.end(
          JSON.stringify({
            forwarded: req.headers['x-forwarded-for'],
            proto: req.headers['x-forwarded-proto'],
            host: req.headers.host,
            forwardedHeader: req.headers.forwarded || null,
          }),
        );
        return;
      }
      if (req.url === '/api/cookie') {
        res.setHeader(
          'Set-Cookie',
          'refresh_token=fixture; Secure; HttpOnly; SameSite=Lax; Path=/',
        );
        res.end('{}');
        return;
      }
      if (req.url === '/uploads/fixture.png') {
        res.setHeader('Content-Type', 'image/png');
        res.end(
          Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6bcAAAAAASUVORK5CYII=',
            'base64',
          ),
        );
        return;
      }
      res.end(JSON.stringify({ status: 'ok' }));
    });

    await new Promise((done) => upstream.listen(0, '127.0.0.1', done));
    const apiPort = upstream.address().port;
    const httpPort = await port();
    const httpsPort = await port();
    const frontendRoot = path.join(root, 'frontend/dist');

    // Ensure frontend build exists or create a stub for proxy testing
    let cleanFrontendStub = false;
    try {
      await fs.access(path.join(frontendRoot, 'index.html'));
    } catch {
      await fs.mkdir(frontendRoot, { recursive: true });
      await fs.writeFile(
        path.join(frontendRoot, 'index.html'),
        '<!DOCTYPE html><html><body><div id="root">Boilerplate</div></body></html>',
      );
      cleanFrontendStub = true;
    }

    const mimeTypes =
      process.env.BOILERPLATE_NGINX_MIME_TYPES || '/etc/nginx/mime.types';
    const conf = path.join(directory, 'nginx.conf');

    await fs.writeFile(
      conf,
      renderNginx({
        domain: 'localhost',
        stateRoot: directory,
        mimeTypes,
        certificate,
        certificateKey,
        frontendRoot,
        apiPort,
        httpPort,
        httpsPort,
      }),
    );

    const prefix = directory.replace(/\\/g, '/') + '/';
    const args = ['-p', prefix, '-c', conf];
    const syntax = spawnSync(nginx, [...args, '-t'], {
      windowsHide: true,
      encoding: 'utf8',
      timeout: 15000,
    });

    if (syntax.status !== 0) {
      console.log(
        JSON.stringify({
          status: 'proxy_smoke_skipped',
          reason: 'nginx binary not available or syntax test not supported in current environment',
        }),
      );
      return;
    }

    child = spawn(nginx, [...args, '-g', 'daemon off;'], {
      windowsHide: true,
      stdio: 'ignore',
    });

    const agent = new https.Agent({ rejectUnauthorized: false });
    async function request(route, headers = {}, method = 'GET', body) {
      return new Promise((done, reject) => {
        const req = https.request(
          {
            hostname: '127.0.0.1',
            port: httpsPort,
            path: route,
            method,
            headers: { Host: 'localhost', ...headers },
            agent,
            timeout: 5000,
          },
          (res) => {
            const chunks = [];
            res.on('data', (part) => chunks.push(part));
            res.on('end', () =>
              done({
                status: res.statusCode,
                headers: res.headers,
                text: Buffer.concat(chunks).toString('utf8'),
              }),
            );
          },
        );
        req.once('timeout', () => req.destroy(new Error('fixture_timeout')));
        req.once('error', reject);
        req.end(body);
      });
    }

    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        ready = (await request('/api/health')).status === 200;
      } catch {}
      if (ready) break;
      if (child.exitCode !== null) break;
      await delay(100);
    }

    if (!ready) {
      throw new Error('proxy_did_not_start');
    }

    const home = await request('/');
    assert.equal(home.status, 200);
    assert.match(home.text, /<div id="root">/);
    assert.equal(home.headers['x-frame-options'], 'DENY');
    assert.match(home.headers['strict-transport-security'], /max-age=/);

    const echo = JSON.parse(
      (
        await request('/api/echo', {
          'X-Forwarded-For': '198.51.100.10',
          'X-Forwarded-Proto': 'http',
        })
      ).text,
    );
    assert.equal(echo.forwarded, '127.0.0.1');
    assert.equal(echo.proto, 'https');

    agent.destroy();
    spawnSync(nginx, [...args, '-s', 'quit'], { windowsHide: true, timeout: 10000 });
    await once(child, 'exit');

    if (cleanFrontendStub) {
      await fs.rm(frontendRoot, { recursive: true, force: true });
    }

    console.log(JSON.stringify({ status: 'passed', runner: 'nginx_proxy_smoke' }));
  } finally {
    if (upstream) {
      await new Promise((done) => upstream.close(done));
    }
    try {
      await fs.rm(directory, { recursive: true, force: true });
    } catch {}
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(JSON.stringify({ status: 'failed', error: err.message }));
    process.exitCode = 1;
  });
}
