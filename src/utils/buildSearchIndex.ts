export async function buildSearchIndex() {
  const modules = import.meta.glob("../pages/blog/*.md");

  const items = [];

  for (const path in modules) {
    const mod: any = await modules[path]();
    const { title, date, description } = mod.frontmatter ?? {};

    const url = mod.url;

    // HTML化された本文を文字列に
    const html = mod.compiledContent
      ? String(mod.compiledContent())
      : "";

    // ★ HTMLタグを除去してプレーンテキスト化
    const content = html
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
