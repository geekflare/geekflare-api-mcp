# @geekflare/mcp

Official MCP (Model Context Protocol) server for the [Geekflare](https://geekflare.com/api/). Connect Geekflare's web intelligence tools directly to Claude, Cursor, Windsurf, and other AI assistants.

## Setup

### Get an API Key

Sign up at [geekflare.com/api](https://geekflare.com/api) and copy your API key from the dashboard.

### Claude Desktop

Add this to your **`claude_desktop_config.json`**:

```json
{
  "mcpServers": {
    "geekflare": {
      "command": "npx",
      "args": ["-y", "@geekflare/mcp"],
      "env": {
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Cursor / Windsurf

Add to your MCP settings:

```json
{
  "mcpServers": {
    "geekflare": {
      "command": "npx",
      "args": ["-y", "@geekflare/mcp"],
      "env": {
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Docker

```json
{
  "mcpServers": {
    "geekflare": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "API_KEY=your-api-key-here", "geekflare/mcp"]
    }
  }
}
```

---

## Available Tools

### `webScrape`

Scrape full page content from any URL. Returns HTML, Markdown, JSON, or LLM-optimised text — including structured data via ready-made extraction templates, custom CSS/XPath schemas, or AI-powered extraction.

| Parameter          | Type      | Default        | Description                                                                                                                                   |
| ------------------ | --------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------- |
| `url` \*           | string    | —              | Target URL                                                                                                                                    |
| `device`           | `desktop` | `mobile`       | `desktop`                                                                                                                                     | Device to emulate                                                                                             |
| `format`           | array     | `["markdown"]` | Output formats (up to 3): `html`, `markdown`, `json`, `markdown-llm`, `html-llm`, `text`, `text-llm`                                          |
| `proxyMode`        | boolean   | `"auto"`       | `false`                                                                                                                                       | `false` never uses a proxy, `auto` retries through one if the site blocks the request, `true` always uses one |
| `proxyCountry`     | string    | —              | Route through a country ISO code (e.g. `"us"`), used when a proxy is active                                                                   |
| `renderJS`         | boolean   | auto           | Execute JavaScript before extracting. If omitted, resolved automatically based on whether the page needs it                                   |
| `fileOutput`       | boolean   | `false`        | Return a download URL instead of inline content                                                                                               |
| `blockAds`         | boolean   | `true`         | Block ads during scrape                                                                                                                       |
| `stealth`          | boolean   | `false`        | Bypass CAPTCHAs (slower)                                                                                                                      |
| `waitTime`         | number    | `0`            | Seconds to wait after page load before capturing content                                                                                      |
| `extractionMode`   | `default` | `cssSchema`    | `xpathSchema`                                                                                                                                 | `template`                                                                                                    | `default` | Only used when `format` includes `json` |
| `template`         | `product` | `contact`      | —                                                                                                                                             | Ready-made extraction template when `extractionMode` is `template`                                            |
| `extractionSchema` | object    | —              | Custom field-extraction schema for `cssSchema`/`xpathSchema` modes                                                                            |
| `aiPrompt`         | object    | —              | AI-powered extraction/analysis of the scraped page. Supports prompt, schema, listing, summary, sentiment, and keywords modes. Adds +6 credits |

---

### `metaScrape`

Scrape meta tags — title, description, Open Graph, Twitter cards, and more.

| Parameter      | Type      | Default    | Description                                     |
| -------------- | --------- | ---------- | ----------------------------------------------- | ----------------- |
| `url` \*       | string    | —          | Target URL                                      |
| `device`       | `desktop` | `mobile`   | `desktop`                                       | Device to emulate |
| `format`       | `json`    | `markdown` | `json`                                          | Response format   |
| `proxyCountry` | string    | —          | Country ISO code                                |
| `renderJS`     | boolean   | `true`     | Whether to execute JavaScript                   |
| `fileOutput`   | boolean   | `false`    | Return a download URL instead of inline content |
| `blockAds`     | boolean   | `true`     | Block ads during scrape                         |

---

### `brand`

Get structured brand information for a website domain, including brand identity, logos, colors, typography, social profiles, links, page metadata, and company information.

The `brand` tool supports two levels of brand intelligence:

- `standard` — Returns structured brand information available from the website.
- `enriched` — Includes additional LLM-synthesized company intelligence when available.

| Parameter | Type       | Default    | Description                                                |
| --------- | ---------- | ---------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `url` \*  | string     | —          | Target URL                                                 |
| `refresh` | boolean    | `false`    | Force an on-demand fetch and refresh the cached brand data |
| `mode`    | `standard` | `enriched` | `standard`                                                 | Depth of brand data to return. `enriched` includes LLM-synthesized company intelligence |

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

| Parameter               | Type      | Default  | Description                                                     |
| ----------------------- | --------- | -------- | --------------------------------------------------------------- | ----------------- | ------------ |
| `url` \*                | string    | —        | Target URL                                                      |
| `device`                | `desktop` | `mobile` | `desktop`                                                       | Device to emulate |
| `type`                  | `png`     | `jpeg`   | `webp`                                                          | `png`             | Image format |
| `proxyCountry`          | string    | —        | Country ISO code                                                |
| `fullPage`              | boolean   | `false`  | Capture the full page                                           |
| `selector`              | string    | —        | CSS selector for the element to capture                         |
| `fallbackToFullPage`    | boolean   | `false`  | Fall back to a full-page capture if `selector` isn't found      |
| `blockAds`              | boolean   | `true`   | Block ads                                                       |
| `hideCookie`            | boolean   | `true`   | Remove cookie banners                                           |
| `skipCaptcha`           | boolean   | `true`   | Bypass anti-bot challenges                                      |
| `addTimestamp`          | boolean   | `false`  | Add a timestamp                                                 |
| `highlightLinks`        | boolean   | `false`  | Draw borders around links/buttons — useful for AI vision models |
| `pageHeight`            | number    | —        | Custom page height in pixels                                    |
| `viewportWidth`         | number    | —        | Viewport width                                                  |
| `viewportHeight`        | number    | —        | Viewport height                                                 |
| `captureBeyondViewport` | boolean   | —        | Capture content beyond the configured viewport                  |
| `delay`                 | number    | —        | Seconds to wait after page load                                 |
| `quality`               | number    | `90`     | Image quality for JPEG/WEBP                                     |
| `scaleFactor`           | number    | —        | Device pixel ratio                                              |
| `theme`                 | `light`   | `dark`   | `auto`                                                          | `auto`            | Color scheme |
| `removeBackground`      | boolean   | `false`  | Remove page background (PNG only)                               |
| `disableAnimations`     | boolean   | `false`  | Freeze CSS animations before capture                            |
| `inline`                | boolean   | `false`  | Return image data inline instead of a CDN URL                   |

---

### `search`

Search the web and return clean, structured results. Supports web, news, and image search with optional AI-grounded answers.

| Parameter        | Type      | Default    | Description                                        |
| ---------------- | --------- | ---------- | -------------------------------------------------- | ---------- | --------------- | ------ | --- | --------------- |
| `query` \*       | string    | —          | Search query                                       |
| `limit`          | number    | `10`       | Number of results                                  |
| `time`           | string    | —          | Time filter: `any`, `d`, `w`, `m`, `y`, `d7`, `h6` |
| `location`       | string    | —          | Country ISO code to localise results               |
| `source`         | `web`     | `news`     | `images`                                           | `web`      | Search source   |
| `category`       | `general` | `code`     | `pdf`                                              | `research` | `linkedin`      | `wiki` | —   | Search category |
| `format`         | `json`    | `markdown` | `html`                                             | `json`     | Response format |
| `includeDomains` | array     | —          | Only include these domains                         |
| `excludeDomains` | array     | —          | Exclude these domains                              |
| `groundedAnswer` | boolean   | `false`    | Generate an AI answer synthesised from results     |
| `scrape`         | boolean   | `false`    | Also scrape top result pages                       |
| `scrapeLimit`    | number    | `3`        | How many pages to scrape when `scrape` is enabled  |

---

### `dnsRecord`

Look up DNS records for a domain.

| Parameter | Type   | Default             |
| --------- | ------ | ------------------- |
| `url` \*  | string | —                   |
| `types`   | array  | All supported types |

Supported DNS record types:

`A`, `AAAA`, `CNAME`, `MX`, `NS`, `SOA`, `TXT`, `CAA`, `SRV`

---

### `siteStatus`

Check if a site is up or down.

| Parameter        | Type    | Default |
| ---------------- | ------- | ------- |
| `url` \*         | string  | —       |
| `proxyCountry`   | string  | —       |
| `followRedirect` | boolean | `false` |

---

### `redirectCheck`

Trace the full redirect chain of a URL.

| Parameter      | Type   |
| -------------- | ------ |
| `url` \*       | string |
| `proxyCountry` | string |

---

### `brokenLink`

Find all broken links on a webpage.

| Parameter        | Type    | Default |
| ---------------- | ------- | ------- |
| `url` \*         | string  | —       |
| `proxyCountry`   | string  | —       |
| `followRedirect` | boolean | `false` |

---

### `url2Pdf`

Convert any URL to a downloadable PDF.

| Parameter       | Type       | Default     | Description                |
| --------------- | ---------- | ----------- | -------------------------- | ----------------- | -------- | ------- | --------- | ---- | ---------- |
| `url` \*        | string     | —           | Target URL                 |
| `device`        | `desktop`  | `mobile`    | `desktop`                  | Device to emulate |
| `format`        | `a4`       | `a3`        | `a5`                       | `a6`              | `letter` | `legal` | `a0`–`a2` | `a4` | Paper size |
| `orientation`   | `portrait` | `landscape` | `portrait`                 | Page orientation  |
| `proxyCountry`  | string     | —           | Country ISO code           |
| `scale`         | number     | —           | Zoom level                 |
| `margin.top`    | number     | `25`        | Top margin in mm           |
| `margin.bottom` | number     | `25`        | Bottom margin in mm        |
| `margin.left`   | number     | `25`        | Left margin in mm          |
| `margin.right`  | number     | `25`        | Right margin in mm         |
| `hideCookie`    | boolean    | `true`      | Remove cookie banners      |
| `skipCaptcha`   | boolean    | `true`      | Bypass anti-bot challenges |
| `addTimestamp`  | boolean    | `false`     | Add a timestamp            |

---

### `openPorts`

Scan open ports on a host. Optionally perform service and version detection on ports found open.

| Parameter        | Type    | Description                                                   |
| ---------------- | ------- | ------------------------------------------------------------- | ----- | ------ | ------ | ----------------------- |
| `url` \*         | string  | Target URL or hostname                                        |
| `topPorts`       | `50`    | `100`                                                         | `500` | `1000` | `5000` | Scan top N common ports |
| `portRanges`     | string  | Custom ranges, e.g. `"80,443,1000-1010"`                      |
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

| Parameter | Type   |
| --------- | ------ |
| `url` \*  | string |

---

### `loadTime`

Measure full page load time from any location. Optionally test reachability from multiple locations at once.

| Parameter         | Type            | Default | Description                                                                                                                |
| ----------------- | --------------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `url` \*          | string          | —       | Target URL                                                                                                                 |
| `proxyCountry`    | string          | —       | Country ISO code                                                                                                           |
| `followRedirect`  | boolean         | `false` | Follow redirects                                                                                                           |
| `targetCountries` | array of string | —       | Up to 3 ISO country codes to also test via proxy, alongside the default US test. Returns a per-location breakdown when set |

---

### `mixedContent`

Detect mixed content issues (HTTP resources on HTTPS pages).

| Parameter        | Type    | Default |
| ---------------- | ------- | ------- |
| `url` \*         | string  | —       |
| `proxyCountry`   | string  | —       |
| `followRedirect` | boolean | `false` |

---

### `dnsSec`

Check if DNSSEC is enabled and properly configured for a domain.

| Parameter | Type   |
| --------- | ------ |
| `url` \*  | string |

---

### `mtr`

Run an MTR (My Traceroute) network diagnostic test.

| Parameter        | Type    | Default |
| ---------------- | ------- | ------- |
| `url` \*         | string  | —       |
| `proxyCountry`   | string  | —       |
| `followRedirect` | boolean | `false` |

---

### `ping`

Ping a host and return latency.

| Parameter | Type   |
| --------- | ------ |
| `url` \*  | string |

---

### `lighthouse`

Run a full Lighthouse audit — performance, SEO, accessibility, and best practices.

| Parameter        | Type            | Default  | Description                |
| ---------------- | --------------- | -------- | -------------------------- | ----------------- |
| `url` \*         | string          | —        | Target URL                 |
| `device`         | `desktop`       | `mobile` | `desktop`                  | Device to emulate |
| `proxyCountry`   | string          | —        | Country ISO code           |
| `followRedirect` | boolean         | `false`  | Follow redirects           |
| `parameters`     | array of string | —        | Extra Lighthouse CLI flags |

---

## Environment Variables

| Variable       | Required | Description                                                      |
| -------------- | -------- | ---------------------------------------------------------------- |
| `API_KEY`      | ✅       | Your Geekflare API key                                           |
| `API_BASE_URL` | —        | Override the API base URL (default: `https://api.geekflare.com`) |

## Links

- [API Documentation](https://docs.geekflare.com/api/intro)
- [Geekflare API](https://dash.geekflare.com/)
- [Report Issues](https://geekflare.com/contact/?product=api&topic=bug)

## License

MIT
