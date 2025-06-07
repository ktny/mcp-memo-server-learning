# MCP Memo Server Learning Project

MCPサーバーの学習を目的としたプロジェクトです。シンプルなメモ管理機能を持つMCPサーバーを段階的に実装していきます。

## 📋 プロジェクト概要

**Model Context Protocol (MCP)** は、AI アシスタントが外部のデータやツールに安全にアクセスするための標準プロトコルです。このプロジェクトでは、MCPサーバーの基本概念から実用的な機能まで段階的に学習します。

## 🎯 学習目標

- MCPの基本概念とアーキテクチャの理解
- JSON-RPC通信の実装方法
- ツールとリソースの違いと使い分け
- 実用的なMCPサーバーの設計と実装
- テストとデバッグの手法

## 📚 学習計画

学習は以下の6つのフェーズに分かれています：

### [Phase 1: 基礎理解と環境準備](../../issues/1)
- MCPの基本概念の理解
- 開発環境のセットアップ
- プロジェクト構造の作成

### [Phase 2: 最小限のMCPサーバー実装](../../issues/2)
- 基本的なサーバー構造
- シンプルなツールの実装
- JSON-RPC通信の確認

### [Phase 3: メモ管理機能の実装](../../issues/3)
- メモの作成・読み取り・削除機能
- ファイルベースの永続化
- エラーハンドリング

### [Phase 4: リソース機能の実装](../../issues/4)
- MCPリソースとしてのメモ公開
- メタデータ管理
- URI設計

### [Phase 5: テストとデバッグ](../../issues/5)
- 単体テスト・統合テストの実装
- ログ機能とデバッグ
- 品質向上

### [Phase 6: 応用と拡張](../../issues/6)
- データベース連携
- 外部API連携
- 高度な検索機能

## 🛠️ 技術スタック

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: MCP SDK (`@modelcontextprotocol/sdk`)
- **Testing**: Jest (予定)
- **Database**: SQLite (Phase 6で導入予定)

## 🚀 クイックスタート

```bash
# リポジトリのクローン
git clone https://github.com/ktny/mcp-memo-server-learning.git
cd mcp-memo-server-learning

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

## 📁 プロジェクト構造

```
mcp-memo-server-learning/
├── src/                    # ソースコード
│   ├── index.ts           # メインサーバーファイル
│   ├── tools/             # ツール実装
│   ├── resources/         # リソース実装
│   └── utils/             # ユーティリティ
├── tests/                 # テストファイル
├── memos/                 # メモファイル保存先
├── docs/                  # ドキュメント
└── examples/              # 使用例
```

## 📖 学習リソース

- [MCP公式ドキュメント](https://modelcontextprotocol.io/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [JSON-RPC 2.0仕様](https://www.jsonrpc.org/specification)

## 🤝 貢献

このプロジェクトは学習目的のため、issues やプルリクエストを通じて質問や改善提案を歓迎します。

## 📄 ライセンス

MIT License

## 📊 進捗追跡

各フェーズの進捗は対応するissueで追跡されています：

- [ ] [Phase 1: 基礎理解と環境準備](../../issues/1)
- [ ] [Phase 2: 最小限のMCPサーバー実装](../../issues/2)  
- [ ] [Phase 3: メモ管理機能の実装](../../issues/3)
- [ ] [Phase 4: リソース機能の実装](../../issues/4)
- [ ] [Phase 5: テストとデバッグ](../../issues/5)
- [ ] [Phase 6: 応用と拡張](../../issues/6)

各フェーズを順番に完了していくことで、MCPサーバーの全体像を理解できます。

---

**Happy Learning! 🎉**