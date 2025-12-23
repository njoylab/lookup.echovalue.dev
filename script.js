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

// Toast and Confirmation Elements
const toastContainer = document.getElementById('toastContainer');
const confirmationOverlay = document.getElementById('confirmationOverlay');
const confirmationTitle = document.getElementById('confirmationTitle');
const confirmationMessage = document.getElementById('confirmationMessage');
const confirmationCancel = document.getElementById('confirmationCancel');
const confirmationConfirm = document.getElementById('confirmationConfirm');

// ===============================================
// Toast Notification System
// ===============================================

let toastCounter = 0;

const TOAST_TYPES = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
};

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
 * @returns {HTMLElement} The toast element
 */
function showToast(message, type = 'info', duration = 5000) {
    const toastId = `toast-${++toastCounter}`;
    const icon = TOAST_TYPES[type] || TOAST_TYPES.info;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.id = toastId;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

    toast.innerHTML = `
        <span class="toast-icon" aria-hidden="true">${icon}</span>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" aria-label="Close notification">×</button>
        ${duration > 0 ? '<div class="toast-progress"></div>' : ''}
    `;

    toastContainer.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => dismissToast(toast));

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    if (duration > 0) {
        setTimeout(() => {
            dismissToast(toast);
        }, duration);
    }

    return toast;
}

/**
 * Dismiss a toast notification
 * @param {HTMLElement} toast - The toast element to dismiss
 */
function dismissToast(toast) {
    if (!toast || !toast.classList.contains('toast')) return;

    toast.classList.remove('show');
    toast.classList.add('hide');

    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

/**
 * Dismiss all toasts
 */
function dismissAllToasts() {
    const toasts = toastContainer.querySelectorAll('.toast');
    toasts.forEach(toast => dismissToast(toast));
}

// ===============================================
// Confirmation Modal System
// ===============================================

let confirmResolve = null;

/**
 * Show a confirmation dialog
 * @param {string} message - The confirmation message
 * @param {string} title - The dialog title (optional)
 * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled
 */
function showConfirmation(message, title = 'Confirm Action') {
    return new Promise((resolve) => {
        confirmResolve = resolve;

        confirmationTitle.textContent = title;
        confirmationMessage.textContent = message;

        confirmationOverlay.style.display = 'flex';
        requestAnimationFrame(() => {
            confirmationOverlay.classList.add('show');
        });

        setTimeout(() => {
            confirmationConfirm.focus();
        }, 100);
    });
}

/**
 * Hide the confirmation dialog
 * @param {boolean} confirmed - Whether the action was confirmed
 */
function hideConfirmation(confirmed) {
    confirmationOverlay.classList.remove('show');

    setTimeout(() => {
        confirmationOverlay.style.display = 'none';
        if (confirmResolve) {
            confirmResolve(confirmed);
            confirmResolve = null;
        }
    }, 300);
}

confirmationCancel.addEventListener('click', () => hideConfirmation(false));
confirmationConfirm.addEventListener('click', () => hideConfirmation(true));

confirmationOverlay.addEventListener('click', (e) => {
    if (e.target === confirmationOverlay) {
        hideConfirmation(false);
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && confirmationOverlay.style.display === 'flex') {
        hideConfirmation(false);
    }
});

// ===============================================
// Domain Validation System
// ===============================================

const analyzeBtn = document.getElementById('analyzeBtn');
const domainError = document.getElementById('domain-error');

const DOMAIN_REGEX_UNICODE = /^(?!:\/\/)([a-zA-Z0-9\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF-_]{1,63}\.)*[a-zA-Z0-9\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-zA-Z0-9\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF-_]{0,61}[a-zA-Z0-9\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]\.[a-zA-Z]{2,63}$/;
const VALIDATION_DEBOUNCE_MS = 300;

let validationTimeout = null;
let lastValidationState = null;

/**
 * Validates domain input and returns validation result
 * @param {string} input - Raw domain input
 * @returns {Object} { valid: boolean, message: string, cleaned: string }
 */
function validateDomain(input) {
    if (!input || input.trim() === '') {
        return { valid: true, message: '', cleaned: '' };
    }

    let cleaned = input.trim().toLowerCase();

    // Remove protocol prefixes
    cleaned = cleaned.replace(/^https?:\/\//i, '');
    cleaned = cleaned.replace(/^ftp:\/\//i, '');

    // Remove www. prefix
    cleaned = cleaned.replace(/^www\./i, '');

    // Remove trailing slashes and paths
    cleaned = cleaned.split('/')[0];

    // Remove port numbers
    cleaned = cleaned.split(':')[0];

    // Validation checks
    if (cleaned.includes(' ')) {
        return { valid: false, message: 'Domain cannot contain spaces', cleaned };
    }

    if (cleaned.length < 4) {
        return { valid: false, message: 'Domain is too short (minimum 4 characters)', cleaned };
    }

    if (cleaned.length > 253) {
        return { valid: false, message: 'Domain is too long (maximum 253 characters)', cleaned };
    }

    if (!/^[a-zA-Z0-9\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF.-]+$/.test(cleaned)) {
        return { valid: false, message: 'Domain contains invalid characters', cleaned };
    }

    if (cleaned.includes('..')) {
        return { valid: false, message: 'Domain cannot have consecutive dots', cleaned };
    }

    if (/^[.-]|[.-]$/.test(cleaned)) {
        return { valid: false, message: 'Domain cannot start or end with dots or hyphens', cleaned };
    }

    if (!DOMAIN_REGEX_UNICODE.test(cleaned)) {
        return { valid: false, message: 'Invalid domain format', cleaned };
    }

    return { valid: true, message: '', cleaned };
}

/**
 * Updates UI based on validation state
 * @param {Object} validation - Validation result object
 * @param {boolean} showNeutral - Whether to show neutral state for empty input
 */
function updateValidationUI(validation, showNeutral = false) {
    const isEmpty = !domainInput.value.trim();

    // Clear all states first
    domainInput.classList.remove('valid', 'invalid');
    domainError.classList.remove('show');
    domainInput.setAttribute('aria-invalid', 'false');

    if (isEmpty && showNeutral) {
        analyzeBtn.disabled = false;
        domainError.textContent = '';
        lastValidationState = null;
        return;
    }

    if (!validation.valid && !isEmpty) {
        // Invalid state
        domainInput.classList.add('invalid');
        domainInput.setAttribute('aria-invalid', 'true');
        domainError.textContent = validation.message;
        domainError.classList.add('show');
        analyzeBtn.disabled = true;
        lastValidationState = false;
    } else if (validation.valid && !isEmpty) {
        // Valid state
        domainInput.classList.add('valid');
        domainError.textContent = '';
        analyzeBtn.disabled = false;
        lastValidationState = true;
    } else {
        // Default state (empty)
        analyzeBtn.disabled = false;
        domainError.textContent = '';
        lastValidationState = null;
    }
}

/**
 * Handles real-time validation with debouncing
 */
function handleInputValidation() {
    if (validationTimeout) {
        clearTimeout(validationTimeout);
    }

    // Clear error immediately when user starts typing (if there was an error)
    if (lastValidationState === false) {
        domainInput.classList.remove('invalid');
        domainError.classList.remove('show');
        domainInput.setAttribute('aria-invalid', 'false');
    }

    // Debounce validation
    validationTimeout = setTimeout(() => {
        const validation = validateDomain(domainInput.value);
        updateValidationUI(validation, true);

        // Auto-clean domain if valid
        if (validation.valid && validation.cleaned && validation.cleaned !== domainInput.value) {
            domainInput.value = validation.cleaned;
        }
    }, VALIDATION_DEBOUNCE_MS);
}

// Real-time domain validation
domainInput.addEventListener('input', handleInputValidation);

// Clear validation state on focus (better UX)
domainInput.addEventListener('focus', () => {
    if (!domainInput.value.trim()) {
        updateValidationUI({ valid: true, message: '', cleaned: '' }, true);
    }
});

// Validate on blur
domainInput.addEventListener('blur', () => {
    const validation = validateDomain(domainInput.value);
    updateValidationUI(validation, false);
});

// Store the current API response for JSON export
let currentApiResponse = null;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, payload, turnstileToken) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000);

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

    return await fetchWithTimeout(API_ENDPOINT, payload, turnstileToken);
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

async function clearHistory() {
    const confirmed = await showConfirmation(
        'Are you sure you want to clear all search history? This action cannot be undone.',
        'Clear Search History'
    );

    if (confirmed) {
        localStorage.removeItem(HISTORY_KEY);
        renderHistory();
        showToast('Search history cleared successfully', 'success', 3000);
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

    // Trigger validation
    const validation = validateDomain(historyItem.domain);
    updateValidationUI(validation, true);

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

// Loading messages (Codex-style)
const LOADING_MESSAGES = {
    base: [
        'Initializing DNS query...',
        'Querying authoritative nameservers...',
        'Resolving DNS records...',
        'Validating responses...',
        'Almost there...',
        'Finalizing analysis...'
    ],
    enrichment: [
        'Analyzing email security configuration...',
        'Parsing SPF, DMARC, DKIM records...',
        'Enriching data with intelligence...',
        'Gathering security insights...',
        'Validating MX records...'
    ],
    ssl: [
        'Inspecting SSL/TLS certificates...',
        'Checking certificate chain...',
        'Validating certificate expiry...'
    ],
    propagation: [
        'Checking DNS propagation across global servers...',
        'Querying DNS servers worldwide...',
        'Verifying consistency...'
    ],
    reverse: [
        'Performing reverse DNS lookups...',
        'Resolving PTR records...'
    ]
};

let loadingMessageInterval = null;
let loadingTimerInterval = null;
let startTime = null;

function buildLoadingMessages(options) {
    let messages = [...LOADING_MESSAGES.base];

    if (options.enrichment) {
        messages = messages.concat(LOADING_MESSAGES.enrichment);
    }
    if (options.sslInspection) {
        messages = messages.concat(LOADING_MESSAGES.ssl);
    }
    if (options.checkPropagation) {
        messages = messages.concat(LOADING_MESSAGES.propagation);
    }
    if (options.reverseDNS) {
        messages = messages.concat(LOADING_MESSAGES.reverse);
    }

    // Shuffle for variety
    return messages.sort(() => Math.random() - 0.5);
}

function formatElapsedTime(ms) {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
}

function startLoadingAnimation(button, options) {
    let messageIndex = 0;
    startTime = Date.now();

    const messages = buildLoadingMessages(options);

    // Set initial message with timer
    button.innerHTML = `
        <span class="loading"></span>
        <span class="loading-text">${messages[0]}</span>
        <span class="loading-timer">0s</span>
    `;

    // Add pulsing class
    button.classList.add('loading-active');

    // Update timer every second
    loadingTimerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const timerSpan = button.querySelector('.loading-timer');
        if (timerSpan) {
            timerSpan.textContent = formatElapsedTime(elapsed);
        }
    }, 1000);

    // Rotate messages every 2.5 seconds
    loadingMessageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        const textSpan = button.querySelector('.loading-text');
        if (textSpan) {
            // Fade out
            textSpan.style.opacity = '0';

            setTimeout(() => {
                textSpan.textContent = messages[messageIndex];
                // Fade in
                textSpan.style.opacity = '1';
            }, 200);
        }
    }, 2500);
}

function stopLoadingAnimation(button) {
    if (loadingMessageInterval) {
        clearInterval(loadingMessageInterval);
        loadingMessageInterval = null;
    }

    if (loadingTimerInterval) {
        clearInterval(loadingTimerInterval);
        loadingTimerInterval = null;
    }

    // Remove pulsing class
    if (button) {
        button.classList.remove('loading-active');
    }

    startTime = null;
}

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const rawDomain = domainInput.value.trim();

    // Validate domain
    const validation = validateDomain(rawDomain);

    if (!validation.valid) {
        updateValidationUI(validation, false);
        return;
    }

    // Use cleaned domain
    const domain = validation.cleaned || rawDomain;

    if (!domain) {
        updateValidationUI({
            valid: false,
            message: 'Please enter a domain name',
            cleaned: ''
        }, false);
        return;
    }

    const turnstileToken = getTurnstileToken();
    if (!turnstileToken) {
        showToast('Please complete the Turnstile verification', 'warning', 5000);
        return;
    }

    // Get form options
    const options = getFormOptions();

    // Update URL with domain parameter
    const url = new URL(window.location);
    url.searchParams.set('domain', domain);
    window.history.pushState({}, '', url);

    // Show loading state with animated messages
    const analyzeBtn = form.querySelector('.analyze-btn');
    const originalText = analyzeBtn.innerHTML;
    analyzeBtn.disabled = true;
    startLoadingAnimation(analyzeBtn, options);

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
        showToast(error?.message || 'Request failed. Please try again.', 'error', 6000);
    } finally {
        // Stop loading animation
        stopLoadingAnimation(analyzeBtn);

        // Reset Turnstile after every API call to generate new token
        if (window.turnstile && typeof window.turnstile.reset === 'function') {
            window.turnstile.reset();
        }
        analyzeBtn.innerHTML = originalText;
        analyzeBtn.disabled = false;
    }
});

// Display results
function displayResults(data) {
    // Store the complete API response for JSON export
    currentApiResponse = data;

    const { domain, lookupResult, propagationResults } = data;
    const { records, enrichment } = lookupResult;

    let html = `
        <div class="results-card">
            <div class="results-header">
                <div class="results-header-left">
                    <h2 class="results-title">Analysis Results</h2>
                </div>
                <div class="results-header-right">
                    <button class="json-action-btn" id="copyJsonBtn">
                        <span>📋</span>
                        <span>Copy JSON</span>
                    </button>
                    <button class="json-action-btn" id="downloadJsonBtn">
                        <span>💾</span>
                        <span>Download JSON</span>
                    </button>
                    <div class="domain-badge">${domain}</div>
                </div>
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
        calendarBtn.addEventListener('click', function () {
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

    // Add event listeners for JSON export buttons
    const copyJsonBtn = document.getElementById('copyJsonBtn');
    const downloadJsonBtn = document.getElementById('downloadJsonBtn');

    if (copyJsonBtn) {
        copyJsonBtn.addEventListener('click', copyJsonToClipboard);
    }

    if (downloadJsonBtn) {
        downloadJsonBtn.addEventListener('click', downloadJsonFile);
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

// Copy JSON to clipboard
function copyJsonToClipboard() {
    if (!currentApiResponse) {
        showToast('No analysis data available to copy', 'warning', 4000);
        return;
    }

    const jsonString = JSON.stringify(currentApiResponse, null, 2);

    navigator.clipboard.writeText(jsonString).then(() => {
        // Visual feedback
        const btn = document.getElementById('copyJsonBtn');
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<span>✓</span><span>Copied!</span>';
        btn.style.background = 'var(--color-success)';
        btn.style.borderColor = 'var(--color-success)';
        btn.style.color = 'var(--color-bg)';

        showToast('JSON data copied to clipboard successfully', 'success', 3000);

        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.style.color = '';
        }, 2000);
    }).catch(err => {
        showToast('Failed to copy to clipboard. Please try again.', 'error', 5000);
        console.error('Clipboard error:', err);
    });
}

// Download JSON file
function downloadJsonFile() {
    if (!currentApiResponse) {
        showToast('No analysis data available to download', 'warning', 4000);
        return;
    }

    const jsonString = JSON.stringify(currentApiResponse, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);

    // Generate filename with domain and timestamp
    const domain = currentApiResponse.domain || 'unknown';
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `dns-analysis-${domain.replace(/[^a-z0-9]/gi, '-')}-${timestamp}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);

    showToast('JSON file downloaded successfully', 'success', 3000);

    // Visual feedback
    const btn = document.getElementById('downloadJsonBtn');
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<span>✓</span><span>Downloaded!</span>';
    btn.style.background = 'var(--color-success)';
    btn.style.borderColor = 'var(--color-success)';
    btn.style.color = 'var(--color-bg)';

    setTimeout(() => {
        btn.innerHTML = originalContent;
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.style.color = '';
    }, 2000);
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

        // Trigger validation
        const validation = validateDomain(domainParam.trim());
        updateValidationUI(validation, true);
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
