const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = process.env.TEST_PROJECT_ROOT || path.resolve(__dirname, '..');
const testEndpoint = 'https://dns-api.example.test/dns-query';

function createProjectCopy() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lookup-test-'));
    fs.cpSync(projectRoot, dir, {
        recursive: true,
        filter: source => !['node_modules', '.git', 'dist'].includes(path.basename(source))
    });
    return dir;
}

function build(dir, overrides = {}) {
    return spawnSync(process.execPath, ['build.js'], {
        cwd: dir,
        encoding: 'utf8',
        env: {
            ...process.env,
            CLOUDFLARE_TURNSTILE_SITE_KEY: '',
            TURNSTILE_SITE_KEY: 'test-public-key',
            DNS_API_ENDPOINT: testEndpoint,
            ...overrides
        }
    });
}

module.exports = { projectRoot, testEndpoint, createProjectCopy, build };
