export function safeHttpUrl(value: unknown, base = window.location.origin): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const url = new URL(value.trim(), base);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

export function safeColor(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const candidate = value.trim();
  if (!candidate || /[;{}<>]/.test(candidate)) return fallback;
  if (typeof CSS !== 'undefined' && CSS.supports('color', candidate)) return candidate;
  if (/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(candidate)) return candidate;
  return fallback;
}

export function safeFontFamily(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const candidate = value.trim();
  if (!candidate || candidate.length > 80 || /[;{}<>"'`]/.test(candidate)) return fallback;
  return candidate;
}
