import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Route (pathname) -> module specifier (relative import path)
let cachedRouteToModule: Record<string, string> | null | undefined;

function normalizePath(p: string): string {
  return p.endsWith("/") ? p : `${p}/`;
}

function buildRouteMap(): Record<string, string> {
  const modules = import.meta.glob("../pages/blog/**/*.md");
  const map: Record<string, string> = {};

  for (const specifier of Object.keys(modules)) {
    // specifier example: "../pages/blog/202512/2025-12-22.md"
    const rel = specifier.replace(/^\.\.\/pages/, "");
    const noExt = rel.replace(/\.md$/, "");

    // Astro routing: index.md -> "/.../" , others -> "/.../name/"
    const route = noExt.endsWith("/index")
      ? `${noExt.slice(0, -"/index".length)}/`
      : `${noExt}/`;

    map[normalizePath(route)] = specifier;
  }

  return map;
}

function getRouteMap(): Record<string, string> {
  if (cachedRouteToModule) return cachedRouteToModule;
  if (cachedRouteToModule === null) return {};

  try {
    cachedRouteToModule = buildRouteMap();
    return cachedRouteToModule;
  } catch {
    cachedRouteToModule = null;
    return {};
  }
}

function safeGit(cmd: string): string | null {
  try {
    const out = execSync(cmd, {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    });
    const s = String(out ?? "").trim();
    return s || null;
  } catch {
    return null;
  }
}

function formatHHMMSS(isoOrRfc3339: string): string | null {
  const d = new Date(isoOrRfc3339);
  if (Number.isNaN(d.getTime())) return null;

  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .formatToParts(d)
    .reduce((acc: Record<string, string>, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});

  const h = parts.hour ?? "00";
  const m = parts.minute ?? "00";
  const s = parts.second ?? "00";
  return `${h}:${m}:${s}`;
}

/**
 * Try to infer the post's time-of-day from git history, based on the page route.
 *
 * - Prefers the "created" timestamp (first commit where the file was added)
 * - Falls back to the latest commit timestamp
 * - Returns null if git isn't available (e.g. zip builds) or route isn't a post
 */
export function getPostTimeHHMMSS(routePathname: string): string | null {
  const route = normalizePath(routePathname);
  const routeMap = getRouteMap();
  const specifier = routeMap[route];
  if (!specifier) return null;

  // Convert module specifier to an actual filesystem path
  let filePath: string;
  try {
    filePath = fileURLToPath(new URL(specifier, import.meta.url));
  } catch {
    return null;
  }

  // Created time (first add). Requires enough git history.
  const created = safeGit(
    `git log --diff-filter=A --follow --format=%cI -1 -- "${filePath}"`
  );
  const createdHHMMSS = created ? formatHHMMSS(created) : null;
  if (createdHHMMSS) return createdHHMMSS;

  // Fallback: latest commit time
  const updated = safeGit(`git log -1 --format=%cI -- "${filePath}"`);
  const updatedHHMMSS = updated ? formatHHMMSS(updated) : null;
  return updatedHHMMSS;
}
