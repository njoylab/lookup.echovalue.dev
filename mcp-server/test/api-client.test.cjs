const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');

test('MCP allows a multi-step analysis beyond seven seconds and preserves zero retry settings', { timeout: 15000 }, async t => {
    let received;
    const server = http.createServer(async (req, res) => {
        let body = '';
        for await (const chunk of req) body += chunk;
        received = JSON.parse(body);
        setTimeout(() => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ results: [{ domain: 'example.com', lookupResult: { records: {} } }] }));
        }, 7500);
    });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
    process.env.DNS_API_ENDPOINT = `http://127.0.0.1:${server.address().port}/dns-query`;
    process.env.DNS_API_KEY = 'test-key';
    const root = process.env.TEST_MCP_ROOT || path.resolve(__dirname, '..');
    const { DnsApiClient } = require(path.join(root, 'dist', 'api-client.js'));
    const result = await new DnsApiClient().lookup({ domains: ['example.com'], maxRetries: 0, retryDelay: 0, enableEnrichment: true });
    assert.equal(result.results[0].domain, 'example.com');
    assert.equal(received.maxRetries, 0);
    assert.equal(received.retryDelay, 0);
});
