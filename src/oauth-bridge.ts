import type http from 'http';
import { createRemoteJWKSet, jwtVerify } from 'jose';

/**
 * OAuth bridge for the Geekflare MCP service. Works for ChatGPT and any other MCP client that uses OAuth.
 *
 *   client --Bearer <OAuth token>--> POST <one of OAUTH_MCP_RESOURCES>   (e.g. /chatgpt/mcp)
 *     1. verify the token (signature via the issuer's JWKS, iss, aud, exp, scope)
 *     2. ask the backend: is this connection still active, and what is the account's API key?
 *     3. hand the key to the existing createMcpServer(apiKey); it never leaves this process
 */

const ISSUER: string = (process.env.OAUTH_ISSUER ?? 'https://dash.geekflare.com').replace(
  /\/+$/,
  ''
);
const REQUIRED_SCOPE = 'geekflare:use';
const BRIDGE_SECRET = process.env.OAUTH_BRIDGE_SECRET ?? '';
const KEY_CACHE_MS = 60_000;
const trimPath = (pathname: string): string => pathname.replace(/\/+$/, '');

/** MCP endpoint URLs that accept OAuth tokens. Add one per app if you want separate URLs. */
const RESOURCES: string[] = String(
  process.env.OAUTH_MCP_RESOURCES ?? 'https://mcp.geekflare.com/chatgpt/mcp'
)
  .split(',')
  .map((value: string) => value.trim().replace(/\/+$/, ''))
  .filter(Boolean);

/** Effective OAuth settings, printed at startup so a missing env var is visible in the container logs. */
export const describeOAuthConfig = () => ({
  issuer: ISSUER,
  resources: RESOURCES,
  bridgeSecretConfigured: BRIDGE_SECRET.length > 0,
});

const resourceByPath = new Map<string, string>(
  RESOURCES.map((resource: string): [string, string] => [
    trimPath(new URL(resource).pathname),
    resource,
  ])
);

const jwks = createRemoteJWKSet(new URL(`${ISSUER}/oauth/jwks`), {
  cooldownDuration: 30_000,
  cacheMaxAge: 10 * 60_000,
});

export interface OAuthPrincipal {
  /** Geekflare account id (token `sub`). */
  userId: string;
  /** OAuth grant id (token `sid`); lets the backend revoke a single connection. */
  grantId: string;
}

export class BridgeError extends Error {
  constructor(
    public readonly status: 401 | 503,
    public readonly code: 'missing_token' | 'invalid_token' | 'temporarily_unavailable',
    description: string
  ) {
    super(description);
  }
}

const METADATA_PREFIXES = [
  '/.well-known/oauth-protected-resource', // standard (RFC 9728)
  '/auth/.well-known/oauth-protected-resource', // keep the old one working
];

const metadataUrl = (resource: string): string => {
  const url = new URL(resource);
  return `${url.origin}/.well-known/oauth-protected-resource${trimPath(url.pathname)}`;
};

export function matchMetadataResource(pathname: string): string | undefined {
  const path = trimPath(pathname);
  for (const prefix of METADATA_PREFIXES) {
    if (path === prefix) return RESOURCES[0];
    if (path.startsWith(`${prefix}/`)) return resourceByPath.get(path.slice(prefix.length));
  }
  return undefined;
}
/** Returns the resource URL if this request path is an OAuth-protected MCP endpoint. */
export const matchOAuthResource = (pathname: string): string | undefined =>
  resourceByPath.get(trimPath(pathname));

/** RFC 9728 protected-resource metadata: tells the client which authorization server to use. */
export function serveProtectedResourceMetadata(res: http.ServerResponse, resource: string): void {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(
    JSON.stringify({
      resource,
      authorization_servers: [ISSUER],
      scopes_supported: [REQUIRED_SCOPE],
      bearer_methods_supported: ['header'],
      resource_documentation: 'https://docs.geekflare.com/intro',
    })
  );
}

export async function authenticateOAuthRequest(
  req: http.IncomingMessage,
  resource: string
): Promise<OAuthPrincipal> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    throw new BridgeError(401, 'missing_token', 'Authentication required');

  try {
    const { payload } = await jwtVerify(header.slice(7).trim(), jwks, {
      issuer: ISSUER,
      audience: resource, // a token issued for one MCP endpoint is useless on another
      algorithms: ['ES256'],
      clockTolerance: 5,
    });
    const scopes = typeof payload.scope === 'string' ? payload.scope.split(' ') : [];
    if (!scopes.includes(REQUIRED_SCOPE)) throw new Error('insufficient scope');
    if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string')
      throw new Error('malformed token');
    return { userId: payload.sub, grantId: payload.sid };
  } catch (error) {
    // Failing to fetch the JWKS is our problem; do not make the user re-authenticate for it.
    if (error instanceof Error && error.name === 'JWKSTimeout') {
      throw new BridgeError(503, 'temporarily_unavailable', 'Authorization server unreachable');
    }
    throw new BridgeError(401, 'invalid_token', 'The access token is invalid or expired');
  }
}

// ── account -> API key (cached briefly; never logged, never returned to the client) ──

const keyCache = new Map<string, { apiKey: string; expires: number }>();

/** `baseUrl` is the same API_BASE_URL the MCP service already uses for tool calls (the backend, through the gateway). */
export async function resolveApiKey(principal: OAuthPrincipal, baseUrl: string): Promise<string> {
  const cached = keyCache.get(principal.grantId);
  if (cached && cached.expires > Date.now()) return cached.apiKey;
  keyCache.delete(principal.grantId);

  if (!BRIDGE_SECRET) {
    console.error('[oauth] OAUTH_BRIDGE_SECRET is not configured');
    throw new BridgeError(503, 'temporarily_unavailable', 'Bridge is not configured');
  }

  let result: { active?: boolean; apiKey?: string };
  try {
    const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/auth/oauth/internal/api-key`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-bridge-secret': BRIDGE_SECRET },
      body: JSON.stringify({ userId: principal.userId, grantId: principal.grantId }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`backend status ${response.status}`);
    // An empty body counts as "not active" (the backend strips empty values from responses).
    const text = await response.text();
    result = text ? (JSON.parse(text) as { active?: boolean; apiKey?: string }) : {};
  } catch (error) {
    console.error('[oauth] key lookup failed:', error instanceof Error ? error.message : 'unknown');
    throw new BridgeError(503, 'temporarily_unavailable', 'Could not verify the account');
  }

  // Deleted account or disconnected app: make the client start the OAuth flow again.
  if (!result.active || !result.apiKey)
    throw new BridgeError(401, 'invalid_token', 'This connection is no longer active');

  keyCache.set(principal.grantId, { apiKey: result.apiKey, expires: Date.now() + KEY_CACHE_MS });
  return result.apiKey;
}

/** Sends the OAuth/MCP challenge (RFC 6750 + RFC 9728). Returns true if it handled the error. */
export function sendBridgeError(
  res: http.ServerResponse,
  error: unknown,
  resource: string
): boolean {
  if (!(error instanceof BridgeError)) return false;
  if (error.status === 401) {
    const params = [`resource_metadata="${metadataUrl(resource)}"`, `scope="${REQUIRED_SCOPE}"`];
    if (error.code === 'invalid_token')
      params.push(`error="invalid_token"`, `error_description="${error.message}"`);
    res.setHeader('WWW-Authenticate', `Bearer ${params.join(', ')}`);
  }
  res.writeHead(error.status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: error.code, error_description: error.message }));
  return true;
}
