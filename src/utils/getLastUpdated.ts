export async function getLastUpdated(): Promise<string | null> {
  const modules = import.meta.glob("../pages/blog/*.md");

  const dates: number[] = [];

  for (const path in modules) {
    const mod: any = await modules[path]();
    const date = mod.frontmatter?.date;
    if (!date) continue;

    const time = new Date(date).getTime();
    if (!isNaN(time)) {
      dates.push(time);
    }
  }

  if (dates.length === 0) return null;

  const latest = new Date(Math.max(...dates));
  const y = latest.getFullYear();
  const m = String(latest.getMonth() + 1).padStart(2, "0");
  const d = String(latest.getDate()).padStart(2, "0");

  return `${y}/${m}/${d}`;
}
