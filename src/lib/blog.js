export const SITE_NAME = "愛と幽相";
export const SITE_DESCRIPTION = "ただのブログ。";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

export function isDateOnly(raw) {
  return typeof raw === "string" && DATE_ONLY_RE.test(raw);
}

export function formatDate(raw) {
  // "YYYY-MM-DD" はそのまま返してUTC変換ズレを回避
  if (isDateOnly(raw)) return raw;

  const d = raw ? new Date(raw) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function toISO(raw) {
  const d = raw ? new Date(raw) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function normalizeCategory(category) {
  if (!category) return [];
  const arr = Array.isArray(category) ? category : [category];
  return arr
    .map((c) => String(c).trim())
    .filter((c) => c.length > 0);
}

export function getCategories(posts) {
  return [
    ...new Set(posts.flatMap((p) => normalizeCategory(p.frontmatter?.category))),
  ].sort((a, b) => a.localeCompare(b, "ja"));
}

export function getMonths(posts) {
  const months = posts
    .map((p) => formatDate(p.frontmatter?.date).slice(0, 7))
    .filter((m) => MONTH_RE.test(m));
  return [...new Set(months)].sort().reverse();
}

export function sortPostsDesc(posts) {
  return [...posts].sort((a, b) => {
    const da = new Date(a.frontmatter?.date ?? Date.now());
    const db = new Date(b.frontmatter?.date ?? Date.now());
    return db - da;
  });
}

export function slugifyClass(input) {
  // CSSクラスとして安全な文字列へ
  // 英数字カテゴリは読みやすいslugに、非ASCII（日本語など）はハッシュで一意化する
  const raw = String(input ?? "").trim();
  if (!raw) return "tag";

  // まずはASCIIで素直にslug化（英数字カテゴリ向け）
  const ascii = raw
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");

  if (ascii) return ascii;

  // 非ASCII（日本語など）はハッシュで一意なクラス名にする（FNV-1a 32bit）
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `tag-${(h >>> 0).toString(16)}`;
}

export function categoryHue(input) {
  // カテゴリ文字列から安定した色相(0-359)を生成（FNV-1a 32bit）
  const raw = String(input ?? "").trim();
  if (!raw) return 210;

  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 360;
}

export async function makeExcerpt(post, { maxLength = 140 } = {}) {
  const fm = post.frontmatter ?? {};
  if (fm.excerpt) return String(fm.excerpt);
  if (fm.description) return String(fm.description);

  const raw =
    typeof post.rawContent === "function" ? await post.rawContent() : "";
  if (!raw) return "";

  // frontmatterを除去
  const body = raw.replace(/^---[\s\S]*?---\s*/m, "");

  const lines = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !l.startsWith("#"));

  const cleaned = [];
  for (const line of lines) {
    const text = line
      .replace(/<[^>]+>/g, "") // HTML
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
      .replace(/[`*_>#-]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (text) cleaned.push(text);
    if (cleaned.join(" ").length >= maxLength) break;
  }

  const out = cleaned.join(" ").trim();
  if (!out) return "";
  return out.length > maxLength ? `${out.slice(0, maxLength - 1)}…` : out;
}
