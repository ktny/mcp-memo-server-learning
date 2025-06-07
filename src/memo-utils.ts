import * as fs from 'fs';
import * as path from 'path';

// メモ保存用ディレクトリ（絶対パスを使用）
const MEMOS_DIR = path.join(__dirname, '..', 'memos');

// メモのメタデータ型定義
export interface MemoMetadata {
  title: string;
  filename: string;
  createdAt: string;
  size: number;
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

// メモ一覧を取得
export function listMemoFiles(): MemoMetadata[] {
  ensureMemosDirectory();
  
  const files = fs.readdirSync(MEMOS_DIR);
  const memos: MemoMetadata[] = [];
  
  for (const file of files) {
    if (file.endsWith('.txt')) {
      const filepath = getMemoPath(file);
      const stats = fs.statSync(filepath);
      
      // ファイル名からタイトルを復元（.txtを除去、_をスペースに戻す）
      const title = file
        .replace('.txt', '')
        .replace(/_/g, ' ');
      
      memos.push({
        title,
        filename: file,
        createdAt: stats.birthtime.toISOString(),
        size: stats.size,
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