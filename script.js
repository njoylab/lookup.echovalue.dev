// Mock data - Replace with actual API call
const MOCK_DATA = [
    {
        "domain": "unibocconi.it",
        "lookupResult": {
            "domain": "unibocconi.it",
            "timestamp": "2025-12-22T08:27:48.307Z",
            "records": {
                "MX": [
                    {
                        "type": "MX",
                        "exchange": "unibocconi-it.mail.protection.outlook.com",
                        "priority": 10
                    }
                ],
                "A": [
                    {
                        "type": "A",
                        "address": "193.205.23.246",
                        "ttl": 300
                    }
                ],
                "NS": [
                    {
                        "type": "NS",
                        "value": "dns.cineca.com"
                    },
                    {
                        "type": "NS",
                        "value": "dns.cineca.it"
                    },
                    {
                        "type": "NS",
                        "value": "ns2.unibocconi.it"
                    },
                    {
                        "type": "NS",
                        "value": "ns1.garr.net"
                    },
                    {
                        "type": "NS",
                        "value": "ns1.unibocconi.it"
                    }
                ],
                "AAAA": [
                    {
                        "type": "AAAA",
                        "address": "2001:760:2006:10::1240",
                        "ttl": 300
                    }
                ],
                "TXT": [
                    {
                        "type": "TXT",
                        "entries": ["v=spf1 include:spf.protection.outlook.com ~all"]
                    },
                    {
                        "type": "TXT",
                        "entries": ["google-site-verification=tZDUVzg3Y0OII8Hgvu_VSRlnUCwW5-LpSpaX4hMdI0I"]
                    }
                ]
            },
            "enrichment": {
                "emailSecurity": {
                    "score": 90,
                    "recommendations": [
                        "Add backup MX records for email redundancy"
                    ],
                    "spf": {
                        "version": "v=spf1",
                        "isValid": true,
                        "warnings": []
                    },
                    "dmarc": {
                        "version": "DMARC1",
                        "policy": "reject",
                        "isValid": true,
                        "warnings": []
                    },
                    "mx": {
                        "totalServers": 1,
                        "primaryServer": "unibocconi-it.mail.protection.outlook.com",
                        "provider": {
                            "name": "Microsoft 365",
                            "confidence": "high"
                        }
                    }
                },
                "ssl": {
                    "certificate": {
                        "subject": {
                            "commonName": "*.unibocconi.it"
                        },
                        "issuer": {
                            "commonName": "GEANT TLS RSA 1",
                            "organization": "Hellenic Academic and Research Institutions CA",
                            "country": "GR"
                        },
                        "validFrom": "Jul 31 08:04:27 2025 GMT",
                        "validTo": "Jul 31 08:04:27 2026 GMT",
                        "daysUntilExpiry": 221
                    }
                }
            },
            "mx_provider": "Microsoft 365",
            "spf_valid": true,
            "dmarc_policy": "reject",
            "has_dkim": true,
            "email_security_score": 90,
            "ssl_certificate_expires_at": "Jul 31 08:04:27 2026 GMT",
            "ssl_days_until_expiry": 221
        },
        "propagationResults": [
            {
                "domain": "unibocconi.it",
                "recordType": "A",
                "isPropagated": true,
                "consistencyPercentage": 100,
                "servers": {
                    "8.8.8.8": {
                        "records": [{"type": "A", "address": "193.205.23.246", "ttl": 2191}],
                        "responseTime": 2
                    },
                    "1.1.1.1": {
                        "records": [{"type": "A", "address": "193.205.23.246", "ttl": 3600}],
                        "responseTime": 103
                    }
                }
            }
        ]
    }
];

// DOM Elements
const form = document.getElementById('analyzerForm');
const advancedToggle = document.getElementById('advancedToggle');
const advancedOptions = document.getElementById('advancedOptions');
const resultsContainer = document.getElementById('resultsContainer');
const domainInput = document.getElementById('domain');
const historyToggle = document.getElementById('historyToggle');
const historyPanel = document.getElementById('historyPanel');
const historyList = document.getElementById('historyList');
const historyCount = document.getElementById('historyCount');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

const API_ENDPOINT = '__API_ENDPOINT__';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, payload, timeoutMs, turnstileToken) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (turnstileToken) {
            headers['X-Turnstile-Token'] = turnstileToken;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        const raw = await response.text();
        let data = null;

        if (raw) {
            try {
                data = JSON.parse(raw);
            } catch (e) {
                throw new Error('Invalid JSON response from API');
            }
        }

        if (!response.ok) {
            const message = data?.error || `Request failed with status ${response.status}`;
            throw new Error(message);
        }

        return data;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function callDnsApi(domain, options, turnstileToken) {
    const payload = {
        domains: [domain],
        recordTypes: options.recordTypes,
        checkPropagation: options.checkPropagation,
        performReverseLookup: options.reverseDNS,
        enableEnrichment: options.enrichment,
        enableSslInspection: options.sslInspection,
        timeout: options.timeout,
        maxRetries: options.maxRetries,
        retryDelay: options.retryDelay,
        includeMetadata: false
    };

    let lastError = null;

    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
        try {
        return await fetchWithTimeout(API_ENDPOINT, payload, options.timeout, turnstileToken);
        } catch (error) {
            lastError = error;
            if (attempt >= options.maxRetries) {
                break;
            }
            await sleep(options.retryDelay);
        }
    }

    throw lastError || new Error('Request failed');
}

function getTurnstileToken() {
    const formData = new FormData(form);
    const token = formData.get('cf-turnstile-response');

    if (token) {
        return String(token);
    }

    if (window.turnstile && typeof window.turnstile.getResponse === 'function') {
        return window.turnstile.getResponse();
    }

    return '';
}

// Advanced options toggle
advancedToggle.addEventListener('click', () => {
    advancedToggle.classList.toggle('active');
    advancedOptions.classList.toggle('active');
});

// History toggle
historyToggle.addEventListener('click', () => {
    historyToggle.classList.toggle('active');
    historyPanel.classList.toggle('active');
});

// History management
const HISTORY_KEY = 'dns-analyzer-history';
const MAX_HISTORY_ITEMS = 20;

function getFormOptions() {
    const formData = new FormData(form);
    const options = {
        recordTypes: [],
        checkPropagation: false,
        reverseDNS: false,
        enrichment: false,
        sslInspection: false,
        timeout: 5000,
        maxRetries: 3,
        retryDelay: 1000
    };

    // Get selected record types
    formData.getAll('recordType').forEach(type => {
        options.recordTypes.push(type);
    });

    // Get toggles
    options.checkPropagation = formData.get('checkPropagation') === 'on';
    options.reverseDNS = formData.get('reverseDNS') === 'on';
    options.enrichment = formData.get('enrichment') === 'on';
    options.sslInspection = formData.get('sslInspection') === 'on';

    // Get numbers
    options.timeout = parseInt(formData.get('timeout') || '5000');
    options.maxRetries = parseInt(formData.get('maxRetries') || '3');
    options.retryDelay = parseInt(formData.get('retryDelay') || '1000');

    return options;
}

function saveToHistory(domain, options) {
    let history = getHistory();

    // Remove duplicate if exists
    history = history.filter(item => item.domain !== domain);

    // Add new entry at the beginning
    history.unshift({
        domain: domain,
        options: options,
        timestamp: new Date().toISOString()
    });

    // Limit history size
    if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory();
}

function getHistory() {
    try {
        const history = localStorage.getItem(HISTORY_KEY);
        return history ? JSON.parse(history) : [];
    } catch (e) {
        return [];
    }
}

function deleteHistoryItem(domain) {
    let history = getHistory();
    history = history.filter(item => item.domain !== domain);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory();
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all search history?')) {
        localStorage.removeItem(HISTORY_KEY);
        renderHistory();
    }
}

function formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}

function getOptionsCount(options) {
    if (!options) return 0;

    let count = 0;
    if (options.recordTypes && options.recordTypes.length > 0) count++;
    if (options.checkPropagation) count++;
    if (options.reverseDNS) count++;
    if (options.enrichment) count++;
    if (options.sslInspection) count++;

    return count;
}

function renderHistory() {
    const history = getHistory();

    if (history.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No search history yet</div>';
        historyCount.style.display = 'none';
        return;
    }

    // Update counter
    historyCount.textContent = history.length;
    historyCount.style.display = 'inline-block';

    // Render items
    historyList.innerHTML = history.map(item => {
        const optionsCount = getOptionsCount(item.options);
        return `
            <div class="history-item" data-domain="${item.domain}">
                <div class="history-item-main">
                    <div class="history-item-domain">${item.domain}</div>
                    <div class="history-item-meta">
                        <span class="history-item-date">
                            <span>📅</span>
                            <span>${formatDate(item.timestamp)}</span>
                        </span>
                        ${optionsCount > 0 ? `<span class="history-item-options">${optionsCount} options</span>` : ''}
                    </div>
                </div>
                <button class="history-item-delete" data-domain="${item.domain}" title="Delete">×</button>
            </div>
        `;
    }).join('');

    // Add event listeners
    historyList.querySelectorAll('.history-item').forEach(item => {
        const mainArea = item.querySelector('.history-item-main');
        mainArea.addEventListener('click', () => {
            const domain = item.dataset.domain;
            const historyItem = history.find(h => h.domain === domain);
            if (historyItem) {
                loadFromHistory(historyItem);
            }
        });
    });

    historyList.querySelectorAll('.history-item-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const domain = btn.dataset.domain;
            deleteHistoryItem(domain);
        });
    });
}

function loadFromHistory(historyItem) {
    // Set domain
    domainInput.value = historyItem.domain;

    // Set options if available
    if (historyItem.options) {
        const options = historyItem.options;

        // Set record types
        if (options.recordTypes) {
            form.querySelectorAll('input[name="recordType"]').forEach(checkbox => {
                checkbox.checked = options.recordTypes.includes(checkbox.value);
            });
        }

        // Set toggles
        const toggles = {
            checkPropagation: options.checkPropagation,
            reverseDNS: options.reverseDNS,
            enrichment: options.enrichment,
            sslInspection: options.sslInspection
        };

        Object.keys(toggles).forEach(key => {
            const input = form.querySelector(`input[name="${key}"]`);
            if (input) input.checked = toggles[key];
        });

        // Set numbers
        if (options.timeout) {
            const timeoutInput = form.querySelector('input[name="timeout"]');
            if (timeoutInput) timeoutInput.value = options.timeout;
        }
        if (options.maxRetries) {
            const retriesInput = form.querySelector('input[name="maxRetries"]');
            if (retriesInput) retriesInput.value = options.maxRetries;
        }
        if (options.retryDelay) {
            const delayInput = form.querySelector('input[name="retryDelay"]');
            if (delayInput) delayInput.value = options.retryDelay;
        }
    }

    // Close history panel
    historyPanel.classList.remove('active');
    historyToggle.classList.remove('active');

    // Submit form
    form.dispatchEvent(new Event('submit'));
}

// Clear history button
clearHistoryBtn.addEventListener('click', clearHistory);

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const domain = domainInput.value.trim();

    if (!domain) {
        alert('Please enter a domain name');
        return;
    }

    const turnstileToken = getTurnstileToken();
    if (!turnstileToken) {
        alert('Please complete the Turnstile verification');
        return;
    }

    // Get form options
    const options = getFormOptions();

    // Update URL with domain parameter
    const url = new URL(window.location);
    url.searchParams.set('domain', domain);
    window.history.pushState({}, '', url);

    // Show loading state
    const analyzeBtn = form.querySelector('.analyze-btn');
    const originalText = analyzeBtn.innerHTML;
    analyzeBtn.innerHTML = '<span class="loading"></span><span style="margin-left: 0.5rem;">Analyzing...</span>';
    analyzeBtn.disabled = true;

    try {
        const response = await callDnsApi(domain, options, turnstileToken);
        const result = response?.results?.[0];

        if (!result?.lookupResult) {
            throw new Error('Unexpected API response');
        }

        displayResults(result);
        saveToHistory(domain, options);

        setTimeout(() => {
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    } catch (error) {
        alert(error?.message || 'Request failed');
    } finally {
        if (window.turnstile && typeof window.turnstile.reset === 'function') {
            window.turnstile.reset();
        }

        analyzeBtn.innerHTML = originalText;
        analyzeBtn.disabled = false;
    }
});

// Display results
function displayResults(data) {
    const { domain, lookupResult, propagationResults } = data;
    const { records, enrichment } = lookupResult;

    let html = `
        <div class="results-card">
            <div class="results-header">
                <h2 class="results-title">Analysis Results</h2>
                <div class="domain-badge">${domain}</div>
            </div>

            ${renderEmailSecurity(enrichment)}
            ${renderDNSRecords(records)}
            ${renderSSLCertificate(enrichment)}
            ${renderPropagation(propagationResults)}
        </div>
    `;

    resultsContainer.innerHTML = html;
    resultsContainer.style.display = 'block';

    // Add event listener for calendar button
    const calendarBtn = resultsContainer.querySelector('.calendar-btn');
    if (calendarBtn) {
        calendarBtn.addEventListener('click', function() {
            const domain = this.dataset.domain;
            const date = this.dataset.date;
            downloadCalendarEvent(domain, date);

            // Visual feedback
            const originalContent = this.innerHTML;
            this.innerHTML = '<span>✓</span><span>Added!</span>';
            this.style.background = 'var(--color-success)';

            setTimeout(() => {
                this.innerHTML = originalContent;
                this.style.background = '';
            }, 2000);
        });
    }
}

// Render email security section
function renderEmailSecurity(enrichment) {
    if (!enrichment?.emailSecurity) return '';

    const { score, spf, dmarc, mx } = enrichment.emailSecurity;

    return `
        <div class="results-section">
            <h3 class="section-title">
                <span class="section-icon">🔒</span>
                Email Security Analysis
            </h3>
            <div class="data-grid">
                <div class="data-item">
                    <div class="data-label">Security Score</div>
                    <div class="security-score">${score}/100</div>
                </div>
                <div class="data-item">
                    <div class="data-label">SPF Record</div>
                    <div class="data-value" style="color: ${spf?.isValid ? 'var(--color-success)' : 'var(--color-error)'}">
                        ${spf?.isValid ? '✓ Valid' : '✗ Invalid'}
                    </div>
                </div>
                <div class="data-item">
                    <div class="data-label">DMARC Policy</div>
                    <div class="data-value" style="color: var(--color-success)">
                        ${dmarc?.policy || 'Not configured'}
                    </div>
                </div>
                <div class="data-item">
                    <div class="data-label">Email Provider</div>
                    <div class="data-value">${mx?.provider?.name || 'Unknown'}</div>
                </div>
            </div>
        </div>
    `;
}

// Render DNS records
function renderDNSRecords(records) {
    if (!records) return '';

    let recordsHtml = '';

    // A Records
    if (records.A && records.A.length > 0) {
        recordsHtml += `
            <div class="results-section">
                <h3 class="section-title">
                    <span class="section-icon">📍</span>
                    A Records (IPv4)
                </h3>
                <div class="record-list">
                    ${records.A.map(r => `
                        <div class="record-item">
                            <span class="record-type">A</span>
                            <span>${r.address}</span>
                            ${r.ttl ? `<span style="color: var(--color-text-muted); margin-left: 1rem;">TTL: ${r.ttl}s</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // AAAA Records
    if (records.AAAA && records.AAAA.length > 0) {
        recordsHtml += `
            <div class="results-section">
                <h3 class="section-title">
                    <span class="section-icon">📍</span>
                    AAAA Records (IPv6)
                </h3>
                <div class="record-list">
                    ${records.AAAA.map(r => `
                        <div class="record-item">
                            <span class="record-type">AAAA</span>
                            <span>${r.address}</span>
                            ${r.ttl ? `<span style="color: var(--color-text-muted); margin-left: 1rem;">TTL: ${r.ttl}s</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // MX Records
    if (records.MX && records.MX.length > 0) {
        recordsHtml += `
            <div class="results-section">
                <h3 class="section-title">
                    <span class="section-icon">📧</span>
                    MX Records (Mail Servers)
                </h3>
                <div class="record-list">
                    ${records.MX.map(r => `
                        <div class="record-item">
                            <span class="record-type">MX</span>
                            <span>${r.exchange}</span>
                            <span style="color: var(--color-text-muted); margin-left: 1rem;">Priority: ${r.priority}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // NS Records
    if (records.NS && records.NS.length > 0) {
        recordsHtml += `
            <div class="results-section">
                <h3 class="section-title">
                    <span class="section-icon">🌐</span>
                    NS Records (Name Servers)
                </h3>
                <div class="record-list">
                    ${records.NS.map(r => `
                        <div class="record-item">
                            <span class="record-type">NS</span>
                            <span>${r.value}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // TXT Records (show first 3)
    if (records.TXT && records.TXT.length > 0) {
        recordsHtml += `
            <div class="results-section">
                <h3 class="section-title">
                    <span class="section-icon">📝</span>
                    TXT Records
                </h3>
                <div class="record-list">
                    ${records.TXT.slice(0, 3).map(r => `
                        <div class="record-item">
                            <span class="record-type">TXT</span>
                            <span style="word-break: break-all;">${r.entries.join(' ')}</span>
                        </div>
                    `).join('')}
                    ${records.TXT.length > 3 ? `
                        <div class="record-item" style="color: var(--color-text-muted); text-align: center;">
                            +${records.TXT.length - 3} more TXT records
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    return recordsHtml;
}

// Render SSL certificate
function renderSSLCertificate(enrichment) {
    if (!enrichment?.ssl?.certificate) return '';

    const { certificate } = enrichment.ssl;
    const daysColor = certificate.daysUntilExpiry > 30 ? 'var(--color-success)' :
                     certificate.daysUntilExpiry > 7 ? 'var(--color-warning)' : 'var(--color-error)';

    // Get domain for calendar event
    const domain = certificate.subject?.commonName || 'Unknown domain';
    const certId = `cert-${Date.now()}`; // Unique ID for the calendar button

    return `
        <div class="results-section">
            <h3 class="section-title">
                <span class="section-icon">🔐</span>
                SSL/TLS Certificate
            </h3>
            <div class="data-grid">
                <div class="data-item">
                    <div class="data-label">Common Name</div>
                    <div class="data-value">${certificate.subject?.commonName || 'N/A'}</div>
                </div>
                <div class="data-item">
                    <div class="data-label">Issuer</div>
                    <div class="data-value">${certificate.issuer?.organization || certificate.issuer?.commonName || 'N/A'}</div>
                </div>
                <div class="data-item">
                    <div class="data-label">Valid Until</div>
                    <div class="data-value" style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                        <span>${certificate.validTo || 'N/A'}</span>
                        ${certificate.validTo ? `
                            <button class="calendar-btn" id="${certId}" data-domain="${domain}" data-date="${certificate.validTo}">
                                <span>📅</span>
                                <span>Add reminder</span>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="data-item">
                    <div class="data-label">Days Until Expiry</div>
                    <div class="data-value" style="color: ${daysColor}">
                        ${certificate.daysUntilExpiry || 'N/A'} days
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Generate iCalendar file for SSL certificate expiry reminder
function generateCalendarEvent(domain, expiryDate) {
    // Parse the date (format: "Jul 31 08:04:27 2026 GMT")
    const date = new Date(expiryDate);

    // Set reminder for 30 days before expiry
    const reminderDate = new Date(date);
    reminderDate.setDate(date.getDate() - 30);

    // Format dates for iCal (YYYYMMDD)
    const formatDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    };

    const eventDate = formatDate(reminderDate);
    const expiryDateFormatted = formatDate(date);

    // Create iCal content
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DNS Intelligence//SSL Certificate Reminder//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART;VALUE=DATE:${eventDate}
DTEND;VALUE=DATE:${eventDate}
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
UID:ssl-cert-${domain}-${Date.now()}@dnsintelligence.com
SUMMARY:SSL Certificate Renewal: ${domain}
DESCRIPTION:Reminder: The SSL certificate for ${domain} will expire on ${expiryDateFormatted}. Please renew the certificate before it expires.
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-P7D
ACTION:DISPLAY
DESCRIPTION:SSL certificate for ${domain} expires in 7 days
END:VALARM
END:VEVENT
END:VCALENDAR`;

    return icsContent;
}

// Download calendar event
function downloadCalendarEvent(domain, expiryDate) {
    const icsContent = generateCalendarEvent(domain, expiryDate);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `ssl-cert-reminder-${domain.replace(/[^a-z0-9]/gi, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
}

// Render propagation results
function renderPropagation(propagationResults) {
    if (!propagationResults || propagationResults.length === 0) return '';

    return `
        <div class="results-section">
            <h3 class="section-title">
                <span class="section-icon">🌍</span>
                DNS Propagation Status
            </h3>
            <div class="data-grid">
                ${propagationResults.map(result => `
                    <div class="data-item">
                        <div class="data-label">${result.recordType} Record</div>
                        <div class="propagation-status ${result.isPropagated ? 'success' : 'warning'}">
                            <span>${result.isPropagated ? '✓' : '⚠'}</span>
                            <span>${result.consistencyPercentage}% consistent</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add entrance animations on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe sections for animation
document.querySelectorAll('.cta-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Check for domain parameter in URL
function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Auto-fill domain from URL parameter (no auto-analysis)
function initializeFromURL() {
    // Load history
    renderHistory();

    const domainParam = getURLParameter('domain');

    if (domainParam) {
        // Fill the input field
        domainInput.value = domainParam.trim();
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', initializeFromURL);

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
    const domainParam = getURLParameter('domain');
    if (domainParam) {
        domainInput.value = domainParam.trim();
    } else {
        domainInput.value = '';
        resultsContainer.style.display = 'none';
    }
});
