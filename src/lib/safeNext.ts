/** Only same-site relative paths are allowed after login, so ?next= cannot become an open redirect (CWE-601). */
export function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/dashboard'
  return next
}
