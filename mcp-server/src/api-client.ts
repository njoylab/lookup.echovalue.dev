import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_ENDPOINT = process.env.DNS_API_ENDPOINT || 'https://api.lookup.echovalue.dev/dns-query';
const API_KEY = process.env.DNS_API_KEY;

if (!API_KEY) {
    console.warn('WARNING: DNS_API_KEY is not set. Requests may fail if the API requires authentication.');
}

export interface DnsLookupOptions {
    domains: string[];
    recordTypes?: string[];
    checkPropagation?: boolean;
    performReverseLookup?: boolean;
    enableEnrichment?: boolean;
    enableSslInspection?: boolean;
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
}

export class DnsApiClient {
    private apiKey: string;
    private endpoint: string;

    constructor() {
        this.apiKey = API_KEY || '';
        this.endpoint = API_ENDPOINT;
    }

    async lookup(options: DnsLookupOptions): Promise<any> {
        const payload = {
            domains: options.domains,
            recordTypes: options.recordTypes || ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME'],
            checkPropagation: options.checkPropagation || false,
            performReverseLookup: options.performReverseLookup || false,
            enableEnrichment: options.enableEnrichment || false,
            enableSslInspection: options.enableSslInspection || false,
            timeout: options.timeout || 5000,
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,
            includeMetadata: true
        };

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            if (this.apiKey) {
                headers['X-API-Key'] = this.apiKey;
            }

            const response = await axios.post(this.endpoint, payload, {
                headers,
                timeout: (options.timeout || 5000) + 2000 // Add buffer
            });

            return response.data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.error || error.message;
                throw new Error(`DNS API Error: ${message}`);
            }
            throw error;
        }
    }
}
