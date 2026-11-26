<h1 align="center">Geekflare MCP Server for Web Scraping, Search and Screenshots</h1>

<p align="center"><b>The official Geekflare MCP server gives AI agents live web access: web scraping, web search, screenshots and website checks as native tools in Claude, ChatGPT, Cursor, Codex, VS Code and any other MCP client.</b></p>

<p align="center">
  <a href="https://cursor.com/en/install-mcp?name=geekflare&config=eyJ1cmwiOiJodHRwczovL21jcC5nZWVrZmxhcmUuY29tL21jcCJ9"><img src="https://img.shields.io/badge/Install_in_Cursor-000000?style=for-the-badge&logo=cursor&logoColor=white" alt="Install in Cursor"></a>
  <a href="https://claude.ai/new?modal=add-custom-connector&connectorName=Geekflare&connectorUrl=https%3A%2F%2Fmcp.geekflare.com%2Fmcp#customize/connectors"><img src="https://img.shields.io/badge/Add_to_Claude-C66140?style=for-the-badge&logo=claude&logoColor=white" alt="Add to Claude"></a>
  <a href="https://www.npmjs.com/package/@geekflare/mcp"><img src="https://img.shields.io/npm/v/@geekflare/mcp?style=for-the-badge&label=npm" alt="npm version"></a>
  <a href="https://registry.modelcontextprotocol.io/v0/servers?search=com.geekflare"><img src="https://img.shields.io/badge/MCP_Registry-com.geekflare%2Fmcp-4338CA?style=for-the-badge" alt="MCP Registry"></a>
</p>

<p align="center">
  <a href="https://docs.geekflare.com/mcp/overview"><b>Documentation</b></a> ·
  <a href="https://geekflare.com/mcp/"><b>Website</b></a> ·
  <a href="https://www.npmjs.com/package/@geekflare/mcp"><b>npm</b></a> ·
  <a href="https://dash.geekflare.com/"><b>Get an API key</b></a>
</p>

- **Hosted and free to connect.** The server runs at `https://mcp.geekflare.com/mcp`, so nothing needs to be installed.
- **No API key needed in Claude and Cursor.** You sign in with your Geekflare account in the browser instead.
- **16 tools in one connection.** Your client discovers them automatically and picks the right tool for each request.
- **Free plan:** 500 credits a month, no credit card required. Tool calls use Geekflare API credits.

## Quick start

| How you connect | Server | API key | Install |
|---|---|---|---|
| **Hosted, sign in with Geekflare** (Claude, Cursor) | `https://mcp.geekflare.com/mcp` | Not needed | None |
| Hosted, with API key (any client with Streamable HTTP) | `https://mcp.geekflare.com/YOUR_API_KEY/mcp` | Yes | None |
| Local over stdio | `npx -y @geekflare/mcp` | Yes (`API_KEY`) | Node.js 18+ |
| Docker | `geekflarehq/geekflare-api-mcp` | Yes (`API_KEY`) | Docker |

Get an API key from the [Geekflare dashboard](https://dash.geekflare.com/) if your client doesn't support sign-in.

## Connect your client

### Claude Desktop and Claude.ai
[Add Geekflare to Claude](https://claude.ai/new?modal=add-custom-connector&connectorName=Geekflare&connectorUrl=https%3A%2F%2Fmcp.geekflare.com%2Fmcp#customize/connectors) opens the custom connector dialog with the URL filled in. Sign in with Geekflare when prompted.

To set it up by hand:
1. Open **Customize → Connectors**, click **Add**, then **Add custom connector**.
2. Enter the URL `https://mcp.geekflare.com/mcp`.
3. Click **Connect**, sign in to Geekflare and choose **Allow access**.

[Full guide](https://docs.geekflare.com/mcp/claude-desktop)

### Claude Code

```bash
claude mcp add --transport http geekflare https://mcp.geekflare.com/mcp
```

Then run `/mcp` in Claude Code and sign in with your Geekflare account. [Full guide](https://docs.geekflare.com/mcp/claude-code)

### Cursor

Click **Install in Cursor** above, or add this in **Cursor Settings → MCP**, then click **Connect** and sign in:

```json
{
  "mcpServers": {
    "geekflare": {
      "url": "https://mcp.geekflare.com/mcp"
    }
  }
}
```

[Full guide](https://docs.geekflare.com/mcp/cursor)

### VS Code (GitHub Copilot)

Run **Preferences: Open User Settings (JSON)** and add:

```json
{
  "mcp": {
    "servers": {
      "geekflare": {
        "type": "http",
        "url": "https://mcp.geekflare.com/YOUR_API_KEY/mcp"
      }
    }
  }
}
```

[Full guide](https://docs.geekflare.com/mcp/vscode)

### Codex

Add this to `~/.codex/config.toml`:

```toml
[mcp_servers.geekflare]
command = "npx"
args = ["-y", "@geekflare/mcp"]
env = { API_KEY = "YOUR_API_KEY" }
```

[Full guide](https://docs.geekflare.com/mcp/codex)

### Gemini CLI

```bash
gemini extensions install https://github.com/geekflare/geekflare-skills
```

This installs the MCP server and the Geekflare skill together, and prompts for your API key. [Full guide](https://docs.geekflare.com/mcp/gemini-cli)

### Antigravity

Add the server in the Antigravity MCP settings, or add this to its MCP configuration file:

```json
{
  "mcpServers": {
    "geekflare": {
      "command": "npx",
      "args": ["-y", "@geekflare/mcp"],
      "env": { "API_KEY": "YOUR_API_KEY" }
    }
  }
}
```

### OpenCode

Add this to `~/.config/opencode/opencode.json` (see the [OpenCode MCP docs](https://opencode.ai/docs/mcp-servers/)):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "geekflare": {
      "type": "remote",
      "url": "https://mcp.geekflare.com/YOUR_API_KEY/mcp",
      "enabled": true
    }
  }
}
```

### Warp

Go to **Settings → MCP Servers → Add MCP Server** and add:

```json
{
  "geekflare": {
    "url": "https://mcp.geekflare.com/YOUR_API_KEY/mcp"
  }
}
```

### Goose

Go to **Advanced settings → Extensions → Add custom extension**. Name it `Geekflare`, choose type `STDIO`, set the command to `npx -y @geekflare/mcp`, and add the environment variable `API_KEY` with your Geekflare API key.

### Any other MCP client

Use the hosted URL if your client supports Streamable HTTP:

```json
{
  "mcpServers": {
    "geekflare": {
      "url": "https://mcp.geekflare.com/YOUR_API_KEY/mcp"
    }
  }
}
```

Or run it locally over stdio:

```json
{
  "mcpServers": {
    "geekflare": {
      "command": "npx",
      "args": ["-y", "@geekflare/mcp"],
      "env": { "API_KEY": "YOUR_API_KEY" }
    }
  }
}
```

This also works in JetBrains AI Assistant, Continue, GitHub Copilot CLI and any other client that supports MCP. There are step-by-step guides for [Devin Desktop (Windsurf)](https://docs.geekflare.com/mcp/windsurf), [Cline](https://docs.geekflare.com/mcp/cline), [Roo Code](https://docs.geekflare.com/mcp/roo-code), [Zed](https://docs.geekflare.com/mcp/zed), [Kiro](https://docs.geekflare.com/mcp/kiro), [n8n](https://docs.geekflare.com/mcp/n8n), [LM Studio](https://docs.geekflare.com/mcp/lm-studio), [Amazon Q](https://docs.geekflare.com/mcp/amazon-q), [BoltAI](https://docs.geekflare.com/mcp/boltai) and [other clients](https://docs.geekflare.com/mcp/others).

## Tools

| Tool | What it does |
|---|---|
| `webScrape` | Scrapes a page into Markdown, HTML, JSON or LLM-ready text, with JavaScript rendering, CAPTCHA handling and proxies |
| `search` | Searches the web, news or images, with optional AI-grounded answers or full Google SERP results |
| `crawl` | Crawls a whole website from one URL and returns every page as Markdown or HTML |
| `map` | Lists every URL on a website with its status code and depth, without fetching content |
| `screenshot` | Captures full-page or viewport screenshots, with ads and cookie banners blocked and device emulation |
| `metaScrape` | Extracts meta tags, Open Graph and Twitter card data as JSON |
| `brand` | Returns a company's logo, colours, fonts, social profiles and key links from its domain |
| `url2Pdf` | Converts any URL to a downloadable PDF |
| `brokenLink` | Finds every broken internal and external link on a page |
| `lighthouse` | Runs Lighthouse audits for performance, SEO and accessibility |
| `loadTime` | Measures full page load time from a chosen location |
| `siteStatus` | Checks whether a site is up or down from a chosen location |
| `redirectCheck` | Traces the full redirect chain of a URL |
| `dnsRecord` | Looks up A, AAAA, CNAME, MX, TXT and other DNS records |
| `tlsScan` | Inspects TLS/SSL configuration and certificate details |
| `openPorts` | Scans open ports on a host |

### When to use which tool
- **Read a known URL:** `webScrape`. Markdown output is the best fit for an LLM's context window.
- **Read a whole site or section:** `crawl`. Run `map` first to see which URLs it would visit and what it would cost.
- **Start from a question, not a URL:** `search`. Ask for full page content or a grounded answer when snippets aren't enough.
- **See what a page looks like:** `screenshot`. Use mobile emulation or a country for localised pages.
- **Get just the title, description and social tags:** `metaScrape`, which is faster and cheaper than a full scrape.
- **Find a company's logo and brand colours:** `brand`.
- **Audit a website:** `lighthouse`, `loadTime`, `brokenLink`, `redirectCheck`, `siteStatus` and `map` (which lists every URL with its status code).
- **Debug a domain or server:** `dnsRecord`, `tlsScan` and `openPorts`.

### Example prompts
- "Scrape https://example.com/pricing and summarise the plans in a table."
- "Search for the latest news on EU AI regulation and give me three sources."
- "Crawl https://docs.example.com/guides/ and summarise each page."
- "Map https://example.com and list every URL that returns a 404."
- "Take a full-page mobile screenshot of https://example.com."
- "Check the DNS records and TLS certificate for example.com."
- "Run a Lighthouse audit on https://example.com and list the top three fixes."

## Agent skill (optional)

The Geekflare skill tells Claude Code, Cursor, Codex, GitHub Copilot and other agents when and how to use each tool:

```bash
npx skills add geekflare/geekflare-skills
```

[About the skill](https://docs.geekflare.com/mcp/agent-skills)

## FAQ

**What is the Geekflare MCP server?**
It's the official Model Context Protocol server for the Geekflare API. It exposes 16 Geekflare tools to AI assistants, including web scraping, website crawling, web search, screenshots, PDF conversion, brand data, Lighthouse audits and DNS/TLS/network checks, so the assistant can use the live web while it works.

**Is the Geekflare MCP server free?**
Yes. Connecting to the server is free. Tool calls use Geekflare API credits, and the free plan includes 500 credits a month with no credit card. Paid plans start at $19 a month. See [pricing](https://geekflare.com/pricing/).

**Do I need an API key?**
Not in Claude or Cursor: connect to `https://mcp.geekflare.com/mcp` and sign in with your Geekflare account. Other clients need an API key, either in the URL (`https://mcp.geekflare.com/YOUR_API_KEY/mcp`) or as `API_KEY` when you run it with npx or Docker.

**Is there a web scraping API with an MCP server for Claude or Cursor?**
Yes. Geekflare's Web Scraping API is available as the `webScrape` tool in the Geekflare MCP server. Add `https://mcp.geekflare.com/mcp` to Claude or Cursor, sign in, and ask the assistant to scrape any URL into Markdown, HTML or JSON.

**Is there a web search API with an MCP server for AI agents?**
Yes. Geekflare's Search API is the `search` tool in the same server. It returns ranked web, news or image results, full page content of the top results, a grounded answer, or Google SERP data with AI Overview, and works in Claude, Cursor, ChatGPT, Codex and any MCP client.

**Is there a screenshot API with an MCP server for AI assistants?**
Yes. Geekflare's Screenshot API is the `screenshot` tool. It captures full-page or viewport screenshots in a real Chrome browser, with ads and cookie banners removed, desktop or mobile emulation, and capture from 194 countries.

**Is it remote or local?**
Both. The recommended way is the hosted remote server over Streamable HTTP, which needs no installation. You can also run it locally over stdio with `npx -y @geekflare/mcp` or the Docker image `geekflarehq/geekflare-api-mcp`.

**Which clients does it work with?**
Any MCP client. This README covers Claude Desktop, Claude.ai, Claude Code, Cursor, VS Code (GitHub Copilot), Codex, Gemini CLI, Antigravity, OpenCode, Warp and Goose. Geekflare's docs add guides for Devin Desktop (Windsurf), Cline, Roo Code, Zed, Kiro, n8n, LM Studio, Amazon Q and BoltAI, and it works in ChatGPT, JetBrains AI Assistant, Continue and any other MCP client.

**Can it scrape JavaScript-heavy pages?**
Yes. `webScrape` renders JavaScript in a real browser and handles CAPTCHAs, anti-bot protection and proxy rotation, then returns clean Markdown, HTML or JSON.

**How is this different from the Geekflare API?**
The MCP server wraps the same [Geekflare API](https://docs.geekflare.com/api/intro) endpoints as tools that AI assistants call directly, so you don't write integration code. Same account, same credits.

**Is it official?**
Yes. Geekflare maintains it, and it's published as [`@geekflare/mcp`](https://www.npmjs.com/package/@geekflare/mcp) on npm and as `com.geekflare/mcp` in the official MCP Registry.

## Tool reference

Full parameters for each tool.

### `webScrape`

Scrape full page content from any URL. Returns HTML, Markdown, JSON, or LLM-optimised text — including structured data via ready-made extraction templates, custom CSS/XPath schemas, or AI-powered extraction.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `url` \* | string | — | Target URL |
| `device` | `desktop` \| `mobile` | `desktop` | Device to emulate |
| `format` | array | `["markdown"]` | Output formats (up to 3): `html`, `markdown`, `json`, `markdown-llm`, `html-llm`, `text`, `text-llm` |
| `proxyMode` | boolean \| `"auto"` | `false` | `false` never uses a proxy, `auto` retries through one if the site blocks the request, `true` always uses one |
| `proxyCountry` | string | — | Route through a country ISO code (e.g. `"us"`), used when a proxy is active |
| `renderJS` | boolean | auto | Execute JavaScript before extracting. If omitted, resolved automatically based on whether the page needs it |
| `fileOutput` | boolean | `false` | Return a download URL instead of inline content |
| `blockAds` | boolean | `true` | Block ads during scrape |
| `stealth` | boolean | `false` | Bypass CAPTCHAs (slower) |
| `waitTime` | number | `0` | Seconds to wait after page load before capturing content |
| `extractionMode` | `default` \| `cssSchema` \| `xpathSchema` \| `template` | `default` | Only used when `format` includes `json` |
| `template` | `product` \| `contact` | — | Ready-made extraction template when `extractionMode` is `template` |
| `extractionSchema` | object | — | Custom field-extraction schema for `cssSchema`/`xpathSchema` modes |
| `aiPrompt` | object | — | AI-powered extraction/analysis of the scraped page. Supports prompt, schema, listing, summary, sentiment, and keywords modes. Adds +6 credits |

---

### `metaScrape`

Scrape meta tags — title, description, Open Graph, Twitter cards, and more.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `url` \* | string | — | Target URL |
| `device` | `desktop` \| `mobile` | `desktop` | Device to emulate |
| `format` | `json` \| `markdown` | `json` | Response format |
| `proxyCountry` | string | — | Country ISO code |
| `renderJS` | boolean | `true` | Whether to execute JavaScript |
| `fileOutput` | boolean | `false` | Return a download URL instead of inline content |
| `blockAds` | boolean | `true` | Block ads during scrape |

---

### `brand`

Get structured brand information for a website domain, including brand identity, logos, colors, typography, social profiles, links, page metadata, and company information.

The `brand` tool supports two levels of brand intelligence:

- `standard` — Returns structured brand information available from the website.
- `enriched` — Includes additional LLM-synthesized company intelligence when available.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `url` \* | string | — | Target URL |
| `refresh` | boolean | `false` | Force an on-demand fetch and refresh the cached brand data |
| `mode` | `standard` \| `enriched` | `standard` | Depth of brand data to return. `enriched` includes LLM-synthesized company intelligence |

#### Example

```json
{
  "url": "https://example.com",
  "mode": "enriched"
}
```

To bypass cached data and fetch fresh information:

```json
{
  "url": "https://example.com",
  "refresh": true,
  "mode": "enriched"
}
```

The response may include:

- Brand name, tagline, description, and slogan
- Logos and favicon
- Brand colors and palette
- Fonts and typography
- UI component styles and spacing
- Social profiles
- Important website links
- Page metadata and Open Graph information
- Company information such as industry, founded year, employee range, revenue range, company type, and target audience when available

Enriched company information depends on the publicly available information for the domain, so individual fields may be omitted.

---

### `screenshot`

Capture a screenshot of any website. Supports full-page, element-only, Retina, dark mode, transparent backgrounds, and AI-friendly link highlighting.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `url` \* | string | — | Target URL |
| `device` | `desktop` \| `mobile` | `desktop` | Device to emulate |
| `type` | `png` \| `jpeg` \| `webp` | `png` | Image format |
| `proxyCountry` | string | — | Country ISO code |
| `fullPage` | boolean | `false` | Capture the full page |
| `selector` | string | — | CSS selector for the element to capture |
| `fallbackToFullPage` | boolean | `false` | Fall back to a full-page capture if `selector` isn't found |
| `blockAds` | boolean | `true` | Block ads |
| `hideCookie` | boolean | `true` | Remove cookie banners |
| `skipCaptcha` | boolean | `true` | Bypass anti-bot challenges |
| `addTimestamp` | boolean | `false` | Add a timestamp |
| `highlightLinks` | boolean | `false` | Draw borders around links/buttons — useful for AI vision models |
| `pageHeight` | number | — | Custom page height in pixels |
| `viewportWidth` | number | — | Viewport width |
| `viewportHeight` | number | — | Viewport height |
| `captureBeyondViewport` | boolean | — | Capture content beyond the configured viewport |
| `delay` | number | — | Seconds to wait after page load |
| `quality` | number | `90` | Image quality for JPEG/WEBP |
| `scaleFactor` | number | — | Device pixel ratio |
| `theme` | `light` \| `dark` \| `auto` | `auto` | Color scheme |
| `removeBackground` | boolean | `false` | Remove page background (PNG only) |
| `disableAnimations` | boolean | `false` | Freeze CSS animations before capture |
| `inline` | boolean | `false` | Return image data inline instead of a CDN URL |

---

### `search`

Search the web and return clean, structured results. Supports web, news, and image search with optional AI-grounded answers.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `query` \* | string | — | Search query |
| `limit` | number | `10` | Number of results |
| `time` | string | — | Time filter: `any`, `d`, `w`, `m`, `y`, `d7`, `h6` |
| `location` | string | — | Country ISO code to localise results |
| `source` | `web` \| `news` \| `images` | `web` | Search source |
| `category` | `general` \| `code` \| `pdf` \| `research` \| `linkedin` \| `wiki` | — | Search category |
| `format` | `json` \| `markdown` \| `html` | `json` | Response format |
| `includeDomains` | array | — | Only include these domains |
| `excludeDomains` | array | — | Exclude these domains |
| `groundedAnswer` | boolean | `false` | Generate an AI answer synthesised from results |
| `scrape` | boolean | `false` | Also scrape top result pages |
| `scrapeLimit` | number | `3` | How many pages to scrape when `scrape` is enabled |

---

### `crawl`

Crawl a website from a start URL and return every page as Markdown or HTML. Follows links and sitemaps and fetches each page once. Returns up to 500 pages in one response; if the crawl runs out of time, you get the pages finished so far, marked as partial. Each page costs the same as a scrape (0.25 credits without a browser, 1 with JavaScript rendering, +4 with a proxy).

| Parameter | Type | Default | Description |
|---|---|---|---|
| `url` \* | string | — | Where the crawl starts. A sitemap URL crawls every page in it |
| `maxPages` | number | `500` | The most pages to fetch (up to 500) |
| `maxDepth` | number | `3` | How many links away from the start URL to go |
| `allowPatterns` | array | — | Only crawl URLs matching one of these patterns, e.g. `"/docs/*"` |
| `denyPatterns` | array | — | Skip URLs matching these patterns, e.g. `"/tag/*"` |
| `includeExternal` | boolean | `false` | Follow links to other domains |
| `format` | `markdown` \| `html` | `markdown` | Output format for each page |
| `renderJS` | boolean | `true` | Render pages in headless Chrome. Set `false` for static sites |
| `proxyMode` | `auto` \| `true` \| `false` | — | `auto` uses a premium proxy only for pages that block the crawler, `true` always uses one |
| `proxyCountry` | string | — | Crawl through a premium proxy in this country, e.g. `"de"` |

---

### `map`

List every URL on a website, with its status code and depth from the start URL, without fetching the content. Includes `estimatedCredits` for crawling the pages that load. Costs 1 credit per 1,000 URLs returned.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `url` \* | string | — | Where the map starts. A sitemap URL lists every page in it |
| `maxPages` | number | `500` | The most URLs to return (up to 10,000) |
| `maxDepth` | number | `3` | How many links away from the start URL to go (up to 10) |
| `allowPatterns` | array | — | Only list URLs matching one of these patterns, e.g. `"/blog/*"` |
| `denyPatterns` | array | — | Skip URLs matching these patterns |
| `includeExternal` | boolean | `false` | Follow links to other domains |
| `timeout` | number | — | Seconds to look before returning what it has found |

---

### `dnsRecord`

Look up DNS records for a domain.

| Parameter | Type | Default |
|---|---|---|
| `url` \* | string | — |
| `types` | array | All supported types |

Supported DNS record types:

`A`, `AAAA`, `CNAME`, `MX`, `NS`, `SOA`, `TXT`, `CAA`, `SRV`

---

### `siteStatus`

Check if a site is up or down.

| Parameter | Type | Default |
|---|---|---|
| `url` \* | string | — |
| `proxyCountry` | string | — |
| `followRedirect` | boolean | `false` |

---

### `redirectCheck`

Trace the full redirect chain of a URL.

| Parameter | Type |
|---|---|
| `url` \* | string |
| `proxyCountry` | string |

---

### `brokenLink`

Find all broken links on a webpage.

| Parameter | Type | Default |
|---|---|---|
| `url` \* | string | — |
| `proxyCountry` | string | — |
| `followRedirect` | boolean | `false` |

---

### `url2Pdf`

Convert any URL to a downloadable PDF.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `url` \* | string | — | Target URL |
| `device` | `desktop` \| `mobile` | `desktop` | Device to emulate |
| `format` | `a4` \| `a3` \| `a5` \| `a6` \| `letter` \| `legal` \| `a0`–`a2` | `a4` | Paper size |
| `orientation` | `portrait` \| `landscape` | `portrait` | Page orientation |
| `proxyCountry` | string | — | Country ISO code |
| `scale` | number | — | Zoom level |
| `margin.top` | number | `25` | Top margin in mm |
| `margin.bottom` | number | `25` | Bottom margin in mm |
| `margin.left` | number | `25` | Left margin in mm |
| `margin.right` | number | `25` | Right margin in mm |
| `hideCookie` | boolean | `true` | Remove cookie banners |
| `skipCaptcha` | boolean | `true` | Bypass anti-bot challenges |
| `addTimestamp` | boolean | `false` | Add a timestamp |

---

### `openPorts`

Scan open ports on a host. Optionally perform service and version detection on ports found open.

| Parameter | Type | Description |
|---|---|---|
| `url` \* | string | Target URL or hostname |
| `topPorts` | `50` \| `100` \| `500` \| `1000` \| `5000` | Scan top N common ports |
| `portRanges` | string | Custom ranges, e.g. `"80,443,1000-1010"` |
| `detectServices` | boolean | When `true`, also run service/version detection on open ports |

### Service Detection

Set `detectServices: true` to perform Nmap service/version detection on ports found open.

```json
{
  "url": "example.com",
  "topPorts": 100,
  "detectServices": true
}
```

When successful, the response includes a `services` array containing information such as:

- Port number
- Port state
- Detected service name
- Product name
- Product version
- Additional service information
- Inferred OS type, when available

Example response structure:

```json
{
  "data": [22, 80, 443],
  "services": [
    {
      "port": 22,
      "state": "open",
      "service": {
        "name": "ssh",
        "product": "OpenSSH",
        "version": "9.6"
      }
    },
    {
      "port": 443,
      "state": "open",
      "service": {
        "name": "https"
      }
    }
  ]
}
```

Service detection is best-effort and can take longer than a standard port scan.

If service detection is requested but cannot be completed, the API can return a `servicesError` field. The `data` field containing the discovered open ports remains available.

---

### `tlsScan`

Inspect TLS/SSL configuration — protocols, ciphers, certificate details.

| Parameter | Type |
|---|---|
| `url` \* | string |

---

### `loadTime`

Measure full page load time from any location. Optionally test reachability from multiple locations at once.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `url` \* | string | — | Target URL |
| `proxyCountry` | string | — | Country ISO code |
| `followRedirect` | boolean | `false` | Follow redirects |
| `targetCountries` | array of string | — | Up to 3 ISO country codes to also test via proxy, alongside the default US test. Returns a per-location breakdown when set |

---

### `lighthouse`

Run a full Lighthouse audit — performance, SEO, accessibility, and best practices.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `url` \* | string | — | Target URL |
| `device` | `desktop` \| `mobile` | `desktop` | Device to emulate |
| `proxyCountry` | string | — | Country ISO code |
| `followRedirect` | boolean | `false` | Follow redirects |
| `parameters` | array of string | — | Extra Lighthouse CLI flags |

---

## Environment variables

These apply when you run the server locally with npx or Docker.

| Variable | Required | Description |
|---|---|---|
| `API_KEY` | Yes | Your Geekflare API key |
| `API_BASE_URL` | No | Overrides the API base URL (default: `https://api.geekflare.com`) |

## Development

```bash
npm install
npm run build      # compile TypeScript to build/
npm run dev        # run from source with ts-node
npm test
```

Docker: `npm run docker:build` builds `geekflarehq/geekflare-api-mcp:latest`.

## Links

- [MCP documentation](https://docs.geekflare.com/mcp/overview)
- [API documentation](https://docs.geekflare.com/api/intro)
- [Geekflare MCP](https://geekflare.com/mcp/)
- [Dashboard and API keys](https://dash.geekflare.com/)
- [Report an issue](https://geekflare.com/contact/?product=api&topic=bug)

## License

MIT
