# @geekflare/mcp

Official MCP (Model Context Protocol) server for the [Geekflare API](https://api.geekflare.com). Connect Geekflare's web tools directly to Claude, Cursor, and other AI assistants.

## Usage with Claude Desktop

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

## Usage with Docker

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

## Available Tools

| Tool            | Description                    |
| --------------- | ------------------------------ |
| `metaScrape`    | Scrape meta tags from a URL    |
| `dnsRecord`     | Look up DNS records            |
| `screenshot`    | Take a screenshot of a website |
| `siteStatus`    | Check if a site is up or down  |
| `redirectCheck` | Check redirect chain of a URL  |
| `brokenLink`    | Find broken links on a page    |
| `url2Pdf`       | Convert a URL to PDF           |
| `openPorts`     | Scan open ports on a host      |
| `tlsScan`       | Scan TLS/SSL configuration     |
| `loadTime`      | Test page load time            |
| `mixedContent`  | Check for mixed content issues |
| `dnsSec`        | Check DNSSEC configuration     |
| `mtr`           | Perform MTR network diagnostic |
| `ping`          | Ping a host                    |
| `lighthouse`    | Run Lighthouse audit           |
| `search`        | Search the web                 |

## Links

- [API Documentation](https://api.geekflare.com/auth/swagger-ui)
- [Geekflare API](https://geekflare.com/api)
- [Report Issues](https://github.com/geekflare/geekflare-api-mcp/issues)

## License

MIT
