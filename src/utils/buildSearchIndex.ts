import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

type SearchItem = {
  title: string;
  description: string;
  date: string;
  url: string;
  content: string;
  category?: string | string[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.resolve(__dirname, "../pages/blog");
const OUTPUT_FILE = path.resolve(__dirname, "../../public/search-index.json");

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

function buildIndex() {
  const files = walk(BLOG_DIR);
  const items: SearchItem[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf-8");
    const { data, content } = matter(raw);

    const title = data.title ?? "";
    const description = data.description ?? "";
    const date = data.date ?? "";
    const category = data.category;

    const slug = path
      .relative(BLOG_DIR, file)
      .replace(/\\/g, "/")
      .replace(/\.md$/, "");

    const url = `/blog/${slug}/`;

    items.push({
      title,
      description,
      date,
      url,
      content,
      category, // ★ ここが今回の修正ポイント
    });
  }

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(items, null, 2), "utf-8");
}

buildIndex();
