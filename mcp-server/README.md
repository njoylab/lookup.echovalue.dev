# DNS Intelligence MCP Server

An MCP server implementation for [DNS Intelligence & Security Analyzer](https://lookup.echovalue.dev).
This server exposes advanced DNS lookup, propagation checking, and SSL inspection capabilities to AI agents.

## Features

-   **`dns_lookup`**: Comprehensive DNS resolution with optional security enrichment (SPF, DMARC, DKIM analysis).
-   **`dns_propagation`**: Check global DNS propagation status.
-   **`ssl_inspection`**: Inspect SSL/TLS certificate details and validity.

## Installation

```bash
cd mcp-server
npm install
npm run build
```

## Configuration

You need a generic DNS API endpoint Key (e.g. from Apify or RapidAPI) to bypass Turnstile protection.

Create a `.env` file in the `mcp-server` directory:

```env
DNS_API_ENDPOINT=https://api.lookup.echovalue.dev/dns-query
DNS_API_KEY=your_api_key_here
```

## Usage with MCP Client (e.g., Claude Desktop, Cursor)

Add the server to your MCP configuration:

```json
{
  "mcpServers": {
    "dns-intelligence": {
      "command": "node",
      "args": ["/path/to/repo/mcp-server/dist/index.js"],
      "env": {
        "DNS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Tools

### `dns_lookup`
Get DNS records for a domain.
```json
{
  "domain": "google.com",
  "record_types": ["A", "MX"],
  "enrichment": true
}
```

### `dns_propagation`
Check if DNS changes have propagated globally.
```json
{
  "domain": "example.com"
}
```

### `ssl_inspection`
Get SSL certificate details.
```json
{
  "domain": "secure.example.com"
}
```
