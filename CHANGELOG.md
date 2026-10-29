# Changelog

## [Unreleased]

- Preserve requested hostnames and support URL, port, IDN and DNS service-label input.
- Display CNAME/PTR, all TXT records, reverse hostnames and documented DKIM status.
- Keep shared lookup targets current and wait for Turnstile verification before automatic lookup.
- Validate security scores and stored history; keep successful results when storage is unavailable.
- Correct zero-day certificate expiry and calendar reminder dates.
- Fail builds with missing configuration, safely inject endpoint values and exclude development files.
- Align MCP request timeout with the frontend and preserve explicit zero retry settings.
- Add reproducible dependency locks and browser, build and MCP regression checks.

## [1.0.0] - 2025-12-22

Initial release of DNS Intelligence tool.

### Features
- DNS record lookup (A, AAAA, MX, NS, TXT, CNAME)
- Email security analysis (SPF, DMARC, DKIM)
- SSL/TLS certificate inspection
- DNS propagation checking
- Reverse DNS lookup
- Local search history (privacy-first)
- Advanced options panel
- SSL certificate calendar reminders (.ics download)
- URL parameter support (`?domain=example.com`)
- Mobile-responsive design
- Accessibility features (ARIA, semantic HTML)
- SEO optimized

### Tech
- Pure HTML/CSS/JavaScript
- No build process
- No dependencies (except Google Fonts)
- Deployed on CDN

---

For releases, see [GitHub Releases](https://github.com/yourusername/dns-intelligence/releases).
