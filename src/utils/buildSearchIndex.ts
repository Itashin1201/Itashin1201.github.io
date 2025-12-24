export async function buildSearchIndex() {
  const modules = import.meta.glob("../pages/blog/*.md");

  const items = [];

  for (const path in modules) {
    const mod: any = await modules[path]();
    const { title, date, description } = mod.frontmatter ?? {};
    const url = mod.url;

    // ★ ここがポイント：await する
    const html = mod.compiledContent
      ? await mod.compiledContent()
      : "";

    // HTMLタグを除去して本文テキスト化
    const content = String(html)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    items.push({
      title,
      description,
      date,
      url,
      content,
    });
  }

  return items;
}
