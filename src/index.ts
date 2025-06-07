#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import {
  sanitizeFilename,
  ensureMemosDirectory,
  getMemoPath,
  listMemoFiles,
  searchMemos,
  findMemoByTitle,
} from './memo-utils.js';

// サーバーインスタンスを作成
const server = new Server(
  {
    name: 'mcp-memo-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {}, // ツール機能を有効化
      prompts: {}, // プロンプト機能を有効化
    },
  }
);

// ツール一覧を返すハンドラー
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // 既存のツール
      {
        name: 'add',
        description: '2つの数値を足し算します',
        inputSchema: {
          type: 'object',
          properties: {
            a: { type: 'number', description: '1つ目の数値' },
            b: { type: 'number', description: '2つ目の数値' },
          },
          required: ['a', 'b'],
        },
      },
      {
        name: 'multiply',
        description: '2つの数値を掛け算します',
        inputSchema: {
          type: 'object',
          properties: {
            a: { type: 'number', description: '1つ目の数値' },
            b: { type: 'number', description: '2つ目の数値' },
          },
          required: ['a', 'b'],
        },
      },
      {
        name: 'echo',
        description: '受け取った文字列をそのまま返します',
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string', description: '返す文字列' },
          },
          required: ['message'],
        },
      },
      
      // メモ管理ツール
      {
        name: 'create_memo',
        description: 'メモを作成してファイルに保存します',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'メモのタイトル',
            },
            content: {
              type: 'string',
              description: 'メモの内容',
            },
          },
          required: ['title', 'content'],
        },
      },
      {
        name: 'list_memos',
        description: '保存されているメモの一覧を表示します',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'read_memo',
        description: '指定したメモの内容を読み取ります',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: '読み取るメモのタイトル',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'delete_memo',
        description: '指定したメモを削除します',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: '削除するメモのタイトル',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'search_memo',
        description: 'メモのタイトルや内容から検索します',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: '検索クエリ',
            },
          },
          required: ['query'],
        },
      },
    ],
  };
});

// プロンプト一覧を返すハンドラー
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'explain_concept',
        description: '技術概念を初心者向けに説明するプロンプト',
        arguments: [
          {
            name: 'concept',
            description: '説明したい技術概念',
            required: true,
          },
          {
            name: 'level',
            description: '説明レベル（beginner/intermediate/advanced）',
            required: false,
          },
        ],
      },
      {
        name: 'code_review',
        description: 'コードレビューのプロンプト',
        arguments: [
          {
            name: 'code',
            description: 'レビューするコード',
            required: true,
          },
          {
            name: 'language',
            description: 'プログラミング言語',
            required: false,
          },
        ],
      },
      {
        name: 'debug_help',
        description: 'デバッグ支援のプロンプト',
        arguments: [
          {
            name: 'error_message',
            description: 'エラーメッセージ',
            required: true,
          },
          {
            name: 'context',
            description: 'エラーが発生した状況',
            required: false,
          },
        ],
      },
    ],
  };
});

// プロンプト取得ハンドラー
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'explain_concept': {
      const concept = args?.concept as string;
      const level = (args?.level as string) || 'beginner';
      
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `「${concept}」について${level}レベルで説明してください。以下の点を含めて説明してください：

1. 基本的な定義
2. なぜ重要なのか
3. 具体的な使用例
4. 学習の次のステップ

${level === 'beginner' ? '専門用語は分かりやすく説明してください。' : ''}
${level === 'advanced' ? '技術的な詳細や内部実装についても触れてください。' : ''}`,
            },
          },
        ],
      };
    }

    case 'code_review': {
      const code = args?.code as string;
      const language = (args?.language as string) || '不明';
      
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `以下の${language}コードをレビューしてください：

\`\`\`${language}
${code}
\`\`\`

以下の観点でレビューしてください：
1. コードの正確性
2. 可読性とメンテナンス性
3. パフォーマンス
4. セキュリティ
5. ベストプラクティスの遵守
6. 改善提案`,
            },
          },
        ],
      };
    }

    case 'debug_help': {
      const errorMessage = args?.error_message as string;
      const context = (args?.context as string) || '詳細不明';
      
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `以下のエラーのデバッグを手伝ってください：

エラーメッセージ：
\`\`\`
${errorMessage}
\`\`\`

発生状況：
${context}

以下の情報を提供してください：
1. エラーの原因の分析
2. 考えられる解決方法
3. 今後の予防策
4. 関連するドキュメントやリソース`,
            },
          },
        ],
      };
    }

    default:
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown prompt: ${name}`
      );
  }
});

// ツール実行ハンドラー
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    // 既存のツール
    case 'add': {
      const { a, b } = args as { a: number; b: number };
      return {
        content: [
          {
            type: 'text',
            text: `${a} + ${b} = ${a + b}`,
          },
        ],
      };
    }

    case 'multiply': {
      const { a, b } = args as { a: number; b: number };
      return {
        content: [
          {
            type: 'text',
            text: `${a} × ${b} = ${a * b}`,
          },
        ],
      };
    }

    case 'echo': {
      const { message } = args as { message: string };
      return {
        content: [
          {
            type: 'text',
            text: message,
          },
        ],
      };
    }

    // メモ管理ツール
    case 'create_memo': {
      try {
        const { title, content } = args as { title: string; content: string };
        
        ensureMemosDirectory();
        const filename = sanitizeFilename(title);
        const filepath = getMemoPath(filename);
        
        // ファイルが既に存在する場合はエラー
        if (fs.existsSync(filepath)) {
          return {
            content: [
              {
                type: 'text',
                text: `エラー: "${title}" というタイトルのメモは既に存在します。`,
              },
            ],
          };
        }
        
        // メモファイルを作成
        fs.writeFileSync(filepath, content, 'utf-8');
        
        return {
          content: [
            {
              type: 'text',
              text: `メモ "${title}" を作成しました。\nファイル: ${filename}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `メモの作成に失敗しました: ${error}`,
            },
          ],
        };
      }
    }

    case 'list_memos': {
      try {
        const memos = listMemoFiles();
        
        if (memos.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'メモがありません。',
              },
            ],
          };
        }
        
        let result = `保存されているメモ (${memos.length}件):\n\n`;
        for (const memo of memos) {
          const date = new Date(memo.createdAt).toLocaleString('ja-JP');
          result += `📝 ${memo.title}\n`;
          result += `   作成日時: ${date}\n`;
          result += `   サイズ: ${memo.size} bytes\n\n`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `メモ一覧の取得に失敗しました: ${error}`,
            },
          ],
        };
      }
    }

    case 'read_memo': {
      try {
        const { title } = args as { title: string };
        const filename = findMemoByTitle(title);
        
        if (!filename) {
          return {
            content: [
              {
                type: 'text',
                text: `メモ "${title}" が見つかりません。`,
              },
            ],
          };
        }
        
        const filepath = getMemoPath(filename);
        const content = fs.readFileSync(filepath, 'utf-8');
        
        return {
          content: [
            {
              type: 'text',
              text: `📝 ${title}\n\n${content}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `メモの読み取りに失敗しました: ${error}`,
            },
          ],
        };
      }
    }

    case 'delete_memo': {
      try {
        const { title } = args as { title: string };
        const filename = findMemoByTitle(title);
        
        if (!filename) {
          return {
            content: [
              {
                type: 'text',
                text: `メモ "${title}" が見つかりません。`,
              },
            ],
          };
        }
        
        const filepath = getMemoPath(filename);
        fs.unlinkSync(filepath);
        
        return {
          content: [
            {
              type: 'text',
              text: `メモ "${title}" を削除しました。`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `メモの削除に失敗しました: ${error}`,
            },
          ],
        };
      }
    }

    case 'search_memo': {
      try {
        const { query } = args as { query: string };
        const memos = searchMemos(query);
        
        if (memos.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `"${query}" に一致するメモが見つかりません。`,
              },
            ],
          };
        }
        
        let result = `"${query}" の検索結果 (${memos.length}件):\n\n`;
        for (const memo of memos) {
          const date = new Date(memo.createdAt).toLocaleString('ja-JP');
          result += `📝 ${memo.title}\n`;
          result += `   作成日時: ${date}\n\n`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `メモの検索に失敗しました: ${error}`,
            },
          ],
        };
      }
    }

    default:
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${name}`
      );
  }
});

// サーバーの起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

