#!/usr/bin/env node
import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import http from 'http';

const DEFAULT_BASE_URL = 'https://api.geekflare.com';

const TOOLS = [
  {
    name: 'webScrape',
    description: 'Scrape a webpage with custom options',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Target URL' },
        device: { type: 'string', enum: ['desktop', 'mobile'], default: 'desktop' },
        format: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['html', 'markdown', 'json', 'markdown-llm', 'html-llm', 'text', 'text-llm'],
          },
          default: ['markdown'],
          description: 'Output format(s). Up to 3.',
        },
        proxyCountry: { type: 'string', description: 'Country code for proxy routing' },
        renderJS: {
          type: 'boolean',
          default: true,
          description: 'Execute JavaScript before extracting',
        },
        fileOutput: {
          type: 'boolean',
          default: false,
          description: 'Return a download URL instead of inline data',
        },
        blockAds: { type: 'boolean', default: true },
        stealth: { type: 'boolean', default: false, description: 'Bypass CAPTCHAs (slower)' },
      },
      required: ['url'],
    },
  },
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
        proxyCountry: { type: 'string', description: 'Country code for proxy routing' },
        fileOutput: { type: 'boolean', default: false },
        blockAds: { type: 'boolean', default: true },
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
        type: { type: 'string', enum: ['png', 'jpeg', 'webp'], default: 'png' },
        proxyCountry: { type: 'string', description: 'Country code for proxy routing' },
        fullPage: { type: 'boolean', default: false },
        blockAds: { type: 'boolean', default: true },
        hideCookie: { type: 'boolean', default: true, description: 'Hide cookie consent banners' },
        skipCaptcha: { type: 'boolean', default: true },
        addTimestamp: { type: 'boolean', default: false },
        highlightLinks: {
          type: 'boolean',
          default: false,
          description: 'Draw borders around links (useful for AI vision)',
        },
        pageHeight: { type: 'number', description: 'Height of page for partial screenshot' },
        viewportWidth: { type: 'number', description: 'Viewport width' },
        viewportHeight: { type: 'number', description: 'Viewport height' },
        delay: { type: 'number', description: 'Seconds to wait before screenshot' },
        quality: { type: 'number', default: 90, description: 'Image quality for JPEG/WEBP' },
        scaleFactor: { type: 'number', description: 'Device pixel ratio' },
      },
      required: ['url'],
    },
  },
  {
    name: 'search',
    description: 'Search the web and return clean results in JSON, Markdown, or HTML',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', default: 10, description: 'Number of results' },
        time: { type: 'string', description: 'Time filter: any, d, w, m, y, d7, h6 etc.' },
        location: { type: 'string', description: 'Country code (ISO alpha-2)' },
        source: { type: 'string', enum: ['web', 'news', 'images'], default: 'web' },
        category: { type: 'string', enum: ['general', 'code', 'research'], default: 'general' },
        format: { type: 'string', enum: ['json', 'markdown', 'html'], default: 'json' },
        includeDomains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Only include these domains',
        },
        excludeDomains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Exclude these domains',
        },
        groundedAnswer: {
          type: 'boolean',
          default: false,
          description: 'Generate AI-grounded answer from results',
        },
        scrape: { type: 'boolean', default: false, description: 'Scrape content from result URLs' },
        scrapeLimit: { type: 'number', default: 3, description: 'Number of URLs to scrape' },
      },
      required: ['query'],
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
          default: ['A', 'AAAA', 'CNAME', 'MX', 'CAA', 'NS', 'SOA', 'SRV', 'TXT'],
        },
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
        proxyCountry: { type: 'string', description: 'Country code for proxy routing' },
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
        proxyCountry: { type: 'string', description: 'Country code for proxy routing' },
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
        proxyCountry: { type: 'string', description: 'Country code for proxy routing' },
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
        device: { type: 'string', enum: ['desktop', 'mobile'], default: 'desktop' },
        format: {
          type: 'string',
          enum: ['letter', 'legal', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6'],
          default: 'a4',
        },
        orientation: { type: 'string', enum: ['portrait', 'landscape'], default: 'portrait' },
        proxyCountry: { type: 'string', description: 'Country code for proxy routing' },
        scale: { type: 'number', description: 'Zoom level (0–2)' },
        margin: {
          type: 'object',
          properties: {
            top: { type: 'number' },
            bottom: { type: 'number' },
            left: { type: 'number' },
            right: { type: 'number' },
          },
        },
        hideCookie: { type: 'boolean', default: true },
        skipCaptcha: { type: 'boolean', default: true },
        addTimestamp: { type: 'boolean', default: false },
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
        topPorts: {
          type: 'number',
          enum: [50, 100, 500, 1000, 5000],
          description: 'Scan top N ports',
        },
        portRanges: { type: 'string', description: 'Custom port ranges e.g. 80,443,1000-1010' },
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
        proxyCountry: { type: 'string', description: 'Country code for proxy routing' },
        followRedirect: { type: 'boolean', default: false },
      },
      required: ['url'],
    },
  },
  {
    name: 'ttfb',
    description: 'Measure Time To First Byte (TTFB) for a URL',
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
    name: 'httpHeader',
    description: 'Fetch HTTP response headers for a URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Target URL' },
        proxyCountry: { type: 'string', description: 'Country code for proxy routing' },
        followRedirect: { type: 'boolean', default: false },
      },
      required: ['url'],
    },
  },
  {
    name: 'httpProtocol',
    description: 'Detect HTTP protocol versions supported by a URL',
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
    name: 'mixedContent',
    description: 'Check for mixed content issues on a site',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Target URL' },
        proxyCountry: { type: 'string', description: 'Country code for proxy routing' },
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
        proxyCountry: { type: 'string', description: 'Country code for proxy routing' },
        followRedirect: { type: 'boolean', default: false },
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
        proxyCountry: { type: 'string', description: 'Country code for proxy routing' },
        followRedirect: { type: 'boolean', default: false },
        parameters: {
          type: 'array',
          items: { type: 'string' },
          description: 'Extra Lighthouse CLI parameters',
        },
      },
      required: ['url'],
    },
  },
];

const ROUTES: Record<string, string> = {
  webScrape: '/webscraping',
  metaScrape: '/metascraping',
  screenshot: '/screenshot',
  search: '/search',
  dnsRecord: '/dnsrecord',
  siteStatus: '/up',
  redirectCheck: '/redirectcheck',
  brokenLink: '/brokenlink',
  url2Pdf: '/url2pdf',
  openPorts: '/openport',
  tlsScan: '/tlsscan',
  loadTime: '/loadtime',
  ttfb: '/ttfb',
  httpHeader: '/httpheader',
  httpProtocol: '/httpprotocol',
  mixedContent: '/mixedcontent',
  dnsSec: '/dnssec',
  mtr: '/mtr',
  ping: '/ping',
  lighthouse: '/lighthouse',
};

function createServer(apiKey: string, baseUrl: string = DEFAULT_BASE_URL) {
  const httpClient = axios.create({
    baseURL: baseUrl.replace(/\/$/, ''),
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
  });

  const server = new Server(
    { name: '@geekflare/mcp', version: '0.1.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const route = ROUTES[name];

    if (!route) {
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }

    try {
      const res = await httpClient.post(route, args);
      return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = JSON.stringify(err.response?.data ?? err.message);
        return { content: [{ type: 'text', text: `API Error: ${msg}` }], isError: true };
      }
      return { content: [{ type: 'text', text: `Error: ${String(err)}` }], isError: true };
    }
  });

  return server;
}

const MODE = process.env.MCP_TRANSPORT ?? 'stdio';

if (MODE === 'http') {
  const PORT = parseInt(process.env.PORT ?? '3000', 10);
  const BASE_URL = (process.env.API_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '');

  const httpServer = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
    const match = url.pathname.match(/^\/([^/]+)\/mcp\/?$/);

    if (!match) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found. Use /{API_KEY}/mcp' }));
      return;
    }

    const apiKey = match[1];

    if (!apiKey) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API key required' }));
      return;
    }

    const server = createServer(apiKey, BASE_URL);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    await server.connect(transport);

    const body: Buffer[] = [];
    req.on('data', (chunk: Buffer) => body.push(chunk));
    req.on('end', async () => {
      await transport.handleRequest(req, res, JSON.parse(Buffer.concat(body).toString()));
    });
  });

  httpServer.listen(PORT, () => {
    console.error(`Geekflare MCP server running at http://localhost:${PORT}/{API_KEY}/mcp`);
  });
} else {
  const apiKey = process.env.API_KEY ?? '';
  const baseUrl = process.env.API_BASE_URL ?? DEFAULT_BASE_URL;
  const server = createServer(apiKey, baseUrl);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
