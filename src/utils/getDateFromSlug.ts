export function getDateFromSlug(slug: string): Date {
  // 例: 2025-12-23-site-build
  const match = slug.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return new Date();

  const [, year, month, day] = match;
  return new Date(`${year}-${month}-${day}`);
}
