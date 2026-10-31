# Security Policy

## Supported versions

Security fixes go into the latest release of `@geekflare/mcp` on npm (and the matching `geekflarehq/geekflare-api-mcp` Docker image), and into the hosted server at `https://mcp.geekflare.com`. Please upgrade to the latest version before reporting an issue.

| Version | Supported |
| ------- | --------- |
| 0.5.x   | Yes       |
| < 0.5   | No        |

## Reporting a vulnerability

Please don't report security issues in public GitHub issues, discussions or pull requests.

Email **support@geekflare.com** with the subject "Security: geekflare-api-mcp" and include:

- the version, or whether you used the hosted server
- what the issue is and what an attacker could do with it
- steps to reproduce, or a proof of concept

Don't include a real API key in your report. If one is needed to reproduce the issue, we'll arrange a test key.

We'll confirm we've received your report, keep you updated while we investigate, and credit you when the fix is released unless you'd rather stay anonymous.

## Scope

In scope:

- the MCP server code in this repository
- the npm package and Docker image built from it
- the hosted MCP server at `mcp.geekflare.com`

Out of scope:

- vulnerabilities in the websites the tools fetch, scrape or check
- issues that need a leaked or stolen Geekflare API key
- denial-of-service or load testing against Geekflare services

For issues with the Geekflare API itself (`api.geekflare.com`) or your account, also email support@geekflare.com.

## Handling API keys

The server reads your key from the `API_KEY` environment variable, or from the hosted URL. Keep keys out of source control and shared config files. If a key may have been exposed, rotate it in the [Geekflare dashboard](https://dash.geekflare.com).
