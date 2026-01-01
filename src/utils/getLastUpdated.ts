import { execFileSync } from "node:child_process";

let cachedLastUpdated: string | null | undefined;

/**
 * サイト全体の「最終更新日」を返す。
 *
 * 以前は「最新の記事の frontmatter.date」を使っていたため、
 * 記事本文やCSSを修正しても日付が変わらないことがありました。
 *
 * GitHub Actions (Pages) では OS のファイル作成日時は安定しないので、
 * リポジトリの最新コミット時刻をソースにします。
 */
export async function getLastUpdated(): Promise<string | null> {
  if (cachedLastUpdated !== undefined) return cachedLastUpdated;

  try {
    // %cI: ISO 8601 (timezone付き)
    const iso = execFileSync("git", ["log", "-1", "--format=%cI"], {
      encoding: "utf8",
    }).trim();

    if (!iso) {
      cachedLastUpdated = null;
      return null;
    }

    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      cachedLastUpdated = null;
      return null;
    }

    // 表示は JST 固定
    const parts = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(d)
      .reduce((acc: Record<string, string>, p) => {
        if (p.type !== "literal") acc[p.type] = p.value;
        return acc;
      }, {});

    cachedLastUpdated = `${parts.year}/${parts.month}/${parts.day}`;
    return cachedLastUpdated;
  } catch {
    cachedLastUpdated = null;
    return null;
  }
}
