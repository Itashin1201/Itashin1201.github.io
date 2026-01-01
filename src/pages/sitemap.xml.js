import { formatDate, getCategories, getMonths } from "../lib/blog.js";

export async function GET({ site }) {
  const siteUrl = site ?? new URL("https://itashin1201.github.io");

  const modules = import.meta.glob("./blog/**/*.md", { eager: true });
  const posts = Object.values(modules);

  const staticPaths = ["/", "/blog/", "/rss.xml", "/sitemap.xml"];

  const categories = getCategories(posts);
  const months = getMonths(posts);

  const urls = [];

  // 静的
  for (const p of staticPaths) {
    urls.push({
      loc: new URL(p.replace(/^\//, ""), siteUrl).toString(),
    });
  }

  // 記事
  for (const post of posts) {
    const loc = new URL(post.url, siteUrl).toString();
    const lastmod = post.frontmatter?.date ? formatDate(post.frontmatter.date) : null;
    urls.push({ loc, lastmod });
  }

  // カテゴリ / 月別
  for (const c of categories) {
    const loc = new URL(`/blog/category/${encodeURIComponent(c)}/`, siteUrl).toString();
    urls.push({ loc });
  }

  for (const m of months) {
    const loc = new URL(`/blog/month/${m}/`, siteUrl).toString();
    urls.push({ loc });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => {
    const lastmod = u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : "";
    return `  <url><loc>${u.loc}</loc>${lastmod}</url>`;
  })
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
