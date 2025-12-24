export async function buildSearchIndex() {
  const modules = import.meta.glob("../pages/blog/*.md");

  const items = [];

  for (const path in modules) {
    const mod: any = await modules[path]();
    const { title, date, description } = mod.frontmatter ?? {};

    const url = path
      .replace("../pages", import.meta.env.BASE_URL)
      .replace(/\.md$/, "/");

    const content = mod.compiledContent
      ? mod.compiledContent()
      : "";

    items.push({
      title,
      description,
      date,
      url,
      content: String(content),
    });
  }

  return items;
}
