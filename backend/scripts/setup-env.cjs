const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');

const backendRoot = path.resolve(__dirname, '..');
const envPath = path.join(backendRoot, '.env');
const example = fs.readFileSync(path.join(backendRoot, '.env.example'), 'utf8');
const existed = fs.existsSync(envPath);
let content = existed ? fs.readFileSync(envPath, 'utf8') : example;

const values = new Map();
for (const line of content.split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
  if (match) {
    values.set(match[1], match[2].trim().replace(/^(['"])(.*)\1$/, '$2'));
  }
}

// Preserve existing configuration; add missing keys from .env.example
for (const line of example.split(/\r?\n/)) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match && !values.has(match[1])) {
    content += `\n${line}`;
    values.set(match[1], match[2]);
  }
}

// Generate secure JWT_SECRET if missing or using default placeholder
const currentJwt = values.get('JWT_SECRET');
if (!currentJwt || currentJwt === 'replace_me_with_a_long_random_secret_at_least_32_chars') {
  const secret = randomBytes(32).toString('base64url');
  content = content.replace(
    new RegExp('^JWT_SECRET=.*$', 'm'),
    `JWT_SECRET=${secret}`,
  );
  values.set('JWT_SECRET', secret);
}

if (!existed || content !== fs.readFileSync(envPath, 'utf8')) {
  fs.writeFileSync(envPath, content.replace(/\s*$/, '\n'), { mode: 0o600 });
}

// Sync frontend environment
const frontendRoot = path.resolve(backendRoot, '../frontend');
const frontendEnvPath = path.join(frontendRoot, '.env');
if (!fs.existsSync(frontendEnvPath)) {
  const frontendExample = path.join(frontendRoot, '.env.example');
  if (fs.existsSync(frontendExample)) {
    fs.copyFileSync(frontendExample, frontendEnvPath);
  }
}

// Ensure uploads folder exists
const uploadsDir = path.join(backendRoot, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

console.log(
  `${existed ? 'Preserved and completed' : 'Created'} backend/.env.`,
);
console.log('Frontend environment and local upload directories are ready.');
