export async function buildSearchIndex() {
  const modules = import.meta.glob("../pages/blog/*.md");

  const items = [];

  for (const path in modules) {
    const mod: any = await modules[path]();

    const { title, date, description } = mod.frontmatter ?? {};

    // ★ Astroが解決した「正しいURL」
    const url = mod.url;

    // 本文（検索用）
    const content = mod.compiledContent
      ? String(mod.compiledContent())
      : "";

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
