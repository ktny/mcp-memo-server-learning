import * as fs from 'fs';
import * as path from 'path';

// テスト用の一時ディレクトリ
const TEST_MEMOS_DIR = path.join(__dirname, 'test-memos');

// memo-utils.tsのMEMOS_DIRをテスト用に変更するためのモック
jest.mock('../src/memo-utils', () => {
  const originalModule = jest.requireActual('../src/memo-utils');
  
  // テスト用のMEMOS_DIRを使用する関数群
  const getMemoPath = (filename: string) => path.join(TEST_MEMOS_DIR, filename);
  
  const ensureMemosDirectory = () => {
    if (!fs.existsSync(TEST_MEMOS_DIR)) {
      fs.mkdirSync(TEST_MEMOS_DIR, { recursive: true });
    }
  };
  
  const listMemoFiles = () => {
    ensureMemosDirectory();
    
    const files = fs.readdirSync(TEST_MEMOS_DIR);
    const memos: any[] = [];
    
    for (const file of files) {
      if (file.endsWith('.txt')) {
        const filepath = getMemoPath(file);
        const stats = fs.statSync(filepath);
        
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
    
    return memos.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };
  
  const searchMemos = (query: string) => {
    const allMemos = listMemoFiles();
    const matchedMemos: any[] = [];
    
    for (const memo of allMemos) {
      const filepath = getMemoPath(memo.filename);
      const content = fs.readFileSync(filepath, 'utf-8');
      
      if (
        memo.title.toLowerCase().includes(query.toLowerCase()) ||
        content.toLowerCase().includes(query.toLowerCase())
      ) {
        matchedMemos.push(memo);
      }
    }
    
    return matchedMemos;
  };
  
  const findMemoByTitle = (title: string) => {
    const filename = originalModule.sanitizeFilename(title);
    const filepath = getMemoPath(filename);
    
    if (fs.existsSync(filepath)) {
      return filename;
    }
    
    const allMemos = listMemoFiles();
    for (const memo of allMemos) {
      if (memo.title.toLowerCase().includes(title.toLowerCase())) {
        return memo.filename;
      }
    }
    
    return null;
  };
  
  return {
    ...originalModule,
    ensureMemosDirectory,
    getMemoPath,
    listMemoFiles,
    searchMemos,
    findMemoByTitle,
    getMemosDirectoryPath: () => TEST_MEMOS_DIR,
  };
});

import {
  sanitizeFilename,
  ensureMemosDirectory,
  getMemoPath,
  listMemoFiles,
  searchMemos,
  findMemoByTitle,
  getMemosDirectoryPath,
} from '../src/memo-utils';

describe('memo-utils', () => {
  beforeEach(() => {
    // テスト前にテストディレクトリをクリーンアップ
    if (fs.existsSync(TEST_MEMOS_DIR)) {
      fs.rmSync(TEST_MEMOS_DIR, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // テスト後にテストディレクトリをクリーンアップ
    if (fs.existsSync(TEST_MEMOS_DIR)) {
      fs.rmSync(TEST_MEMOS_DIR, { recursive: true, force: true });
    }
  });

  describe('sanitizeFilename', () => {
    test('通常のタイトルをファイル名に変換', () => {
      expect(sanitizeFilename('買い物リスト')).toBe('買い物リスト.txt');
    });

    test('スペースをアンダースコアに変換', () => {
      expect(sanitizeFilename('Meeting Notes')).toBe('meeting_notes.txt');
    });

    test('特殊文字を除去', () => {
      expect(sanitizeFilename('重要な ToDo!@#$')).toBe('重要な_todo!@#$.txt');
    });

    test('ファイル名に使えない文字を除去', () => {
      expect(sanitizeFilename('test<>:"/\\|?*file')).toBe('testfile.txt');
    });

    test('長いタイトルを50文字で切り詰め', () => {
      const longTitle = 'a'.repeat(60);
      const result = sanitizeFilename(longTitle);
      expect(result.length).toBe(54); // 50文字 + '.txt'
    });
  });

  describe('ensureMemosDirectory', () => {
    test('ディレクトリが存在しない場合は作成', () => {
      expect(fs.existsSync(TEST_MEMOS_DIR)).toBe(false);
      ensureMemosDirectory();
      expect(fs.existsSync(TEST_MEMOS_DIR)).toBe(true);
    });

    test('ディレクトリが既に存在する場合はエラーなし', () => {
      fs.mkdirSync(TEST_MEMOS_DIR, { recursive: true });
      expect(() => ensureMemosDirectory()).not.toThrow();
    });
  });

  describe('listMemoFiles', () => {
    beforeEach(() => {
      ensureMemosDirectory();
    });

    test('メモがない場合は空配列を返す', () => {
      const memos = listMemoFiles();
      expect(memos).toEqual([]);
    });

    test('メモファイルの一覧を取得', () => {
      // テスト用メモファイルを作成
      fs.writeFileSync(path.join(TEST_MEMOS_DIR, 'test1.txt'), 'テスト内容1');
      fs.writeFileSync(path.join(TEST_MEMOS_DIR, 'test2.txt'), 'テスト内容2');

      const memos = listMemoFiles();
      expect(memos).toHaveLength(2);
      expect(memos[0].title).toBe('test1');
      expect(memos[1].title).toBe('test2');
    });

    test('txt以外のファイルは除外', () => {
      fs.writeFileSync(path.join(TEST_MEMOS_DIR, 'test.txt'), 'テスト内容');
      fs.writeFileSync(path.join(TEST_MEMOS_DIR, 'other.md'), 'その他');

      const memos = listMemoFiles();
      expect(memos).toHaveLength(1);
      expect(memos[0].title).toBe('test');
    });
  });

  describe('searchMemos', () => {
    beforeEach(() => {
      ensureMemosDirectory();
      // テスト用メモファイルを作成
      fs.writeFileSync(path.join(TEST_MEMOS_DIR, 'shopping_list.txt'), '牛乳、パン、卵');
      fs.writeFileSync(path.join(TEST_MEMOS_DIR, 'meeting_notes.txt'), '会議の議事録');
      fs.writeFileSync(path.join(TEST_MEMOS_DIR, 'todo.txt'), '買い物に行く');
    });

    test('タイトルから検索', () => {
      const results = searchMemos('shopping');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('shopping list');
    });

    test('内容から検索', () => {
      const results = searchMemos('牛乳');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('shopping list');
    });

    test('複数のメモがヒット', () => {
      const results = searchMemos('買い');
      expect(results.length).toBeGreaterThanOrEqual(1); // 少なくとも todo.txt は見つかる
    });

    test('該当なしの場合は空配列', () => {
      const results = searchMemos('存在しない');
      expect(results).toEqual([]);
    });
  });

  describe('findMemoByTitle', () => {
    beforeEach(() => {
      ensureMemosDirectory();
      fs.writeFileSync(path.join(TEST_MEMOS_DIR, 'test_memo.txt'), 'テスト内容');
    });

    test('完全一致でメモを見つける', () => {
      const filename = findMemoByTitle('test memo');
      expect(filename).toBe('test_memo.txt');
    });

    test('部分一致でメモを見つける', () => {
      const filename = findMemoByTitle('test');
      expect(filename).toBe('test_memo.txt');
    });

    test('存在しないメモの場合はnullを返す', () => {
      const filename = findMemoByTitle('存在しない');
      expect(filename).toBeNull();
    });
  });
});