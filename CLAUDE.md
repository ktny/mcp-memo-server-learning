# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a learning project for implementing an MCP (Model Context Protocol) server with memo management functionality. The project follows a phased approach from basic concepts to advanced features.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Architecture

This is a TypeScript-based MCP server project that will be built in phases:

1. **Phase 1**: Basic setup and environment preparation
2. **Phase 2**: Minimal MCP server implementation with simple tools
3. **Phase 3**: Memo management features (CRUD operations with file persistence)
4. **Phase 4**: Resource functionality for exposing memos as MCP resources
5. **Phase 5**: Testing and debugging implementation
6. **Phase 6**: Advanced features (database integration, external APIs)

## Project Structure

```
src/
├── index.ts       # Main server entry point
├── tools/         # MCP tool implementations
├── resources/     # MCP resource implementations
└── utils/         # Utility functions

tests/            # Test files
memos/           # Memo file storage directory
```

## Key Technologies

- **Runtime**: Node.js
- **Language**: TypeScript
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Testing**: Jest (planned)
- **Database**: SQLite (Phase 6)

## Development Guidelines

- Each phase is tracked via GitHub issues (#1-#6)
- Follow the MCP protocol specifications for tool and resource implementations
- Implement proper error handling for all operations
- Use file-based storage in `memos/` directory until Phase 6

## Important Notes

- This is a learning project designed to understand MCP server implementation step by step
- The project starts with no existing code - implementation begins in Phase 1
- Focus on understanding MCP concepts (tools vs resources, JSON-RPC communication) while building practical features