import { SITE_NAME, SITE_DESCRIPTION, formatDate } from "../lib/blog.js";

const escapeXml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const stripTags = (s) => String(s).replace(/<[^>]*>/g, "").trim();

export async function GET({ site }) {
  const siteUrl = site ?? new URL("https://itashin1201.github.io");

  const modules = import.meta.glob("./blog/**/*.md", { eager: true });
  const posts = Object.values(modules);

  posts.sort((a, b) => {
    const da = new Date(a.frontmatter?.date ?? Date.now());
    const db = new Date(b.frontmatter?.date ?? Date.now());
    return db - da;
  });

  const items = await Promise.all(
    posts.map(async (post) => {
      const url = new URL(post.url, siteUrl).toString();
      const title = post.frontmatter?.title ?? "(no title)";
      const rawDate = post.frontmatter?.date;

      const pubDate = rawDate
        ? new Date(formatDate(rawDate)).toUTCString()
        : new Date().toUTCString();

      let excerpt = post.frontmatter?.excerpt || post.frontmatter?.description || "";
      if (!excerpt && typeof post.rawContent === "function") {
        try {
          const raw = await post.rawContent();
          excerpt = raw
            .replace(/^---[\s\S]*?---\s*/m, "")
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean)
            .filter((l) => !l.startsWith("#"))[0] ?? "";
        } catch {
          // ignore
        }
      }

      const desc = escapeXml(stripTags(excerpt));

      return `
      <item>
        <title>${escapeXml(title)}</title>
        <link>${escapeXml(url)}</link>
        <guid isPermaLink="true">${escapeXml(url)}</guid>
        <pubDate>${escapeXml(pubDate)}</pubDate>
        <description>${desc}</description>
      </item>`;
    })
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(siteUrl.toString())}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>ja</language>
    ${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
