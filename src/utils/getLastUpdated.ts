import { execFileSync } from "node:child_process";

let cachedLastUpdated: string | null | undefined;

/**
 * サイト全体の「最終更新日時」を返す。
 *
 * GitHub Pages (Actions) では OS のファイル作成日時は安定しないため、
 * リポジトリの最新コミット時刻をソースにします。
 *
 * 返り値: JST で "YYYY/MM/DD HH:MM:SS"
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

    // 表示は JST 固定（秒まで出す。日付だけだと同日コミットで変化が見えないため）
    const parts = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      // Node の環境差で 24時表記になる事故を避ける
      hourCycle: "h23",
    })
      .formatToParts(d)
      .reduce((acc: Record<string, string>, p) => {
        if (p.type !== "literal") acc[p.type] = p.value;
        return acc;
      }, {});

    cachedLastUpdated = `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
    return cachedLastUpdated;
  } catch {
    cachedLastUpdated = null;
    return null;
  }
}
