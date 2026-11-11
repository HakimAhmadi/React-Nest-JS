const fs = require('node:fs');
const path = require('node:path');

function renderNginx(values) {
  const domain = String(values.domain || '');
  if (
    !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(
      domain,
    )
  ) {
    throw new Error('invalid_domain');
  }

  const tokens = { DOMAIN: domain };
  for (const [token, key] of Object.entries({
    STATE_ROOT: 'stateRoot',
    MIME_TYPES: 'mimeTypes',
    CERTIFICATE: 'certificate',
    CERTIFICATE_KEY: 'certificateKey',
    FRONTEND_ROOT: 'frontendRoot',
  })) {
    const value = values[key];
    if (
      typeof value !== 'string' ||
      !path.isAbsolute(value) ||
      /[\r\n\x00";$`{}]/.test(value)
    ) {
      throw new Error('invalid_absolute_path');
    }
    tokens[token] = value.replace(/\\/g, '/');
  }

  for (const [token, key, fallback] of [
    ['HTTP_PORT', 'httpPort', 80],
    ['HTTPS_PORT', 'httpsPort', 443],
    ['API_PORT', 'apiPort', 3003],
  ]) {
    const value = values[key] ?? fallback;
    if (!Number.isInteger(value) || value < 1 || value > 65535) {
      throw new Error('invalid_port');
    }
    tokens[token] = String(value);
  }

  const templatePath = path.join(__dirname, 'nginx/boilerplate.conf.template');
  const template = fs.readFileSync(templatePath, 'utf8');

  return template.replace(/__([A-Z_]+)__/g, (_, key) => {
    if (!(key in tokens)) throw new Error('unknown_template_token');
    return tokens[key];
  });
}

exports.renderNginx = renderNginx;

if (require.main === module) {
  try {
    if (process.argv.length !== 4) throw new Error();
    const config = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
    fs.writeFileSync(process.argv[3], renderNginx(config), {
      flag: 'wx',
      mode: 0o600,
    });
    console.log(JSON.stringify({ status: 'proxy_rendered_not_installed' }));
  } catch {
    console.error(
      'Proxy rendering failed. Review the public host/path configuration and use a new output file.',
    );
    process.exitCode = 1;
  }
}
