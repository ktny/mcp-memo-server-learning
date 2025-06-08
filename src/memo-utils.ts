import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// メモ保存用ディレクトリ（絶対パスを使用）
const MEMOS_DIR = path.join(__dirname, '..', 'memos');

// メモのメタデータ型定義
export interface MemoMetadata {
  title: string;
  filename: string;
  createdAt: string;
  updatedAt: string;
  size: number;
  category?: string;
  tags: string[];
  content?: string; // 検索時に使用
}

// メモのフロントマター（メタデータ）
export interface MemoFrontMatter {
  title: string;
  category?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ファイル名を安全な形式に変換
export function sanitizeFilename(title: string): string {
  return title
    .replace(/[<>:"/\\|?*]/g, '') // ファイル名に使えない文字を削除
    .replace(/\s+/g, '_') // スペースをアンダースコアに変換
    .toLowerCase()
    .slice(0, 50) // 最大50文字
    + '.txt';
}

// メモディレクトリが存在するか確認し、なければ作成
export function ensureMemosDirectory(): void {
  if (!fs.existsSync(MEMOS_DIR)) {
    fs.mkdirSync(MEMOS_DIR, { recursive: true });
  }
}

// メモファイルのパスを取得
export function getMemoPath(filename: string): string {
  return path.join(MEMOS_DIR, filename);
}

// メモ一覧を取得（拡張版）
export function listMemoFiles(): MemoMetadata[] {
  ensureMemosDirectory();
  
  const files = fs.readdirSync(MEMOS_DIR);
  const memos: MemoMetadata[] = [];
  
  for (const file of files) {
    if (file.endsWith('.txt')) {
      const filepath = getMemoPath(file);
      const stats = fs.statSync(filepath);
      const content = fs.readFileSync(filepath, 'utf-8');
      
      // フロントマターを解析
      const { frontMatter, body } = parseMemoContent(content);
      
      let title = file.replace('.txt', '').replace(/_/g, ' ');
      let category: string | undefined;
      let tags: string[] = [];
      let createdAt = stats.birthtime.toISOString();
      let updatedAt = stats.mtime.toISOString();
      
      // フロントマターからメタデータを取得
      if (frontMatter) {
        title = frontMatter.title || title;
        category = frontMatter.category;
        tags = frontMatter.tags || [];
        createdAt = frontMatter.createdAt || createdAt;
        updatedAt = frontMatter.updatedAt || updatedAt;
      }
      
      memos.push({
        title,
        filename: file,
        createdAt,
        updatedAt,
        size: stats.size,
        category,
        tags,
      });
    }
  }
  
  // 作成日時でソート（新しい順）
  return memos.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// メモを検索
export function searchMemos(query: string): MemoMetadata[] {
  const allMemos = listMemoFiles();
  const matchedMemos: MemoMetadata[] = [];
  
  for (const memo of allMemos) {
    const filepath = getMemoPath(memo.filename);
    const content = fs.readFileSync(filepath, 'utf-8');
    
    // タイトルまたは内容に検索クエリが含まれているかチェック
    if (
      memo.title.toLowerCase().includes(query.toLowerCase()) ||
      content.toLowerCase().includes(query.toLowerCase())
    ) {
      matchedMemos.push(memo);
    }
  }
  
  return matchedMemos;
}

// ファイル名からメモを見つける
export function findMemoByTitle(title: string): string | null {
  const filename = sanitizeFilename(title);
  const filepath = getMemoPath(filename);
  
  if (fs.existsSync(filepath)) {
    return filename;
  }
  
  // 完全一致しない場合、部分一致で検索
  const allMemos = listMemoFiles();
  for (const memo of allMemos) {
    if (memo.title.toLowerCase().includes(title.toLowerCase())) {
      return memo.filename;
    }
  }
  
  return null;
}

// デバッグ用: メモディレクトリのパスを取得
export function getMemosDirectoryPath(): string {
  return MEMOS_DIR;
}

// フロントマターを解析してメタデータと本文を分離
export function parseMemoContent(content: string): { frontMatter: MemoFrontMatter | null; body: string } {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);
  
  if (!match) {
    return { frontMatter: null, body: content };
  }
  
  try {
    const frontMatter = yaml.load(match[1]) as MemoFrontMatter;
    return { frontMatter, body: match[2] };
  } catch (error) {
    console.error('フロントマターの解析に失敗:', error);
    return { frontMatter: null, body: content };
  }
}

// フロントマターと本文を結合してメモコンテンツを生成
export function createMemoContent(frontMatter: MemoFrontMatter, body: string): string {
  const yamlString = yaml.dump(frontMatter);
  return `---\n${yamlString}---\n${body}`;
}

// メモを作成（カテゴリとタグ付きバージョン）
export function createMemoWithMetadata(
  title: string, 
  content: string, 
  category?: string, 
  tags: string[] = []
): string {
  const now = new Date().toISOString();
  const frontMatter: MemoFrontMatter = {
    title,
    category,
    tags,
    createdAt: now,
    updatedAt: now,
  };
  
  return createMemoContent(frontMatter, content);
}

// カテゴリ別にメモを検索
export function getMemosByCategory(category: string): MemoMetadata[] {
  const allMemos = listMemoFiles();
  return allMemos.filter(memo => 
    memo.category && memo.category.toLowerCase() === category.toLowerCase()
  );
}

// タグでメモを検索
export function getMemosByTag(tag: string): MemoMetadata[] {
  const allMemos = listMemoFiles();
  return allMemos.filter(memo => 
    memo.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );
}

// 利用可能なカテゴリ一覧を取得
export function getAvailableCategories(): string[] {
  const allMemos = listMemoFiles();
  const categories = new Set<string>();
  
  allMemos.forEach(memo => {
    if (memo.category) {
      categories.add(memo.category);
    }
  });
  
  return Array.from(categories).sort();
}

// 利用可能なタグ一覧を取得
export function getAvailableTags(): string[] {
  const allMemos = listMemoFiles();
  const tags = new Set<string>();
  
  allMemos.forEach(memo => {
    memo.tags.forEach(tag => tags.add(tag));
  });
  
  return Array.from(tags).sort();
}