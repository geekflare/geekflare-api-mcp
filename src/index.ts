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
  { name: '@geekflare/mcp', version: '0.2.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'webScrape',
      description:
        'Scrape full page content from a URL. Returns HTML, Markdown, JSON, or LLM-optimised text.',
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
            description:
              'Output formats (up to 3). Use markdown-llm or text-llm for LLM-ready content.',
          },
          proxyCountry: {
            type: 'string',
            description: 'Route request through a specific country ISO code (e.g. "us", "gb").',
          },
          renderJS: {
            type: 'boolean',
            default: true,
            description: 'Execute JavaScript before extracting. Keep true for dynamic sites.',
          },
          fileOutput: {
            type: 'boolean',
            default: false,
            description: 'Return a download URL instead of inline content.',
          },
          blockAds: { type: 'boolean', default: true },
          stealth: {
            type: 'boolean',
            default: false,
            description: 'Enable stealth mode to bypass CAPTCHAs. Slower.',
          },
        },
        required: ['url'],
      },
    },
    {
      name: 'metaScrape',
      description:
        'Scrape meta tags (title, description, Open Graph, Twitter cards, etc.) from a URL.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          device: { type: 'string', enum: ['desktop', 'mobile'], default: 'desktop' },
          format: { type: 'string', enum: ['json', 'markdown'], default: 'json' },
          proxyCountry: {
            type: 'string',
            description: 'Route request through a specific country ISO code.',
          },
          renderJS: { type: 'boolean', default: true },
          fileOutput: {
            type: 'boolean',
            default: false,
            description: 'Return a download URL instead of inline content.',
          },
          blockAds: { type: 'boolean', default: true },
        },
        required: ['url'],
      },
    },
    {
      name: 'screenshot',
      description:
        'Capture a screenshot of a website. Supports full-page, device emulation, and ad/cookie blocking.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          device: { type: 'string', enum: ['desktop', 'mobile'], default: 'desktop' },
          type: { type: 'string', enum: ['png', 'jpeg', 'webp'], default: 'png' },
          proxyCountry: {
            type: 'string',
            description: 'Route browser through a specific country ISO code.',
          },
          fullPage: { type: 'boolean', default: false },
          blockAds: { type: 'boolean', default: true },
          hideCookie: {
            type: 'boolean',
            default: true,
            description: 'Remove cookie consent banners before capturing.',
          },
          skipCaptcha: {
            type: 'boolean',
            default: true,
            description: 'Attempt to bypass Cloudflare / reCAPTCHA.',
          },
          addTimestamp: { type: 'boolean', default: false },
          highlightLinks: {
            type: 'boolean',
            default: false,
            description:
              'Draw borders around clickable links and inputs. Useful for AI vision models.',
          },
          pageHeight: { type: 'number', description: 'Custom page height in pixels.' },
          viewportWidth: {
            type: 'number',
            description: 'Viewport width in pixels (default 1366).',
          },
          viewportHeight: {
            type: 'number',
            description: 'Viewport height in pixels (default 768).',
          },
          delay: {
            type: 'number',
            description: 'Seconds to wait after page load before capturing.',
          },
          quality: { type: 'number', default: 90, description: 'Image quality (1–100).' },
          scaleFactor: {
            type: 'number',
            description: 'Device pixel ratio. Use 2–3 for Retina-quality output.',
          },
        },
        required: ['url'],
      },
    },
    {
      name: 'search',
      description:
        'Search the web and return clean results. Supports web, news, and image search with optional AI-grounded answers.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          limit: { type: 'number', default: 10, description: 'Number of results to return.' },
          time: { type: 'string', description: 'Time filter: any, d, w, m, y, d7, h6' },
          location: { type: 'string', description: 'Country ISO code to localise results.' },
          source: { type: 'string', enum: ['web', 'news', 'images'], default: 'web' },
          category: {
            type: 'string',
            enum: ['general', 'code', 'research'],
            description: 'Search category.',
          },
          format: { type: 'string', enum: ['json', 'markdown', 'html'], default: 'json' },
          includeDomains: {
            type: 'string',
            description:
              'Comma-separated domains to include (e.g. "reddit.com,stackoverflow.com").',
          },
          excludeDomains: {
            type: 'string',
            description: 'Comma-separated domains to exclude (e.g. "pinterest.com").',
          },
          groundedAnswer: {
            type: 'boolean',
            default: false,
            description: 'Generate an AI-grounded answer synthesised from search results.',
          },
          scrape: { type: 'boolean', description: 'Also scrape the top result pages.' },
          scrapeLimit: {
            type: 'number',
            description: 'Number of result pages to scrape (requires scrape: true).',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'dnsRecord',
      description: 'Look up DNS records for a domain.',
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
      description: 'Check if a site is up or down.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          proxyCountry: { type: 'string', description: 'Check from a specific country ISO code.' },
          followRedirect: { type: 'boolean', default: false },
        },
        required: ['url'],
      },
    },
    {
      name: 'redirectCheck',
      description: 'Check the full redirect chain of a URL.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          proxyCountry: { type: 'string', description: 'Check from a specific country ISO code.' },
        },
        required: ['url'],
      },
    },
    {
      name: 'brokenLink',
      description: 'Find all broken links on a webpage.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          proxyCountry: { type: 'string', description: 'Check from a specific country ISO code.' },
          followRedirect: { type: 'boolean', default: false },
        },
        required: ['url'],
      },
    },
    {
      name: 'url2Pdf',
      description: 'Convert a URL to a PDF file.',
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
          proxyCountry: {
            type: 'string',
            description: 'Route browser through a specific country ISO code.',
          },
          scale: {
            type: 'number',
            description: 'Zoom level before rendering (e.g. 0.8 to shrink, 1.2 to zoom in).',
          },
          'margin.top': { type: 'number', description: 'Top margin in mm (default 25).' },
          'margin.bottom': { type: 'number', description: 'Bottom margin in mm (default 25).' },
          'margin.left': { type: 'number', description: 'Left margin in mm (default 25).' },
          'margin.right': { type: 'number', description: 'Right margin in mm (default 25).' },
          hideCookie: {
            type: 'boolean',
            default: true,
            description: 'Remove cookie consent banners before generating PDF.',
          },
          skipCaptcha: {
            type: 'boolean',
            default: true,
            description: 'Attempt to bypass anti-bot challenges before generating PDF.',
          },
          addTimestamp: { type: 'boolean', default: false },
        },
        required: ['url'],
      },
    },
    {
      name: 'openPorts',
      description: 'Scan open ports on a host.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL or hostname' },
          topPorts: {
            type: 'number',
            enum: [50, 100, 500, 1000, 5000],
            description: 'Scan the top N most common ports.',
          },
          portRanges: {
            type: 'string',
            description: 'Custom port ranges (e.g. "80,443,1000-1010").',
          },
        },
        required: ['url'],
      },
    },
    {
      name: 'tlsScan',
      description: 'Scan the TLS/SSL configuration of a domain.',
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
      description: 'Measure the full page load time for a URL.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          proxyCountry: {
            type: 'string',
            description: 'Measure load time from a specific country ISO code.',
          },
          followRedirect: { type: 'boolean', default: false },
        },
        required: ['url'],
      },
    },
    {
      name: 'ttfb',
      description: 'Measure Time To First Byte (TTFB) for a URL.',
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
      description: 'Retrieve HTTP response headers for a URL.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          proxyCountry: { type: 'string', description: 'Fetch from a specific country ISO code.' },
          followRedirect: { type: 'boolean', default: false },
        },
        required: ['url'],
      },
    },
    {
      name: 'httpProtocol',
      description: 'Check which HTTP protocols (HTTP/1.1, HTTP/2, HTTP/3) a URL supports.',
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
      description: 'Check for mixed content (HTTP resources on HTTPS pages) issues.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          proxyCountry: { type: 'string', description: 'Check from a specific country ISO code.' },
          followRedirect: { type: 'boolean', default: false },
        },
        required: ['url'],
      },
    },
    {
      name: 'dnsSec',
      description: 'Check if DNSSEC is enabled and valid for a domain.',
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
      description: 'Perform an MTR (My Traceroute) network diagnostic test.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          proxyCountry: {
            type: 'string',
            description: 'Run diagnostic from a specific country ISO code.',
          },
          followRedirect: { type: 'boolean', default: false },
        },
        required: ['url'],
      },
    },
    {
      name: 'ping',
      description: 'Ping a host and return latency results.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL or IP address' },
        },
        required: ['url'],
      },
    },
    {
      name: 'lighthouse',
      description:
        'Run a Lighthouse audit (performance, SEO, accessibility, best practices) on a website.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          device: { type: 'string', enum: ['desktop', 'mobile'], default: 'desktop' },
          proxyCountry: {
            type: 'string',
            description: 'Run audit from a specific country ISO code.',
          },
          followRedirect: { type: 'boolean', default: false },
          parameters: {
            type: 'string',
            description: 'Extra Lighthouse CLI flags (e.g. "--only-categories=seo").',
          },
        },
        required: ['url'],
      },
    },
  ],
}));

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
