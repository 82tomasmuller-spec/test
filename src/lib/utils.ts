import slugify from 'slugify';

export function generateSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    locale: 'cs',
  });
}

export function formatDate(date: Date | string, locale = 'cs-CZ'): string {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string, locale = 'cs-CZ'): string {
  return new Date(date).toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + '...';
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function estimateReadTime(html: string): number {
  const text = stripHtml(html);
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getExcerpt(html: string, maxLength = 160): string {
  const text = stripHtml(html).trim();
  return truncate(text, maxLength);
}

export function absoluteUrl(path: string): string {
  const base = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${base}${path}`;
}
