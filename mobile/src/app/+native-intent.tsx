import { resolveDeepLink } from '@/utils/deepLinking';

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  if (!path) return '/';

  if (
    path.includes('access_token=') ||
    path.includes(':/oauthredirect') ||
    path.includes('://oauth') ||
    (path.includes('code=') && path.includes('state=')) ||
    (path.includes('error=') && path.includes('state='))
  ) {
    return '/';
  }

  const resolved = resolveDeepLink(path);
  if (resolved) {
    const query =
      resolved.params && Object.keys(resolved.params).length > 0
        ? `?${new URLSearchParams(resolved.params).toString()}`
        : '';
    return `${resolved.pathname}${query}`;
  }

  return path;
}
