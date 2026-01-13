import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { DnsApiClient } from './api-client.js';

const apiClient = new DnsApiClient();

const server = new Server(
    {
        name: 'dns-intelligence-server',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Tool Definitions
const DnsLookupSchema = z.object({
    domain: z.string().describe('The domain name to look up'),
    record_types: z.array(z.string()).optional().describe('List of DNS record types to query (A, AAAA, MX, etc.)'),
    enrichment: z.boolean().optional().describe('Enable security enrichment (SPF, DMARC analysis)'),
});

const PropagationSchema = z.object({
    domain: z.string().describe('The domain name to check propagation for'),
});

const SslSchema = z.object({
    domain: z.string().describe('The domain name to inspect SSL certificate for'),
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'dns_lookup',
                description: 'Perform comprehensive DNS lookups with optional security analysis',
                inputSchema: {
                    type: 'object',
                    properties: {
                        domain: { type: 'string', description: 'The domain to query' },
                        record_types: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Record types: A, AAAA, MX, NS, TXT, CNAME'
                        },
                        enrichment: { type: 'boolean', description: 'Enable security analysis (SPF/DMARC)' }
                    },
                    required: ['domain']
                },
            },
            {
                name: 'dns_propagation',
                description: 'Check global DNS propagation status',
                inputSchema: {
                    type: 'object',
                    properties: {
                        domain: { type: 'string', description: 'The domain to check' }
                    },
                    required: ['domain']
                },
            },
            {
                name: 'ssl_inspection',
                description: 'Inspect SSL/TLS certificate details and validity',
                inputSchema: {
                    type: 'object',
                    properties: {
                        domain: { type: 'string', description: 'The domain to inspect' }
                    },
                    required: ['domain']
                },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        if (request.params.name === 'dns_lookup') {
            const args = DnsLookupSchema.parse(request.params.arguments);
            const result = await apiClient.lookup({
                domains: [args.domain],
                recordTypes: args.record_types,
                enableEnrichment: args.enrichment
            });
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        }

        if (request.params.name === 'dns_propagation') {
            const args = PropagationSchema.parse(request.params.arguments);
            const result = await apiClient.lookup({
                domains: [args.domain],
                checkPropagation: true,
                recordTypes: ['A'] // Propagation usually checks A records by default
            });
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        }

        if (request.params.name === 'ssl_inspection') {
            const args = SslSchema.parse(request.params.arguments);
            const result = await apiClient.lookup({
                domains: [args.domain],
                enableSslInspection: true,
                recordTypes: [] // Only need SSL
            });
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        }

        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${error.message}`);
        }
        return {
            content: [{ type: 'text', text: `Error: ${error.message}` }],
            isError: true,
        };
    }
});

async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('DNS Intelligence MCP Server running on stdio');
}

runServer().catch((error) => {
    console.error('Fatal error running server:', error);
    process.exit(1);
});
