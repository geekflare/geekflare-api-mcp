#!/usr/bin/env node
import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import http from 'http';
import { randomUUID } from 'crypto';
import {
  authenticateOAuthRequest,
  resolveApiKey,
  matchOAuthResource,
  matchMetadataResource,
  serveProtectedResourceMetadata,
  sendBridgeError,
} from './oauth-bridge.js';

const DEFAULT_BASE_URL = 'https://api.geekflare.com';

// ─── Global uncaught error handlers ──────────────────────────────────────────
// Prevents the process from dying on any unhandled rejection or exception.
// The server stays up; only the individual request/session fails.

process.on('uncaughtException', (err) => {
  console.error('[process] uncaughtException — server stays alive:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[process] unhandledRejection — server stays alive:', reason);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────

function setupGracefulShutdown(server: http.Server) {
  const shutdown = (signal: string) => {
    console.log(`[process] received ${signal}, shutting down gracefully…`);
    server.close(() => {
      console.log('[process] HTTP server closed');
      process.exit(0);
    });
    // Force-kill after 10 s if something is stuck
    setTimeout(() => {
      console.error('[process] forced exit after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

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
        proxyMode: {
          oneOf: [{ type: 'boolean' }, { type: 'string', enum: ['auto'] }],
          default: false,
          description:
            'false never uses a proxy (default), auto tries without a proxy first and retries through one if blocked, true always uses a proxy',
        },
        proxyCountry: {
          type: 'string',
          description:
            'Country code (ISO alpha-2) to route the request through a proxy in. Can be used on its own without proxyMode',
        },
        renderJS: {
          type: 'boolean',
          description:
            'Whether to render JavaScript. If omitted, resolved automatically: fetched without a browser first, then rendered only if the page needs it',
        },
        fileOutput: {
          type: 'boolean',
          default: false,
          description: 'Return a download URL instead of inline data',
        },
        blockAds: { type: 'boolean', default: true },
        stealth: { type: 'boolean', default: false, description: 'Bypass CAPTCHAs (slower)' },
        waitTime: {
          type: 'number',
          default: 0,
          description: 'Seconds to wait after page load before capturing content',
        },
        extractionMode: {
          type: 'string',
          enum: ['default', 'cssSchema', 'xpathSchema', 'template'],
          default: 'default',
          description:
            'JSON output is used automatically when an extraction mode is requested. Set to template to use a ready-made extraction template',
        },
        template: {
          type: 'string',
          enum: ['product', 'contact'],
          description:
            "Ready-made extraction template when extractionMode is 'template'. product extracts title/brand/pricing/availability/images/ratings; contact extracts company/locations/emails/phones/social profiles",
        },
        extractionSchema: {
          type: 'object',
          description:
            'Extraction schema for cssSchema/xpathSchema modes: { name, baseSelector?, fields: [{ name, selector, type, attribute?, fields? }] }, or a flat { name, fields: [{ title, value }] } for default mode',
        },
        aiPrompt: {
          type: 'object',
          description:
            "AI-powered extraction/analysis of the scraped page, always run against the Markdown regardless of format. Shape depends on 'type': prompt (query), schema (schema), listing (itemSchema, maxItems), summary (style, focus, maxLength), sentiment (aspects), keywords (maxKeywords, includeEntities). Adds +7 credits",
        },
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
        theme: {
          type: 'string',
          enum: ['light', 'dark', 'auto'],
          default: 'auto',
          description: 'Color scheme to render before capturing',
        },
        proxyCountry: { type: 'string', description: 'Country code for proxy routing' },
        selector: {
          type: 'string',
          description: 'CSS selector of the element to capture, instead of the full viewport/page',
        },
        fallbackToFullPage: {
          type: 'boolean',
          default: false,
          description:
            'If selector is not found, fall back to a full-page capture instead of failing',
        },
        fullPage: { type: 'boolean', default: false },
        blockAds: { type: 'boolean', default: true },
        hideCookie: { type: 'boolean', default: true, description: 'Hide cookie consent banners' },
        skipCaptcha: { type: 'boolean', default: true },
        removeBackground: {
          type: 'boolean',
          default: false,
          description: 'Remove page background for a transparent PNG (PNG only)',
        },
        disableAnimations: {
          type: 'boolean',
          default: false,
          description: 'Freeze CSS/JS animations and transitions before capturing',
        },
        addTimestamp: { type: 'boolean', default: false },
        highlightLinks: {
          type: 'boolean',
          default: false,
          description: 'Draw borders around links (useful for AI vision)',
        },
        pageHeight: {
          type: 'number',
          minimum: 100,
          maximum: 5000,
          description: 'Height of page for partial screenshot',
        },
        viewportWidth: {
          type: 'number',
          minimum: 320,
          maximum: 3840,
          description: 'Viewport width',
        },
        viewportHeight: {
          type: 'number',
          minimum: 240,
          maximum: 2160,
          description: 'Viewport height',
        },
        captureBeyondViewport: {
          type: 'boolean',
          description: 'Allow the capture to include content beyond the configured viewport',
        },
        delay: {
          type: 'number',
          minimum: 0,
          maximum: 10,
          description: 'Seconds to wait before screenshot',
        },
        quality: {
          type: 'number',
          default: 90,
          minimum: 10,
          maximum: 100,
          description: 'Image quality for JPEG/WEBP',
        },
        scaleFactor: {
          type: 'number',
          minimum: 0.1,
          maximum: 5,
          description: 'Device pixel ratio',
        },
        inline: {
          type: 'boolean',
          default: false,
          description: 'Return image data inline instead of a CDN URL',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'search',
    description:
      'Search the web and return clean results in JSON, Markdown, or HTML. Also supports scraping result pages, AI grounded answers, and the full Google results page (SERP) via serp: true',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', maxLength: 2048, description: 'Search query' },
        limit: {
          type: 'number',
          default: 10,
          minimum: 1,
          maximum: 100,
          description: 'Number of results',
        },
        time: {
          type: 'string',
          default: 'any',
          description: 'Time filter: any, h, d, w, m, y, or with a count like h2, h6, d7',
        },
        location: {
          type: 'string',
          default: 'us',
          description:
            'Country code (ISO alpha-2). When city is set, city takes priority over location',
        },
        city: {
          type: 'string',
          description:
            "City for localized results, using the name exactly as listed in the supported cities file, e.g. 'London,England,United Kingdom'. Works with standard search and serp: true. Supported cities: https://cdn.geekflare.com/api-assets/geotargets-2026-08-12.json",
        },
        device: {
          type: 'string',
          enum: ['desktop', 'mobile'],
          default: 'desktop',
          description: 'Device to emulate when searching',
        },
        source: {
          type: 'string',
          enum: ['web', 'news', 'images'],
          default: 'web',
          description: 'Search source. SERP mode accepts one source per request',
        },
        category: {
          type: 'string',
          enum: ['general', 'code', 'pdf', 'research', 'linkedin', 'wiki'],
          default: 'general',
          description: 'Category filter. Ignored in SERP mode',
        },
        format: {
          type: 'string',
          enum: ['json', 'markdown', 'html'],
          default: 'json',
          description: 'Output format. Ignored in SERP mode',
        },
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
          description: 'Generate AI-grounded answer from results. Ignored in SERP mode',
        },
        scrape: {
          type: 'boolean',
          default: false,
          description: 'Scrape content from result URLs. Ignored in SERP mode',
        },
        scrapeLimit: {
          type: 'number',
          default: 3,
          minimum: 1,
          maximum: 10,
          description: 'Number of URLs to scrape (requires scrape: true). Ignored in SERP mode',
        },
        serp: {
          type: 'boolean',
          default: false,
          description:
            'Return the full Google results page: organic results, AI Overview, related searches, People Also Ask and pagination (first page only). Supports query, location, city, device, limit, source (one value), time, includeDomains and excludeDomains; category, format, scrape and groundedAnswer are ignored',
        },
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
          description: 'DNS record types to query. If omitted, all supported types are returned',
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
        scale: { type: 'number', default: 1, description: 'Zoom level (0–2)' },
        margin: {
          type: 'object',
          description: 'Margins in mm',
          properties: {
            top: { type: 'number' },
            bottom: { type: 'number' },
            left: { type: 'number' },
            right: { type: 'number' },
          },
        },
        hideCookie: { type: 'boolean', default: false },
        skipCaptcha: { type: 'boolean', default: false },
        addTimestamp: { type: 'boolean', default: false },
      },
      required: ['url'],
    },
  },
  {
    name: 'openPorts',
    description: 'Scan open ports on a host and optionally detect running services',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Target URL',
        },
        topPorts: {
          type: 'number',
          enum: [50, 100, 500, 1000, 5000],
          description: 'Scan top N ports',
        },
        portRanges: {
          type: 'string',
          description: 'Custom port ranges e.g. 80,443,1000-1010',
        },
        detectServices: {
          type: 'boolean',
          default: false,
          description:
            'Detect the service, product, version, and OS information running on discovered open ports',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'tlsScan',
    description: 'Scan TLS/SSL configuration of a domain',
    inputSchema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'Target URL' } },
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
        targetCountries: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 3,
          description:
            'Up to 3 ISO alpha-2 country codes to also test reachability from via proxy, alongside the default US server test. When set, the response includes a per-location breakdown instead of a single result',
        },
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
      properties: { url: { type: 'string', description: 'Target URL' } },
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
      properties: { url: { type: 'string', description: 'Target URL or IP' } },
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
  {
    name: 'brand',
    description: 'Extract brand identity and design information from a website',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Target URL',
        },
        refresh: {
          type: 'boolean',
          default: false,
          description: 'Force refresh brand data instead of using cached data',
        },
        mode: {
          type: 'string',
          enum: ['standard', 'enriched'],
          default: 'standard',
          description:
            'Brand extraction mode. Enriched mode includes additional company and brand intelligence',
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
  mixedContent: '/mixedcontent',
  dnsSec: '/dnssec',
  mtr: '/mtr',
  ping: '/ping',
  lighthouse: '/lighthouse',
  brand: '/brand',
};

// ─── MCP Server factory ───────────────────────────────────────────────────────

function createMcpServer(apiKey: string, baseUrl: string = DEFAULT_BASE_URL): Server {
  const httpClient = axios.create({
    baseURL: baseUrl.replace(/\/$/, ''),
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    // Keep under Cloudflare's proxy read timeout.
    timeout: 150_000,
  });

  const server = new Server(
    { name: '@geekflare/mcp', version: '0.4.2' },
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
      const res = await httpClient.post(route, args ?? {});
      return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error(
          JSON.stringify({ tool: name, status: err.response?.status, message: err.message })
        );
        const msg = JSON.stringify(err.response?.data ?? err.message);
        return { content: [{ type: 'text', text: `API Error: ${msg}` }], isError: true };
      }
      console.error('[tool] unexpected error:', err);
      return { content: [{ type: 'text', text: `Error: ${String(err)}` }], isError: true };
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

async function serveMcp(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  apiKey: string,
  BASE_URL: string,
  ownerId?: string
): Promise<void> {
  const sessionIdHeader = req.headers['mcp-session-id'] as string | undefined;
  const found = sessionIdHeader ? sessions.get(sessionIdHeader) : undefined;
  const existing = found && found.ownerId === ownerId ? found : undefined;

  if (req.method === 'DELETE') {
    if (existing && sessionIdHeader) {
      await existing.transport.close().catch(() => {});
      sessions.delete(sessionIdHeader);
      console.log(`[session] deleted ${sessionIdHeader}`);
    }
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET') {
    if (existing) {
      existing.lastSeen = Date.now();
      await safeHandleRequest(existing.transport, req, res);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No active session. POST to this endpoint to initialise.' }));
    return;
  }

  if (req.method === 'POST') {
    let rawBody: string;
    try {
      rawBody = await readBody(req);
    } catch (err) {
      console.error('[http] failed to read body:', err);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to read request body' }));
      return;
    }
    const parsed = safeJsonParse(rawBody);
    if (!parsed.ok) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON in request body' }));
      return;
    }

    if (existing) {
      existing.lastSeen = Date.now();
      await safeHandleRequest(existing.transport, req, res, parsed.value);
      return;
    }

    const sessionId = randomUUID();
    console.log(`[session] created ${sessionId}`);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => sessionId });
    const server = createMcpServer(apiKey, BASE_URL);
    try {
      await server.connect(transport);
    } catch (err) {
      console.error('[session] connect error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to initialise MCP session' }));
      return;
    }
    sessions.set(sessionId, { transport, server, lastSeen: Date.now(), ownerId });
    transport.onclose = () => {
      sessions.delete(sessionId);
      console.log(`[session] closed ${sessionId}`);
    };
    await safeHandleRequest(transport, req, res, parsed.value);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}

/**
 * Safe JSON parse. Returns parsed value on success, or `null` on failure
 * (avoids throwing SyntaxError into the HTTP handler).
 */
function safeJsonParse(raw: string): { ok: true; value: unknown } | { ok: false } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: {} }; // treat empty body as {}
  try {
    return { ok: true, value: JSON.parse(trimmed) };
  } catch {
    return { ok: false };
  }
}

/**
 * Set CORS + common headers. Handles pre-flight OPTIONS.
 * Returns true if caller should stop processing.
 */
function setCorsHeaders(req: http.IncomingMessage, res: http.ServerResponse): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, mcp-session-id, x-api-key'
  );
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id, WWW-Authenticate');

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
  ownerId?: string; // set for OAuth sessions; undefined for legacy /{API_KEY}/mcp sessions
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

// ─── Request handler ──────────────────────────────────────────────────────────

/**
 * Wrapped transport.handleRequest that never lets an exception propagate into
 * the outer HTTP handler (which would produce a half-written / empty response
 * and trigger a Cloudflare 502).
 */
async function safeHandleRequest(
  transport: StreamableHTTPServerTransport,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  body?: unknown
): Promise<void> {
  try {
    if (body !== undefined) {
      await transport.handleRequest(req, res, body);
    } else {
      await transport.handleRequest(req, res);
    }
  } catch (err) {
    console.error('[transport] handleRequest threw:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
}

// ─── HTTP mode ────────────────────────────────────────────────────────────────

const MODE = process.env.MCP_TRANSPORT ?? 'stdio';

if (MODE === 'http') {
  const PORT = parseInt(process.env.PORT ?? '3000', 10);
  const BASE_URL = (process.env.API_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '');

  const httpServer = http.createServer(async (req, res) => {
    // Wrap the entire handler so a bug anywhere can't crash the process
    try {
      await handleHttpRequest(req, res, PORT, BASE_URL);
    } catch (err) {
      console.error('[http] top-level handler error:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    }
  });

  httpServer.on('error', (err) => {
    console.error('[server] error:', err);
  });

  setupGracefulShutdown(httpServer);

  httpServer.listen(PORT, () => {
    console.log('=================================');
    console.log('Geekflare MCP Server Started');
    console.log(`Port:     ${PORT}`);
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Mode:     ${MODE}`);
    console.log(`Health:   http://localhost:${PORT}/health`);
    console.log(`MCP:      http://localhost:${PORT}/{API_KEY}/mcp`);
    console.log('=================================');
  });
} else {
  const apiKey = process.env.API_KEY ?? '';
  if (!apiKey) {
    console.error('[stdio] ERROR: API_KEY environment variable is not set.');
    process.exit(1);
  }
  const baseUrl = process.env.API_BASE_URL ?? DEFAULT_BASE_URL;
  const server = createMcpServer(apiKey, baseUrl);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// ─── Core HTTP routing (extracted for top-level error wrapping) ───────────────

async function handleHttpRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  PORT: number,
  BASE_URL: string
): Promise<void> {
  // ── CORS pre-flight ─────────────────────────────────────────────────────────
  if (setCorsHeaders(req, res)) return;

  const rawUrl = req.url ?? '/';
  const url = new URL(rawUrl, `http://localhost:${PORT}`);

  // ── /health ─────────────────────────────────────────────────────────────────
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: '@geekflare/mcp',
        version: '0.4.2',
        uptime: process.uptime(),
        sessions: sessions.size,
      })
    );
    return;
  }

  // ── OAuth clients (ChatGPT, ...) ────────────────────────────────────────────
  const metadataResource = matchMetadataResource(url.pathname);
  if (metadataResource) {
    serveProtectedResourceMetadata(res, metadataResource);
    return;
  }
  const oauthResource = matchOAuthResource(url.pathname);
  if (oauthResource) {
    let apiKey: string;
    let userId: string;
    try {
      const principal = await authenticateOAuthRequest(req, oauthResource); // checked on EVERY request
      userId = principal.userId;
      apiKey = await resolveApiKey(principal); // also confirms the connection is still active
    } catch (error) {
      if (sendBridgeError(res, error, oauthResource)) return;
      throw error;
    }
    await serveMcp(req, res, apiKey, BASE_URL, userId);
    return;
  }

  // ── /{API_KEY}/mcp ───────────────────────────────────────────────────────────
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

  await serveMcp(req, res, apiKey, BASE_URL);

  // // ── DELETE  →  terminate session ─────────────────────────────────────────────
  // if (req.method === 'DELETE') {
  //   const sessionId = req.headers['mcp-session-id'] as string | undefined;
  //   if (sessionId && sessions.has(sessionId)) {
  //     const session = sessions.get(sessionId)!;
  //     await session.transport.close().catch(() => {});
  //     sessions.delete(sessionId);
  //     console.log(`[session] deleted ${sessionId}`);
  //   }
  //   res.writeHead(204);
  //   res.end();
  //   return;
  // }

  // // ── GET  →  re-attach to existing SSE stream only ────────────────────────────
  // //
  // // Do NOT return a discovery blob here — Cursor and other clients interpret
  // // any non-error GET response as "the server replied" and never POST to init.
  // if (req.method === 'GET') {
  //   const sessionId = req.headers['mcp-session-id'] as string | undefined;

  //   if (sessionId && sessions.has(sessionId)) {
  //     const session = sessions.get(sessionId)!;
  //     session.lastSeen = Date.now();
  //     await safeHandleRequest(session.transport, req, res);
  //     return;
  //   }

  //   res.writeHead(404, { 'Content-Type': 'application/json' });
  //   res.end(
  //     JSON.stringify({
  //       error: 'No active session. POST to this endpoint to initialise.',
  //       usage: 'POST /{API_KEY}/mcp',
  //     })
  //   );
  //   return;
  // }

  // // ── POST  →  main MCP messages ────────────────────────────────────────────────
  // if (req.method === 'POST') {
  //   // Read body
  //   let rawBody: string;
  //   try {
  //     rawBody = await readBody(req);
  //   } catch (err) {
  //     console.error('[http] failed to read body:', err);
  //     res.writeHead(400, { 'Content-Type': 'application/json' });
  //     res.end(JSON.stringify({ error: 'Failed to read request body' }));
  //     return;
  //   }

  //   // FIX: Use safeJsonParse so a truncated / empty body never throws
  //   // SyntaxError up through the stack and crashes the server.
  //   const parsed = safeJsonParse(rawBody);
  //   if (!parsed.ok) {
  //     console.error('[http] invalid JSON body (first 200 chars):', rawBody.slice(0, 200));
  //     res.writeHead(400, { 'Content-Type': 'application/json' });
  //     res.end(JSON.stringify({ error: 'Invalid JSON in request body' }));
  //     return;
  //   }
  //   const parsedBody = parsed.value;

  //   // Route to an existing session if the client sent a session ID
  //   const incomingSessionId = req.headers['mcp-session-id'] as string | undefined;

  //   if (incomingSessionId && sessions.has(incomingSessionId)) {
  //     const session = sessions.get(incomingSessionId)!;
  //     session.lastSeen = Date.now();
  //     await safeHandleRequest(session.transport, req, res, parsedBody);
  //     return;
  //   }

  //   // ── New session ─────────────────────────────────────────────────────────
  //   const sessionId = randomUUID();
  //   console.log(`[session] created ${sessionId}`);

  //   const transport = new StreamableHTTPServerTransport({
  //     sessionIdGenerator: () => sessionId,
  //   });

  //   const server = createMcpServer(apiKey, BASE_URL);

  //   try {
  //     await server.connect(transport);
  //   } catch (err) {
  //     console.error('[session] connect error:', err);
  //     res.writeHead(500, { 'Content-Type': 'application/json' });
  //     res.end(JSON.stringify({ error: 'Failed to initialise MCP session' }));
  //     return;
  //   }

  //   const session: Session = { transport, server, lastSeen: Date.now() };
  //   sessions.set(sessionId, session);

  //   transport.onclose = () => {
  //     sessions.delete(sessionId);
  //     console.log(`[session] closed ${sessionId}`);
  //   };

  //   await safeHandleRequest(transport, req, res, parsedBody);
  //   return;
  // }

  // // ── Unsupported method ────────────────────────────────────────────────────────
  // res.writeHead(405, { 'Content-Type': 'application/json' });
  // res.end(JSON.stringify({ error: 'Method not allowed' }));
}
