# DNS Intelligence - Security Analyzer

A privacy-first DNS lookup tool with advanced security analysis, email security checking, SSL/TLS inspection, and DNS propagation monitoring.

**Live Demo**: [lookup.echovalue.dev](https://lookup.echovalue.dev)

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- 🔍 **DNS Lookup** - A, AAAA, MX, NS, TXT, CNAME records
- 🌍 **Propagation Check** - Global DNS server monitoring
- 📧 **Email Security** - SPF, DMARC, DKIM validation
- 🔐 **SSL/TLS Inspection** - Certificate analysis with expiration alerts
- 🔒 **Privacy First** - All processing in your browser, no tracking
- 📅 **Calendar Reminders** - SSL certificate renewal notifications
- 🕒 **Search History** - Local storage only

## Tech Stack

Pure static HTML/CSS/JavaScript:
- Optional build step for environment variable injection
- No framework dependencies
- Vanilla JavaScript (ES6+)
- IBM Plex Sans & JetBrains Mono fonts

## Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/njoylab/lookup.echovalue.dev
cd dns-intelligence

# Serve locally (choose one):
python -m http.server 8000
npx serve .
php -S localhost:8000

# Visit http://localhost:8000
```

### Pages Build (Turnstile Key)

Set a build command to inject the Turnstile site key at build time.

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
TURNSTILE_SITE_KEY=0x4AAAAAACIBHDOiy9i84iTV
```

Optional API endpoint override:
```
DNS_API_ENDPOINT=https://dnstool-api.echovalue.dev/
```

### Generate Images (Optional)

```bash
npm install
npm run generate-images
```

This creates:
- `og-image.png` (1200x630px for social sharing)
- All favicon sizes (16x16, 32x32, 180x180, etc.)

## Privacy

- ✅ All processing happens in your browser
- ✅ No server-side data collection
- ✅ Search history stored locally only (LocalStorage)
- ✅ No tracking or analytics
- ✅ No cookies

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
