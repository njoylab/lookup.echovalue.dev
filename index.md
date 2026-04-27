# DNS Intelligence

DNS lookup, security analysis, email-authentication checks, SSL inspection, and propagation monitoring for domains and IP addresses.

## What This Site Does

- Queries major DNS record types including `A`, `AAAA`, `MX`, `TXT`, `NS`, and `CNAME`.
- Optionally checks global propagation across major public resolvers.
- Parses SPF, DMARC, and DKIM data for email-security findings.
- Inspects TLS certificates for issuer, SANs, validity, and expiry risk.
- Stores recent searches locally in the browser.

## Main Actions

### Analyze a target

Enter a domain or IP address, then configure any of these options:

- Record types
- Propagation check
- Reverse DNS
- DNS enrichment
- TLS/SSL inspection
- Timeout, retries, and retry delay

### Review results

The rendered results include:

- Warnings and recommendations
- Email-security analysis
- DNS record sections
- SSL certificate details
- Propagation data when requested

## Agent Access

- MCP server card: [/.well-known/mcp/server-card.json](https://lookup.echovalue.dev/.well-known/mcp/server-card.json)
- Agent skills index: [/.well-known/agent-skills/index.json](https://lookup.echovalue.dev/.well-known/agent-skills/index.json)

## External Integrations

- Apify MCP endpoint: [https://mcp.apify.com/?tools=njoylab/apify-dns](https://mcp.apify.com/?tools=njoylab/apify-dns)
