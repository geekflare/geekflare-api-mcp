# Installing the Geekflare MCP server

These steps are for AI agents such as Cline that install MCP servers for a user.

## Requirements

- Node.js 18 or later (`npx` must be on the PATH).
- A Geekflare API key. If the user doesn't have one, ask them to sign up at https://geekflare.com/api and copy the key from the dashboard.

Never invent, guess or hardcode an API key. Ask the user for it.

## Configuration

Nothing needs to be cloned or built: the server is published to npm as `@geekflare/mcp` and runs over stdio with `npx`.

Add this entry to the MCP settings file (for Cline, `cline_mcp_settings.json`), keeping any existing servers:

```json
{
  "mcpServers": {
    "geekflare": {
      "command": "npx",
      "args": ["-y", "@geekflare/mcp"],
      "env": {
        "API_KEY": "<the user's Geekflare API key>"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

`API_KEY` is the only required setting.

## Verify

After the server connects, call `siteStatus` with `{"url": "https://example.com"}`. A successful response confirms the key works. An authentication error means the key is wrong or missing.

## Tools

- `search`: web search, including full Google results pages by country or city
- `webScrape`: page content as Markdown, HTML, JSON or LLM-ready text
- `metaScrape`: page metadata (title, description, Open Graph and more)
- `brand`: a domain's logos, colours and brand details
- `screenshot`, `url2Pdf`: capture a page as an image or PDF
- `siteStatus`, `dnsRecord`, `dnsSec`, `tlsScan`, `redirectCheck`, `brokenLink`, `loadTime`, `mixedContent`, `lighthouse`: website checks
- `ping`, `mtr`, `openPorts`: network diagnostics

Each call uses credits from the user's Geekflare account. Full parameters are in [README.md](README.md).
