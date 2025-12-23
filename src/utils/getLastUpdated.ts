import { getCollection } from "astro:content";

function toDate(d: unknown): Date | null {
  if (!d) return null;
  if (d instanceof Date) return d;
  const parsed = new Date(String(d));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function getLastUpdatedYM() {
  // ここはあなたの collection 名に合わせて変えてね（例: "posts"）
  const posts = await getCollection("posts");

  // 優先順位：updatedAt（あれば）→ date
  const dates = posts
    .map((p) => toDate((p.data as any).updatedAt) ?? toDate((p.data as any).date))
    .filter((d): d is Date => d !== null);

  if (dates.length === 0) return null;

  const latest = new Date(Math.max(...dates.map((d) => d.getTime())));
  const yyyy = latest.getFullYear();
  const mm = String(latest.getMonth() + 1).padStart(2, "0");
  return `${yyyy}/${mm}`;
}
