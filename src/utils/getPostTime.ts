import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

type Mode = "first" | "latest";

const cache = new Map<string, string | null>();

function toPosix(p: string) {
  return p.replaceAll("\\", "/");
}

function normalizeSlash(p: string) {
  if (!p.startsWith("/")) p = `/${p}`;
  if (!p.endsWith("/")) p = `${p}/`;
  return p;
}

function stripBase(pathname: string) {
  const base = normalizeSlash(import.meta.env.BASE_URL ?? "/");
  const pn = normalizeSlash(pathname);

  if (base !== "/" && pn.startsWith(base)) {
    // "/<base>/blog/..." -> "/blog/..."
    return normalizeSlash(pn.slice(base.length));
  }
  return pn;
}

function findSourceFileFromPathname(pathname: string): string | null {
  // /blog/202601/2026-01-01/ -> src/pages/blog/202601/2026-01-01.md (or index.md)
  const clean = stripBase(pathname).replace(/^\/+|\/+$/g, ""); // "blog/202601/2026-01-01"
  if (!clean) return null;

  const absNoExt = path.join(process.cwd(), "src", "pages", ...clean.split("/"));

  const candidates = [
    `${absNoExt}.md`,
    `${absNoExt}.mdx`,
    path.join(absNoExt, "index.md"),
    path.join(absNoExt, "index.mdx"),
  ];

  for (const f of candidates) {
    if (fs.existsSync(f)) return f;
  }
  return null;
}

function gitTimeISO(relPath: string, mode: Mode): string | null {
  try {
    const args =
      mode === "first"
        // 最古（初回コミット）
        ? ["log", "--follow", "--reverse", "-1", "--format=%cI", "--", relPath]
        // 最新（更新コミット）
        : ["log", "--follow", "-1", "--format=%cI", "--", relPath];

    const out = execFileSync("git", args, { encoding: "utf8" }).trim();
    return out || null;
  } catch {
    return null;
  }
}

function toHHMMSS(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  return `${map.hour}:${map.minute}:${map.second}`;
}

/**
 * mode:
 *  - "first"  : その記事の「書いた時刻」（初回コミット）…編集しても変わらない
 *  - "latest" : その記事の「更新時刻」（最新コミット）…編集で変わる
 */
export function getPostTimeHHMMSS(pathname: string, mode: Mode = "first"): string | null {
  const key = `${mode}:${pathname}`;
  if (cache.has(key)) return cache.get(key) ?? null;

  const file = findSourceFileFromPathname(pathname);
  if (!file) {
    cache.set(key, null);
    return null;
  }

  const rel = toPosix(path.relative(process.cwd(), file));
  const iso = gitTimeISO(rel, mode);
  const hhmmss = iso ? toHHMMSS(iso) : null;

  cache.set(key, hhmmss);
  return hhmmss;
}
