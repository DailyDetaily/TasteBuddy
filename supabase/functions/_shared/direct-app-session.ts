// Rejection filter only. The caller MUST still authenticate with Supabase.
// OAuth credentials are valid only at the MCP resource, never for account writes.
export function isDirectAppSessionToken(token: string): boolean {
  try {
    const part = token.split('.')[1];
    const claims = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    return claims.client_id == null && claims.role === 'authenticated' && claims.aud === 'authenticated';
  } catch { return false; }
}
