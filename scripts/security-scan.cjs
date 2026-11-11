const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');

async function copySnapshot(source, destination, files) {
  let copied = 0;
  for (const file of files) {
    if (
      !file ||
      path.isAbsolute(file) ||
      file.split(/[\\/]/).some((part) => part === '..') ||
      /[\x00\r\n]/.test(file)
    ) {
      throw new Error('invalid_source_path');
    }
    const input = path.resolve(source, file);
    const target = path.resolve(destination, file);
    if (
      !(
        input.startsWith(path.resolve(source) + path.sep) &&
        target.startsWith(path.resolve(destination) + path.sep)
      )
    ) {
      throw new Error('source_escape');
    }
    let stat;
    try {
      stat = await fs.lstat(input);
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    if (
      !stat.isFile() ||
      stat.isSymbolicLink() ||
      (await fs.realpath(input)) !== input
    ) {
      throw new Error('real_source_files_required');
    }
    await fs.mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await fs.copyFile(input, target);
    await fs.chmod(target, 0o600);
    copied++;
  }
  return copied;
}

exports.copySnapshot = copySnapshot;

async function main() {
  const git = spawnSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    {
      cwd: root,
      encoding: 'utf8',
      windowsHide: true,
      maxBuffer: 8 * 1024 * 1024,
    },
  );
  if (git.status !== 0) throw new Error('git_unavailable');

  const files = [...new Set(git.stdout.split('\0').filter(Boolean))];
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), 'boilerplate-security-'),
  );
  await fs.chmod(temporary, 0o700);

  try {
    const snapshot = path.join(temporary, 'source');
    await fs.mkdir(snapshot, { mode: 0o700 });
    const count = await copySnapshot(root, snapshot, files);
    const report = path.join(temporary, 'report.json');

    const result = spawnSync(
      process.env.GITLEAKS_BIN || 'gitleaks',
      [
        'dir',
        snapshot,
        '--redact=100',
        '--no-banner',
        '--report-format=json',
        '--report-path',
        report,
      ],
      {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 120000,
        maxBuffer: 4 * 1024 * 1024,
      },
    );

    if (result.error && result.error.code === 'ENOENT') {
      console.log(
        JSON.stringify({
          status: 'skipped',
          scanner: 'gitleaks',
          detail:
            'gitleaks binary not found on PATH. Install gitleaks to enable secret scanning.',
        }),
      );
      return;
    }

    if (![0, 1].includes(result.status)) {
      throw new Error('scanner_unavailable');
    }

    let findings = [];
    try {
      findings = JSON.parse(await fs.readFile(report, 'utf8'));
    } catch (error) {
      if (result.status !== 0 || error.code !== 'ENOENT') {
        throw new Error('invalid_or_missing_report');
      }
    }

    if (!Array.isArray(findings) || (result.status === 1 && !findings.length)) {
      throw new Error('invalid_report');
    }

    console.log(
      JSON.stringify({
        status: findings.length ? 'findings_require_review' : 'passed',
        scanner: 'gitleaks',
        filesScanned: count,
        findingCount: findings.length,
        findings: findings.map((item) => ({
          rule: item.RuleID,
          file: path.relative(snapshot, item.File),
          line: item.StartLine,
        })),
        historyScanned: false,
        ignoredPrivateFilesScanned: false,
      }),
    );
    if (findings.length) process.exitCode = 1;
  } finally {
    const actual = await fs.realpath(temporary);
    const parent = await fs.realpath(os.tmpdir());
    if (
      !actual.startsWith(parent + path.sep) ||
      !path.basename(actual).startsWith('boilerplate-security-')
    ) {
      throw new Error('invalid_cleanup_target');
    }
    await fs.rm(actual, { recursive: true });
  }
}

if (require.main === module) {
  main().catch(() => {
    console.error(
      JSON.stringify({
        status: 'security_scan_unavailable',
        detail:
          'Review the scanner installation and source snapshot. No source excerpts or secrets are logged.',
      }),
    );
    process.exitCode = 2;
  });
}
