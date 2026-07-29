export function readSessionCookie(
  cookieHeader: string | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  const segments = cookieHeader.split(';');

  for (const segment of segments) {
    const [cookieName, ...cookieValueParts] = segment.trim().split('=');

    if (cookieName === name) {
      return decodeURIComponent(cookieValueParts.join('='));
    }
  }

  return undefined;
}
