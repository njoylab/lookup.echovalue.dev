const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createProjectCopy, build } = require('./helpers');

test('Build rejects missing or unsafe configuration before replacing an existing output', t => {
    const dir = createProjectCopy();
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    fs.mkdirSync(path.join(dir, 'dist'));
    fs.writeFileSync(path.join(dir, 'dist', 'sentinel.txt'), 'existing output');
    for (const env of [
        { TURNSTILE_SITE_KEY: '' },
        { TURNSTILE_SITE_KEY: 'YOUR_TURNSTILE_SITE_KEY' },
        { TURNSTILE_SITE_KEY: '\"><script>bad</script>' },
        { DNS_API_ENDPOINT: '' },
        { DNS_API_ENDPOINT: 'javascript:alert(1)' },
        { DNS_API_ENDPOINT: 'https://user:password@example.test' }
    ]) {
        const result = build(dir, env);
        assert.notEqual(result.status, 0, JSON.stringify(env));
        assert.equal(fs.readFileSync(path.join(dir, 'dist', 'sentinel.txt'), 'utf8'), 'existing output');
    }
});

test('Build safely embeds configuration and publishes only site artifacts', t => {
    const dir = createProjectCopy();
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const endpoint = "https://example.test/dns-query?quote='&value=$&";
    const result = build(dir, { DNS_API_ENDPOINT: endpoint });
    assert.equal(result.status, 0, result.stderr);
    const dist = path.join(dir, 'dist');
    const script = fs.readFileSync(path.join(dist, 'script.js'), 'utf8');
    assert.doesNotThrow(() => new vm.Script(script));
    assert.ok(script.includes(JSON.stringify(endpoint)));
    assert.ok(fs.readFileSync(path.join(dist, 'index.html'), 'utf8').includes('test-public-key'));
    assert.ok(fs.existsSync(path.join(dist, 'openapi', 'dns-query.json')));
    for (const privatePath of ['build.js', 'package.json', 'README.md', 'AGENTS.md', 'mcp-server', 'test']) {
        assert.equal(fs.existsSync(path.join(dist, privatePath)), false, privatePath);
    }
});
