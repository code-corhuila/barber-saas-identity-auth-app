/** Where the shell sent the user from (its auth guard adds ?returnUrl=...). Only internal paths. */
export function returnUrl(search: string): string {
  const target = new URLSearchParams(search).get('returnUrl');
  return target && target.startsWith('/') && !target.startsWith('//') ? target : '/';
}
