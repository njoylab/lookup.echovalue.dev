const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const { createProjectCopy, build, testEndpoint } = require('./helpers');

let browser, server, dir, origin;
before(async () => {
    dir = createProjectCopy();
    const result = build(dir);
    assert.equal(result.status, 0, result.stderr);
    server = http.createServer((req, res) => {
        let pathname = new URL(req.url, 'http://localhost').pathname;
        if (pathname.endsWith('/')) pathname += 'index.html';
        const file = path.join(dir, 'dist', pathname);
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
        const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }[path.extname(file)];
        res.setHeader('Content-Type', type || 'application/octet-stream');
        res.end(fs.readFileSync(file));
    });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    origin = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
});
after(async () => {
    await browser?.close();
    if (server) await new Promise(resolve => server.close(resolve));
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
});

async function openPage(t, pathname = '/', options = {}) {
    const context = await browser.newContext(options.mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 } : {});
    t.after(() => context.close());
    const page = await context.newPage();
    page.setDefaultTimeout(3000);
    const errors = [], requests = [];
    page.on('pageerror', error => errors.push(error.message));
    await context.route('**/*', async route => {
        const url = route.request().url();
        if (url === testEndpoint) {
            const payload = route.request().postDataJSON();
            requests.push(payload);
            const lookupResult = options.result || { records: {} };
            if (options.waitForResponse) await options.waitForResponse;
            await route.fulfill({ json: { results: [{ domain: payload.domains[0], lookupResult }] } });
        } else if (url.includes('challenges.cloudflare.com/turnstile/')) {
            await route.fulfill({ contentType: 'text/javascript', body: "window.testVerify = () => {window.testToken = 'verified-token'; const callback = document.querySelector('.cf-turnstile')?.dataset.callback; if (typeof window[callback] === 'function') window[callback](window.testToken);}; window.turnstile = {getResponse: () => window.testToken || '', reset: () => {window.testToken = '';}};" });
        } else if (url.startsWith(origin)) {
            await route.continue();
        } else {
            await route.abort();
        }
    });
    if (options.history !== undefined) {
        await context.addInitScript(value => localStorage.setItem('dns-analyzer-history', value), options.history);
    }
    if (options.blockStorage) {
        await context.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Storage unavailable', 'QuotaExceededError'); }; });
    }
    await page.goto(origin + pathname);
    await page.waitForFunction(() => typeof window.turnstile?.getResponse === 'function');
    return { page, requests, errors };
}

async function submit(page, input) {
    await page.locator('#domain').fill(input);
    await page.locator('#domain').blur();
    await page.evaluate(() => { window.testToken = 'verified-token'; });
    assert.equal(await page.locator('#analyzeBtn').isDisabled(), false, input);
    await page.locator('#domain').press('Enter');
    await page.locator('#resultsContainer').waitFor({ state: 'visible', timeout: 2000 });
    await page.waitForFunction(() => !document.getElementById('analyzeBtn').disabled);
}

test('Domain input sends the exact hostname or IP, including URL, IDN and DNS-label cases', async t => {
    const { page, requests, errors } = await openPage(t);
    const cases = [
        ['https://www.example.com/path?x=1', 'www.example.com'],
        ['example.com:443', 'example.com'],
        ['8.8.8.8:53', '8.8.8.8'],
        ['a.io', 'a.io'],
        ['www.example.com', 'www.example.com'],
        ['_dmarc.example.com', '_dmarc.example.com'],
        ['https://[2001:db8::1]:443/path', '2001:db8::1'],
        ['2001:db8::1', '2001:db8::1'],
        ['bücher.de.', 'xn--bcher-kva.de']
    ];
    for (const [input, expected] of cases) {
        await submit(page, input);
        assert.equal(requests.at(-1).domains[0], expected, input);
    }
    const count = requests.length;
    for (const invalid of ['256.1.1.1', 'example..com', '-bad.example.com', 'bad-.example.com', 'example.com:99999', 'foo@bar.com', '[broken]', 'example.com:abc']) {
        await page.locator('#domain').fill(invalid);
        await page.locator('#domain').blur();
        assert.equal(await page.locator('#analyzeBtn').isDisabled(), true, invalid);
    }
    assert.equal(requests.length, count);
    assert.deepEqual(errors, []);
});

test('Results show CNAME, PTR, all TXT records, reverse hostnames and documented DKIM status on mobile', async t => {
    const { page, errors } = await openPage(t, '/dkim-check/', { mobile: true, result: {
        records: {
            CNAME: [{ value: 'alias.example.net', ttl: 300 }],
            PTR: [{ value: 'ptr.example.net', ttl: 300 }],
            TXT: Array.from({ length: 5 }, (_, i) => ({ entries: [`txt-record-${i}`], ttl: 600 }))
        },
        reverseLookup: { hostnames: ['reverse.example.net'], responseTime: 10 },
        has_dkim: true,
        email_security_score: 80,
        spf_valid: true,
        dmarc_policy: 'reject',
        mx_provider: 'Example mail'
    } });
    await submit(page, 'example.com');
    const text = await page.locator('#resultsContainer').innerText();
    for (const value of ['alias.example.net', 'ptr.example.net', 'txt-record-4', 'reverse.example.net', 'DKIM', 'Detected', '80/100']) assert.ok(text.includes(value), value);
    assert.deepEqual(errors, []);
});

test('Invalid score markup is never interpreted as HTML and zero days to expiry stays visible', async t => {
    const { page, errors } = await openPage(t, '/', { result: {
        records: {},
        has_dkim: false,
        enrichment: {
            emailSecurity: { score: '<img src=x onerror="window.scoreInjected=true">' },
            ssl: { certificate: { daysUntilExpiry: 0, subject: { commonName: 'example.com' } } }
        }
    } });
    await submit(page, 'example.com');
    assert.equal(await page.locator('#resultsContainer img').count(), 0);
    assert.equal(await page.evaluate(() => window.scoreInjected), undefined);
    const text = await page.locator('#resultsContainer').innerText();
    assert.ok(text.includes('Not available'));
    assert.ok(text.includes('0 days'));
    assert.ok(text.includes('Not detected in checked selectors'));
    assert.deepEqual(errors, []);
});

test('Shared lookup waits for verification and shares/reloads the most recent target', async t => {
    const { page, requests, errors } = await openPage(t, '/lookup/?target=first.example');
    // Observe beyond the old 500ms auto-submit timer before supplying verification.
    await page.waitForTimeout(700);
    assert.equal(requests.length, 0);
    assert.equal(await page.locator('.toast').count(), 0);
    await page.evaluate(() => window.testVerify());
    await page.locator('#resultsContainer').waitFor({ state: 'visible' });
    assert.equal(requests[0].domains[0], 'first.example');
    await page.evaluate(() => window.testVerify());
    assert.equal(requests.length, 1);
    await submit(page, 'second.example');
    assert.equal(new URL(page.url()).search, '?target=second.example');
    await page.waitForFunction(() => document.getElementById('shareUrl').value.endsWith('?target=second.example'));
    assert.equal(await page.locator('#shareUrl').inputValue(), origin + '/lookup/?target=second.example');
    await page.reload();
    assert.equal(await page.locator('#domain').inputValue(), 'second.example');
    await page.goBack();
    assert.equal(await page.locator('#domain').inputValue(), 'first.example');
    assert.equal(await page.locator('#resultsContainer').isVisible(), false);
    assert.deepEqual(errors, []);
});

test('Editing an unverified shared lookup cancels automatic submission', async t => {
    const { page, requests } = await openPage(t, '/lookup/?target=first.example');
    await page.locator('#domain').fill('edited.example');
    await page.evaluate(() => window.testVerify());
    await page.waitForTimeout(700);
    assert.equal(requests.length, 0);
    assert.equal(await page.locator('#resultsContainer').isVisible(), false);
});

test('Malformed local history does not prevent lookup initialization', async t => {
    for (const history of ['{broken', '{"unexpected":true}', '[null,42,{"domain":7}]']) {
        const { page, errors } = await openPage(t, '/?domain=example.com', { history });
        assert.equal(await page.locator('#domain').inputValue(), 'example.com');
        await submit(page, 'example.com');
        assert.deepEqual(errors, []);
    }
});

test('Storage failures do not turn a successful analysis into a request failure', async t => {
    const { page, errors } = await openPage(t, '/', { blockStorage: true });
    await submit(page, 'example.com');
    assert.equal(await page.locator('.toast-error').count(), 0);
    assert.ok((await page.locator('#toastContainer').innerText()).includes('history could not be saved'));
    assert.deepEqual(errors, []);
});

test('Reloading history preserves zero retries', async t => {
    const { page, requests, errors } = await openPage(t, '/', { history: JSON.stringify([{
        domain: 'example.com', timestamp: '2026-01-01T00:00:00.000Z', options: { maxRetries: 0, recordTypes: ['A'] }
    }]) });
    await page.evaluate(() => { window.testToken = 'verified-token'; });
    await page.locator('#historyToggle').click();
    await page.locator('.history-item-main').click();
    await page.locator('#resultsContainer').waitFor({ state: 'visible' });
    assert.equal(requests[0].maxRetries, 0);
    assert.deepEqual(errors, []);
});

test('Calendar download schedules a full day 30 days before expiry with an accurate alarm', async t => {
    const { page } = await openPage(t, '/', { result: { records: {}, enrichment: { ssl: { certificate: {
        subject: { commonName: 'example.com' }, validTo: '2027-01-31T12:00:00Z', daysUntilExpiry: 90
    } } } } });
    await submit(page, 'example.com');
    const pending = page.waitForEvent('download');
    await page.locator('.calendar-btn').click();
    const download = await pending;
    const text = fs.readFileSync(await download.path(), 'utf8');
    const lines = text.split(/\r?\n/);
    assert.ok(lines.includes('DTEND;VALUE=DATE:20270102'));
    assert.ok(lines.includes('DTSTART;VALUE=DATE:20270101'));
    assert.ok(text.includes('TRIGGER:PT0S\r\n'));
    assert.ok(text.includes('expires on 20270131'));
    assert.equal(text.includes('expires in 7 days'), false);
});


test('A pending lookup cannot be duplicated or display stale results after back navigation', async t => {
    let release;
    const waitForResponse = new Promise(resolve => { release = resolve; });
    const { page, requests, errors } = await openPage(t, '/', { waitForResponse });
    t.after(release);
    await page.locator('#domain').fill('first.example');
    await page.evaluate(() => { window.testToken = 'verified-token'; });
    const started = page.waitForRequest(testEndpoint);
    await page.locator('#domain').press('Enter');
    await started;
    await page.locator('#domain').fill('second.example');
    await page.locator('#domain').blur();
    assert.equal(await page.locator('#analyzeBtn').isDisabled(), true);
    await page.evaluate(() => document.getElementById('analyzerForm').dispatchEvent(new Event('submit', { cancelable: true })));
    assert.equal(requests.length, 1);
    await page.goBack();
    release();
    await page.waitForFunction(() => !document.getElementById('analyzeBtn').disabled);
    assert.equal(await page.locator('#resultsContainer').isVisible(), false);
    assert.deepEqual(errors, []);
});
