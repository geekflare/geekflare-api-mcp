#!/usr/bin/env node
import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import http from 'http';
import { randomUUID } from 'crypto';

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

// ─── MCP Server factory ───────────────────────────────────────────────────────

function createMcpServer(apiKey: string, baseUrl: string = DEFAULT_BASE_URL): Server {
  const httpClient = axios.create({
    baseURL: baseUrl.replace(/\/$/, ''),
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    // Long-running tools (lighthouse, brokenLink, openPorts) can take a while
    timeout: 120_000,
  });

  const server = new Server(
    { name: '@geekflare/mcp', version: '0.3.1' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const route = ROUTES[name];

    if (!route) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }

    try {
      const res = await httpClient.post(route, args ?? {});
      return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error(
          JSON.stringify({
            tool: name,
            status: err.response?.status,
            message: err.message,
          })
        );
        const msg = JSON.stringify(err.response?.data ?? err.message);
        return {
          content: [{ type: 'text', text: `API Error: ${msg}` }],
          isError: true,
        };
      }
      console.error(err);
      return {
        content: [{ type: 'text', text: `Error: ${String(err)}` }],
        isError: true,
      };
    }
  });

  return server;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Read the full request body as a string. */
function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** Set CORS + common headers. Handles pre-flight OPTIONS. Returns true if caller should stop. */
function setCorsHeaders(req: http.IncomingMessage, res: http.ServerResponse): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, mcp-session-id, x-api-key'
  );
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }
  return false;
}

// ─── Session store ────────────────────────────────────────────────────────────

interface Session {
  transport: StreamableHTTPServerTransport;
  server: Server;
  lastSeen: number;
}

const sessions = new Map<string, Session>();

/** Remove sessions idle for more than 30 minutes. */
function pruneSessions() {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, session] of sessions) {
    if (session.lastSeen < cutoff) {
      session.transport.close().catch(() => {});
      sessions.delete(id);
      console.log(`[session] pruned ${id}`);
    }
  }
}

setInterval(pruneSessions, 5 * 60 * 1000).unref();

// ─── HTTP mode ────────────────────────────────────────────────────────────────

const MODE = process.env.MCP_TRANSPORT ?? 'stdio';

if (MODE === 'http') {
  const PORT = parseInt(process.env.PORT ?? '3000', 10);
  const BASE_URL = (process.env.API_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '');

  const httpServer = http.createServer(async (req, res) => {
    // Handle CORS pre-flight first
    if (setCorsHeaders(req, res)) return;

    const rawUrl = req.url ?? '/';
    const url = new URL(rawUrl, `http://localhost:${PORT}`);

    // ── /health ──────────────────────────────────────────────────────────────
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'ok',
          service: '@geekflare/mcp',
          version: '0.3.1',
          uptime: process.uptime(),
          sessions: sessions.size,
        })
      );
      return;
    }

    // ── /{API_KEY}/mcp ────────────────────────────────────────────────────────
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

    // ── DELETE  →  terminate session ─────────────────────────────────────────
    if (req.method === 'DELETE') {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
        await session.transport.close().catch(() => {});
        sessions.delete(sessionId);
        console.log(`[session] deleted ${sessionId}`);
      }
      res.writeHead(204);
      res.end();
      return;
    }

    // ── GET  →  SSE stream (re-attach or info) ────────────────────────────────
    if (req.method === 'GET') {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;

      if (sessionId && sessions.has(sessionId)) {
        // Re-attach to an existing session's SSE stream
        const session = sessions.get(sessionId)!;
        session.lastSeen = Date.now();
        await session.transport.handleRequest(req, res);
        return;
      }

      // No session yet — return a friendly discovery response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          name: '@geekflare/mcp',
          version: '0.3.1',
          protocol: 'MCP Streamable HTTP',
          usage: 'POST /{API_KEY}/mcp to start a session',
        })
      );
      return;
    }

    // ── POST  →  main MCP messages ────────────────────────────────────────────
    if (req.method === 'POST') {
      let body: string;
      try {
        body = await readBody(req);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to read request body' }));
        return;
      }

      let parsedBody: unknown;
      try {
        parsedBody = body.trim() ? JSON.parse(body) : {};
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON in request body' }));
        return;
      }

      // Check for an existing session
      const incomingSessionId = req.headers['mcp-session-id'] as string | undefined;

      if (incomingSessionId && sessions.has(incomingSessionId)) {
        // Route to existing session
        const session = sessions.get(incomingSessionId)!;
        session.lastSeen = Date.now();
        await session.transport.handleRequest(req, res, parsedBody);
        return;
      }

      // New session
      const sessionId = randomUUID();
      console.log(`[session] created ${sessionId}`);

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
      });

      const server = createMcpServer(apiKey, BASE_URL);
      await server.connect(transport);

      const session: Session = { transport, server, lastSeen: Date.now() };
      sessions.set(sessionId, session);

      // Clean up when the transport closes
      transport.onclose = () => {
        sessions.delete(sessionId);
        console.log(`[session] closed ${sessionId}`);
      };

      await transport.handleRequest(req, res, parsedBody);
      return;
    }

    // ── Unsupported method ────────────────────────────────────────────────────
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  });

  httpServer.on('error', (err) => {
    console.error('[server] error:', err);
  });

  httpServer.listen(PORT, () => {
    console.log('=================================');
    console.log('Geekflare MCP Server Started');
    console.log(`Port:    ${PORT}`);
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Mode:    ${MODE}`);
    console.log(`Health:  http://localhost:${PORT}/health`);
    console.log(`MCP:     http://localhost:${PORT}/{API_KEY}/mcp`);
    console.log('=================================');
  });
} else {
  // ── stdio mode ──────────────────────────────────────────────────────────────
  const apiKey = process.env.API_KEY ?? '';
  const baseUrl = process.env.API_BASE_URL ?? DEFAULT_BASE_URL;
  const server = createMcpServer(apiKey, baseUrl);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
