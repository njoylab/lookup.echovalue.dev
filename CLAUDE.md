# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **static frontend-only application** for DNS intelligence and security analysis. The backend API is proprietary and not included in this repository. The application is designed for deployment on CDN platforms (Cloudflare Pages, Vercel, Netlify).

**Tech Stack:**
- Pure HTML5, CSS3, vanilla JavaScript (ES6+)
- No build process, no bundler, no framework
- Google Fonts (IBM Plex Sans, JetBrains Mono)

## Development Commands

### Local Development
```bash
# Serve locally (choose one):
python -m http.server 8000
# or
npx serve .
# or
php -S localhost:8000

# Visit http://localhost:8000
```

### Image Generation
```bash
# Install dependencies (only needed for image generation)
npm install

# Generate OG image and all favicon sizes
npm run generate-images
```

### Deployment
```bash
# No build needed! Deploy static files directly.

# Example with Vercel:
vercel --prod

# Example with Netlify:
netlify deploy --prod
```

## Architecture

### File Organization
- **`index.html`** - Single page application, all HTML markup
- **`styles.css`** - Complete styling, uses CSS variables for theming
- **`script.js`** - All application logic, contains mock data

### Key Architectural Patterns

**Single Responsibility Files:**
- HTML: Structure only (semantic HTML5, ARIA labels)
- CSS: All styles in one file using CSS variables
- JS: All logic in one file (no modules, no bundling)

**State Management:**
- LocalStorage for search history (`dns-analyzer-history` key)
- URL parameters for shareable domain lookups (`?domain=example.com`)
- No global state objects - DOM is the source of truth

**Data Flow:**
1. User input → `form.addEventListener('submit')`
2. Extract form data → `getFormOptions()`
3. **Mock API call** (currently) → `MOCK_DATA[0]`
4. Render results → `displayResults(data)`
5. Save to history → `saveToHistory(domain, options)`

### Critical Constants in `script.js`

```javascript
MOCK_DATA[0]           // Mock API response structure
HISTORY_KEY            // LocalStorage key: 'dns-analyzer-history'
MAX_HISTORY_ITEMS      // History limit: 20 items
```

### API Integration Point

**Location:** `script.js` around line 376 in form submission handler

**To integrate real API:**
```javascript
// Replace MOCK_DATA usage with:
const response = await fetch('YOUR_API_ENDPOINT', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain, options })
});
const data = await response.json();
```

**Expected API Response Format:**
See `MOCK_DATA` structure in `script.js` for complete schema:
```javascript
{
  domain: "example.com",
  lookupResult: {
    records: { A, AAAA, MX, NS, TXT, CNAME },
    enrichment: { emailSecurity, ssl, ttlAnalysis }
  },
  propagationResults: [ /* server checks */ ]
}
```

## Privacy & Data Handling

**Client-Side Only:**
- All processing happens in browser
- No cookies (only localStorage)
- No external tracking/analytics
- Search history never sent to servers

**LocalStorage Schema:**
```javascript
localStorage['dns-analyzer-history'] = [
  {
    domain: "example.com",
    options: { recordTypes, checkPropagation, ... },
    timestamp: "2025-12-22T..."
  }
]
```

## UI/UX Patterns

### Component Structure in HTML
```
.analyzer-card
  ├── .card-header (status indicator)
  ├── .analyzer-form
  │   ├── .input-group (domain input + analyze button)
  │   ├── .advanced-toggle-wrapper (advanced + history buttons)
  │   ├── .history-panel (collapsible)
  │   └── .advanced-options (collapsible)
  └── .results-container (dynamically populated)
```

### Collapsible Panels Pattern
- Toggle class: `.active` on both button and panel
- CSS handles max-height transition
- JavaScript only toggles class

### Results Rendering Functions
- `displayResults(data)` - Main orchestrator
- `renderEmailSecurity(enrichment)` - Email analysis section
- `renderDNSRecords(records)` - All DNS record types
- `renderSSLCertificate(enrichment)` - SSL certificate info
- `renderPropagation(propagationResults)` - Propagation status

## Styling System

**CSS Variables (in `:root`):**
```css
--color-bg: #0a0e1a          /* Main background */
--color-accent: #f59e0b       /* Primary accent (orange) */
--color-text-primary: #e8eaed /* Main text */
--font-sans: 'IBM Plex Sans'
--font-mono: 'JetBrains Mono'
```

**Design Philosophy:**
- Dark theme only (no toggle)
- Mobile-first responsive
- Accessibility first (ARIA labels, semantic HTML)
- Monospace fonts for technical data
- Smooth transitions (0.3s ease)

## SEO & Meta

**Update these before deployment:**
1. `index.html` - Canonical URLs (search for `dnstool.echovalue.dev`)
2. `sitemap.xml` - Domain URLs
3. All Open Graph tags - Update domain and image paths

**Generate images before deployment:**
- Run `npm run generate-images` to create:
  - `og-image.png` (1200x630px for social sharing)
  - All favicon sizes (16x16, 32x32, 180x180, etc.)
  - `favicon.svg` already exists (works in modern browsers)

## Scope of Contributions

**✅ Frontend contributions welcome:**
- UI/UX improvements
- Accessibility enhancements
- Mobile responsiveness
- Frontend features (visualization, interaction)
- Documentation
- Browser compatibility

**❌ Out of scope (backend is proprietary):**
- API changes
- Server-side logic
- Database modifications
- Authentication/authorization

## Common Workflows

### Adding a New Results Section

1. Add rendering function in `script.js`:
```javascript
function renderNewSection(data) {
    return `
        <div class="results-section">
            <h3 class="section-title">...</h3>
            <div class="data-grid">...</div>
        </div>
    `;
}
```

2. Call from `displayResults()`:
```javascript
html += renderNewSection(lookupResult.newData);
```

3. Style in `styles.css` using existing patterns (`.data-grid`, `.data-item`)

### Adding Form Options

1. Add HTML input in `.advanced-options` grid
2. Update `getFormOptions()` to extract value
3. Value will be included in `options` object
4. Backend will receive in API call

### Modifying History

Functions in `script.js`:
- `saveToHistory(domain, options)` - Add entry
- `getHistory()` - Retrieve all
- `deleteHistoryItem(domain)` - Remove one
- `clearHistory()` - Remove all
- `renderHistory()` - Update UI

## Testing Checklist

Before deployment:
- [ ] Test in Chrome, Firefox, Safari
- [ ] Test on mobile (iOS Safari, Chrome Mobile)
- [ ] Test with JavaScript disabled (graceful degradation)
- [ ] Check console for errors
- [ ] Verify responsive design (resize browser)
- [ ] Test history save/load/delete
- [ ] Test URL parameter (`?domain=example.com`)
- [ ] Test calendar download (.ics file)
- [ ] Run through accessibility checker
- [ ] Validate HTML/CSS (W3C validators)

## Documentation References

- **README.md** - Project overview and quick start
- **CHANGELOG.md** - Version history
- **IMAGE-GENERATION-GUIDE.md** - How to generate images
