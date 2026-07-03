# @geekflare/mcp

Official MCP (Model Context Protocol) server for the [Geekflare API](https://geekflare.com/api/). Connect Geekflare's web intelligence tools directly to Claude, Cursor, Windsurf, and other AI assistants.

## Setup

### Get an API Key

Sign up at [geekflare.com/api](https://geekflare.com/api) and copy your API key from the dashboard.

### Claude Desktop

Add this to your `claude_desktop_config.json`:

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

Scrape full page content from any URL. Returns HTML, Markdown, JSON, or LLM-optimised text.

| Parameter      | Type                  | Default        | Description                                                                                          |
| -------------- | --------------------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| `url` \*       | string                | —              | Target URL                                                                                           |
| `device`       | `desktop` \| `mobile` | `desktop`      | Device to emulate                                                                                    |
| `format`       | array                 | `["markdown"]` | Output formats (up to 3): `html`, `markdown`, `json`, `markdown-llm`, `html-llm`, `text`, `text-llm` |
| `proxyCountry` | string                | —              | Route through a country ISO code (e.g. `"us"`)                                                       |
| `renderJS`     | boolean               | `true`         | Execute JavaScript before extracting. Disable for faster static scrapes                              |
| `fileOutput`   | boolean               | `false`        | Return a download URL instead of inline content                                                      |
| `blockAds`     | boolean               | `true`         | Block ads during scrape                                                                              |
| `stealth`      | boolean               | `false`        | Bypass CAPTCHAs (slower)                                                                             |

---

### `metaScrape`

Scrape meta tags — title, description, Open Graph, Twitter cards, and more.

| Parameter      | Type                  | Default   | Description      |
| -------------- | --------------------- | --------- | ---------------- |
| `url` \*       | string                | —         | Target URL       |
| `device`       | `desktop` \| `mobile` | `desktop` |                  |
| `format`       | `json` \| `markdown`  | `json`    |                  |
| `proxyCountry` | string                | —         | Country ISO code |
| `renderJS`     | boolean               | `true`    |                  |
| `fileOutput`   | boolean               | `false`   |                  |
| `blockAds`     | boolean               | `true`    |                  |

---

### `screenshot`

Capture a screenshot of any website. Supports full-page, element-only, Retina, dark mode, transparent backgrounds, and AI-friendly link highlighting.

| Parameter               | Type                        | Default   | Description                                                    |
| ----------------------- | --------------------------- | --------- | -------------------------------------------------------------- |
| `url` \*                | string                      | —         | Target URL                                                     |
| `device`                | `desktop` \| `mobile`       | `desktop` |                                                                |
| `type`                  | `png` \| `jpeg` \| `webp`   | `png`     |                                                                |
| `proxyCountry`          | string                      | —         | Country ISO code                                               |
| `fullPage`              | boolean                     | `false`   |                                                                |
| `selector`              | string                      | —         | CSS selector for the element to capture                        |
| `fallbackToFullPage`    | boolean                     | `false`   | Fall back to a full-page capture if `selector` isn't found     |
| `blockAds`              | boolean                     | `true`    |                                                                |
| `hideCookie`            | boolean                     | `true`    | Remove cookie banners                                          |
| `skipCaptcha`           | boolean                     | `true`    | Bypass Cloudflare / reCAPTCHA                                  |
| `addTimestamp`          | boolean                     | `false`   |                                                                |
| `highlightLinks`        | boolean                     | `false`   | Draw borders around links/buttons — great for AI vision models |
| `pageHeight`            | number                      | —         | Custom page height (px)                                        |
| `viewportWidth`         | number                      | —         | Viewport width (px, default 1366)                              |
| `viewportHeight`        | number                      | —         | Viewport height (px, default 768)                              |
| `captureBeyondViewport` | boolean                     | —         | Capture content beyond the configured viewport                 |
| `delay`                 | number                      | —         | Seconds to wait after page load                                |
| `quality`               | number                      | `90`      | Image quality 1–100                                            |
| `scaleFactor`           | number                      | —         | Device pixel ratio (use 2–3 for Retina)                        |
| `theme`                 | `light` \| `dark` \| `auto` | `auto`    | Color scheme                                                   |
| `removeBackground`      | boolean                     | `false`   | Remove page background (PNG only)                              |
| `disableAnimations`     | boolean                     | `false`   | Freeze CSS animations before capture                           |
| `inline`                | boolean                     | `false`   | Return image data inline instead of a CDN URL                  |

---

### `search`

Search the web and return clean, structured results. Supports web, news, and image search with optional AI-grounded answers.

| Parameter        | Type                              | Default | Description                                        |
| ---------------- | --------------------------------- | ------- | -------------------------------------------------- |
| `query` \*       | string                            | —       | Search query                                       |
| `limit`          | number                            | `10`    | Number of results                                  |
| `time`           | string                            | —       | Time filter: `any`, `d`, `w`, `m`, `y`, `d7`, `h6` |
| `location`       | string                            | —       | Country ISO code to localise results               |
| `source`         | `web` \| `news` \| `images`       | `web`   |                                                    |
| `category`       | `general` \| `code` \| `research` | —       |                                                    |
| `format`         | `json` \| `markdown` \| `html`    | `json`  |                                                    |
| `includeDomains` | string                            | —       | Comma-separated domains to include                 |
| `excludeDomains` | string                            | —       | Comma-separated domains to exclude                 |
| `groundedAnswer` | boolean                           | `false` | Generate an AI answer synthesised from results     |
| `scrape`         | boolean                           | —       | Also scrape top result pages                       |
| `scrapeLimit`    | number                            | —       | How many pages to scrape (requires `scrape: true`) |

---

### `dnsRecord`

Look up DNS records for a domain.

| Parameter | Type                                                          | Default   |
| --------- | ------------------------------------------------------------- | --------- |
| `url` \*  | string                                                        | —         |
| `types`   | array of `A` `AAAA` `CNAME` `MX` `NS` `SOA` `TXT` `CAA` `SRV` | all types |

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

| Parameter       | Type                                           | Default    | Description                       |
| --------------- | ---------------------------------------------- | ---------- | --------------------------------- |
| `url` \*        | string                                         | —          |                                   |
| `device`        | `desktop` \| `mobile`                          | `desktop`  |                                   |
| `format`        | `a4` `a3` `a5` `a6` `letter` `legal` `a0`–`a2` | `a4`       | Paper size                        |
| `orientation`   | `portrait` \| `landscape`                      | `portrait` |                                   |
| `proxyCountry`  | string                                         | —          | Country ISO code                  |
| `scale`         | number                                         | —          | Zoom level (e.g. `0.8` to shrink) |
| `margin.top`    | number                                         | `25`       | Top margin (mm)                   |
| `margin.bottom` | number                                         | `25`       | Bottom margin (mm)                |
| `margin.left`   | number                                         | `25`       | Left margin (mm)                  |
| `margin.right`  | number                                         | `25`       | Right margin (mm)                 |
| `hideCookie`    | boolean                                        | `true`     | Remove cookie banners             |
| `skipCaptcha`   | boolean                                        | `true`     | Bypass anti-bot challenges        |
| `addTimestamp`  | boolean                                        | `false`    |                                   |

---

### `openPorts`

Scan open ports on a host.

| Parameter    | Type                           | Description                             |
| ------------ | ------------------------------ | --------------------------------------- |
| `url` \*     | string                         | Target URL or hostname                  |
| `topPorts`   | `50` `100` `500` `1000` `5000` | Scan top N common ports                 |
| `portRanges` | string                         | Custom ranges e.g. `"80,443,1000-1010"` |

---

### `tlsScan`

Inspect TLS/SSL configuration — protocols, ciphers, certificate details.

| Parameter | Type   |
| --------- | ------ |
| `url` \*  | string |

---

### `loadTime`

Measure full page load time from any location.

| Parameter        | Type    | Default |
| ---------------- | ------- | ------- |
| `url` \*         | string  | —       |
| `proxyCountry`   | string  | —       |
| `followRedirect` | boolean | `false` |

---

### `ttfb`

Measure Time To First Byte (TTFB).

| Parameter        | Type    | Default |
| ---------------- | ------- | ------- |
| `url` \*         | string  | —       |
| `followRedirect` | boolean | `false` |

---

### `httpHeader`

Retrieve HTTP response headers for a URL.

| Parameter        | Type    | Default |
| ---------------- | ------- | ------- |
| `url` \*         | string  | —       |
| `proxyCountry`   | string  | —       |
| `followRedirect` | boolean | `false` |

---

### `httpProtocol`

Check which HTTP protocol versions (HTTP/1.1, HTTP/2, HTTP/3) a server supports.

| Parameter        | Type    | Default |
| ---------------- | ------- | ------- |
| `url` \*         | string  | —       |
| `followRedirect` | boolean | `false` |

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

| Parameter        | Type                  | Default   | Description                                                 |
| ---------------- | --------------------- | --------- | ----------------------------------------------------------- |
| `url` \*         | string                | —         |                                                             |
| `device`         | `desktop` \| `mobile` | `desktop` |                                                             |
| `proxyCountry`   | string                | —         | Country ISO code                                            |
| `followRedirect` | boolean               | `false`   |                                                             |
| `parameters`     | string                | —         | Extra Lighthouse CLI flags (e.g. `"--only-categories=seo"`) |

---

## Environment Variables

| Variable       | Required | Description                                                      |
| -------------- | -------- | ---------------------------------------------------------------- |
| `API_KEY`      | ✅       | Your Geekflare API key                                           |
| `API_BASE_URL` | —        | Override the API base URL (default: `https://api.geekflare.com`) |

---

## Links

- [API Documentation](https://docs.geekflare.com/api/intro)
- [Geekflare API](https://dash.geekflare.com/)
- [Report Issues](https://geekflare.com/contact/?product=api&topic=bug)

## License

MIT
