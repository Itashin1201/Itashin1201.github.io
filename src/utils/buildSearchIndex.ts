export async function buildSearchIndex() {
  const modules = import.meta.glob("../pages/blog/**/*.md");

  const items: Array<{
    title?: string;
    description?: string;
    date?: string;
    url?: string;
    category?: string;
    content: string;
  }> = [];

  for (const path in modules) {
    const mod: any = await modules[path]();
    const { title, date, description, category } = mod.frontmatter ?? {};
    const url = mod.url;

    // ★ ここがポイント：await する
    const html: string = mod.compiledContent ? await mod.compiledContent() : "";

    // HTMLタグを除去して本文テキスト化
    const content = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ")
      // よくあるHTMLエンティティを軽く戻す（最低限）
      .replace(/&nbsp;|&#160;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    items.push({
      title,
      description,
      date,
      url,
      category,
      content,
    });
  }

  // 任意：日付降順（文字列YYYY-MM-DD想定）
  items.sort((a, b) =>
    String(b.date ?? "").localeCompare(String(a.date ?? ""))
  );

  return items;
}
