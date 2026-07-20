// Mobile clients send `Authorization: Bearer <token>` rather than a cookie
// jar (unlike the staff web session) — shared by member-auth and me routes.
export function extractBearerToken(
  header: string | undefined,
): string | undefined {
  if (!header) {
    return undefined;
  }
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : undefined;
}
