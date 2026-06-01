#!/usr/bin/env node
import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

const API_KEY = process.env.API_KEY ?? '';
const BASE_URL = (process.env.API_BASE_URL ?? 'https://api.geekflare.com').replace(/\/$/, '');

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
});

async function call(path: string, body: unknown) {
  const res = await client.post(path, body);
  return res.data;
}

const server = new Server(
  { name: '@geekflare/mcp', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'metaScrape',
      description: 'Scrape meta tags from a URL',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          device: { type: 'string', enum: ['desktop', 'mobile'], default: 'desktop' },
          renderJS: { type: 'boolean', default: true },
          format: { type: 'string', enum: ['markdown', 'json'], default: 'json' },
        },
        required: ['url'],
      },
    },
    {
      name: 'dnsRecord',
      description: 'Retrieve DNS records for a domain',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          types: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'SOA', 'TXT', 'CAA', 'SRV'],
            },
          },
        },
        required: ['url'],
      },
    },
    {
      name: 'screenshot',
      description: 'Capture a screenshot of a website',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          device: { type: 'string', enum: ['desktop', 'mobile'], default: 'desktop' },
          fullPage: { type: 'boolean', default: false },
          type: { type: 'string', enum: ['png', 'jpeg', 'webp'], default: 'png' },
        },
        required: ['url'],
      },
    },
    {
      name: 'siteStatus',
      description: 'Check if a site is up or down',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          followRedirect: { type: 'boolean', default: false },
        },
        required: ['url'],
      },
    },
    {
      name: 'redirectCheck',
      description: 'Check the redirect chain of a URL',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          proxyCountry: { type: 'string' },
        },
        required: ['url'],
      },
    },
    {
      name: 'brokenLink',
      description: 'Find broken links on a webpage',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          followRedirect: { type: 'boolean', default: false },
        },
        required: ['url'],
      },
    },
    {
      name: 'url2Pdf',
      description: 'Convert a URL to PDF',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          format: { type: 'string', enum: ['a4', 'letter', 'a3'], default: 'a4' },
          orientation: { type: 'string', enum: ['portrait', 'landscape'], default: 'portrait' },
        },
        required: ['url'],
      },
    },
    {
      name: 'openPorts',
      description: 'Scan open ports on a host',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          topPorts: { type: 'number', enum: [50, 100, 500, 1000, 5000] },
          portRanges: { type: 'string' },
        },
        required: ['url'],
      },
    },
    {
      name: 'tlsScan',
      description: 'Scan TLS/SSL configuration of a domain',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
        },
        required: ['url'],
      },
    },
    {
      name: 'loadTime',
      description: 'Measure page load time for a URL',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          followRedirect: { type: 'boolean', default: false },
          proxyCountry: { type: 'string' },
        },
        required: ['url'],
      },
    },
    {
      name: 'mixedContent',
      description: 'Check for mixed content issues on a site',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          followRedirect: { type: 'boolean', default: false },
        },
        required: ['url'],
      },
    },
    {
      name: 'dnsSec',
      description: 'Check if DNSSEC is enabled for a domain',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
        },
        required: ['url'],
      },
    },
    {
      name: 'mtr',
      description: 'Perform MTR network diagnostic test',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          proxyCountry: { type: 'string' },
        },
        required: ['url'],
      },
    },
    {
      name: 'ping',
      description: 'Ping a host',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL or IP' },
        },
        required: ['url'],
      },
    },
    {
      name: 'lighthouse',
      description: 'Run Lighthouse audit on a website',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          device: { type: 'string', enum: ['desktop', 'mobile'], default: 'desktop' },
        },
        required: ['url'],
      },
    },
    {
      name: 'search',
      description: 'Search the web and return clean results',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          limit: { type: 'number', default: 10 },
          source: { type: 'string', enum: ['web', 'news', 'images'], default: 'web' },
          format: { type: 'string', enum: ['json', 'markdown', 'html'], default: 'json' },
        },
        required: ['query'],
      },
    },
  ],
}));

const ROUTES: Record<string, string> = {
  metaScrape: '/metascraping',
  webScrape: '/webscraping',
  dnsRecord: '/dnsrecord',
  screenshot: '/screenshot',
  siteStatus: '/up',
  redirectCheck: '/redirectcheck',
  brokenLink: '/brokenlink',
  url2Pdf: '/url2pdf',
  openPorts: '/openport',
  tlsScan: '/tlsscan',
  ttfb: '/ttfb',
  loadTime: '/loadtime',
  httpHeader: '/httpheader',
  httpProtocol: '/httpprotocol',
  mixedContent: '/mixedcontent',
  dnsSec: '/dnssec',
  mtr: '/mtr',
  ping: '/ping',
  lighthouse: '/lighthouse',
  search: '/search',
};

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const route = ROUTES[name];

  if (!route) {
    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }

  try {
    const data = await call(route, args);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const msg = JSON.stringify(err.response?.data ?? err.message);
      return { content: [{ type: 'text', text: `API Error: ${msg}` }], isError: true };
    }
    return { content: [{ type: 'text', text: `Error: ${String(err)}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
