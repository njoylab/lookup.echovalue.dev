# echoValue lookup - DNS Security Analyzer

A privacy-first DNS lookup tool with advanced security analysis, email security checking, SSL/TLS inspection, and DNS propagation monitoring.

**Live Demo**: [lookup.echovalue.dev](https://lookup.echovalue.dev)

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## MCP

Use the DNS tool as an MCP endpoint via Apify:
[mcp.apify.com/?tools=njoylab/apify-dns](https://mcp.apify.com/?tools=njoylab/apify-dns)

## API Documentation

- DNS lookup API: [docs.echovalue.dev/dns-lookup](https://docs.echovalue.dev/dns-lookup/)
- OpenAPI: [docs.echovalue.dev/openapi.yaml](https://docs.echovalue.dev/openapi.yaml)

## Features

- 🔍 **DNS Lookup** - A, AAAA, MX, NS, TXT, CNAME records
- 🌍 **Propagation Check** - Global DNS server monitoring
- 📧 **Email Security** - SPF, DMARC, DKIM validation
- 🔐 **SSL/TLS Inspection** - Certificate analysis with expiration alerts
- 🔒 **Privacy First** - Search history stays in your browser; analysis uses the backend API
- 📅 **Calendar Reminders** - SSL certificate renewal notifications
- 🕒 **Search History** - Local storage only

## Tech Stack

Pure static HTML/CSS/JavaScript:
- Required build step for public API and Turnstile configuration
- No framework dependencies
- Vanilla JavaScript (ES6+)
- Inter & JetBrains Mono fonts

## Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/njoylab/lookup.echovalue.dev
cd lookup.echovalue.dev

# Configure the API endpoint and a Turnstile site key valid for your hostname.
export DNS_API_ENDPOINT=https://api.lookup.echovalue.dev/dns-query
export TURNSTILE_SITE_KEY=your_public_site_key
npm run build

# Serve the generated site:
python3 -m http.server 8000 --directory dist

# Visit http://localhost:8000
```

### Pages Build

The build requires both the API endpoint and public Turnstile site key. Missing or invalid configuration fails before replacing `dist`. The unbuilt sources cannot perform lookups.

Build command:
```
npm run build
```

Output directory:
```
dist
```

Environment variable:
```
TURNSTILE_SITE_KEY=your_public_site_key
```

Required API endpoint:
```
DNS_API_ENDPOINT=https://<API_URL>
```


## Privacy

- Search history is stored locally in LocalStorage.
- Submitted domains/IPs and query options are sent to the configured backend for analysis.
- Cloudflare Turnstile provides bot verification; Google Fonts and jsDelivr serve external assets.
- This frontend includes no analytics or advertising trackers. Backend retention cannot be established from this repository.

## Verification

Requires Node.js 20 or newer. Playwright is a development dependency only.

```bash
npm ci
npx playwright install chromium
npm test

# Or use an installed Google Chrome:
PLAYWRIGHT_CHANNEL=chrome npm test

npm ci --prefix mcp-server
npm test --prefix mcp-server
```

Frontend tests build an isolated copy and exercise real browser flows with controlled API responses and Turnstile verification. They do not call the production API or bypass production verification. MCP tests use a local HTTP fixture, including a delayed response.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers

## License

MIT License - see [LICENSE](LICENSE) file

**Note:** Backend API is not part of this repository.

---

Built with ❤️ for the security community
