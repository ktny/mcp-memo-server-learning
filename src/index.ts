#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// サーバーインスタンスを作成
const server = new Server(
  {
    name: 'mcp-memo-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {}, // ツール機能を有効化
    },
  }
);

// ツール一覧を返すハンドラー
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'add',
        description: '2つの数値を足し算します',
        inputSchema: {
          type: 'object',
          properties: {
            a: {
              type: 'number',
              description: '1つ目の数値',
            },
            b: {
              type: 'number',
              description: '2つ目の数値',
            },
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
            a: {
              type: 'number',
              description: '1つ目の数値',
            },
            b: {
              type: 'number',
              description: '2つ目の数値',
            },
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
            message: {
              type: 'string',
              description: '返す文字列',
            },
          },
          required: ['message'],
        },
      },
    ],
  };
});

// ツール実行ハンドラー
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
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

