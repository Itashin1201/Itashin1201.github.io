import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PAGES_DIR = path.resolve(process.cwd(), "src", "pages");
const BLOG_DIR = path.join(PAGES_DIR, "blog");

let ROUTE_MAP: Map<string, string> | null = null;

function toPosix(p: string) {
  return p.replaceAll("\\", "/");
}

function normalizeRoute(p: string) {
  // 先頭/末尾の / を揃える
  if (!p.startsWith("/")) p = `/${p}`;
  if (!p.endsWith("/")) p = `${p}/`;
  return p;
}

function stripBase(pathname: string) {
  // GitHub Pages の BASE_URL ありでも無しでも動くように剥がす
  const base = import.meta.env.BASE_URL ?? "/";
  const b = normalizeRoute(base);
  const pn = normalizeRoute(pathname);

  if (b !== "/" && pn.startsWith(b)) {
    return normalizeRoute(pn.slice(b.length));
  }
  return pn;
}

function walk(dir: string, out: string[] = []) {
  if (!fs.existsSync(dir)) return out;

  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
    } else if (st.isFile()) {
      if (name.endsWith(".md") || name.endsWith(".mdx")) out.push(full);
    }
  }
  return out;
}

function buildRouteMap() {
  const m = new Map<string, string>();

  const files = walk(BLOG_DIR);
  for (const abs of files) {
    const relFromPages = toPosix(path.relative(PAGES_DIR, abs)); // blog/202601/x.md
    const noExt = relFromPages.replace(/\.(md|mdx)$/i, "");       // blog/202601/x
    const parts = noExt.split("/");

    // index.md はそのディレクトリのルート扱い
    let route: string;
    if (parts.at(-1) === "index") {
      route = "/" + parts.slice(0, -1).join("/") + "/";
    } else {
      route = "/" + noExt + "/";
    }
    m.set(normalizeRoute(route), abs);
  }

  return m;
}

function getFirstCommitISO(relPath: string): string | null {
  try {
    // 最古（初回）コミットを取りたいので --reverse + -1 を使う
    const out = execFileSync(
      "git",
      ["log", "--follow", "--reverse", "--format=%cI", "-1", "--", relPath],
      { encoding: "utf8" }
    ).trim();

    if (out) return out;

    // もし環境差で取れない場合は全件取って最後（最古）にフォールバック
    const out2 = execFileSync(
      "git",
      ["log", "--follow", "--format=%cI", "--", relPath],
      { encoding: "utf8" }
    ).trim();

    if (!out2) return null;
    const lines = out2.split(/\r?\n/).filter(Boolean);
    return lines.at(-1) ?? null;
  } catch {
    return null;
  }
}

export function getPostTimeHHMMSS(pathname: string): string | null {
  if (!ROUTE_MAP) ROUTE_MAP = buildRouteMap();

  const routeKey = stripBase(pathname); // /blog/202601/xxx/
  const file = ROUTE_MAP.get(routeKey);
  if (!file) return null;

  const rel = toPosix(path.relative(process.cwd(), file));
  const iso = getFirstCommitISO(rel);
  if (!iso) return null;

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
