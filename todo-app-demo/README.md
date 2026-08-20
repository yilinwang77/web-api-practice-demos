# Todo App Demo

**REST API 設計（CRUD）・OpenAPI ドキュメント**を練習するための最小構成の Demo。フロントエンドとバックエンドは同じ Next.js プロジェクトの中にある：画面はフロントエンドでレンダリングし、API は App Router の Route Handlers が担当、データはローカルの SQLite ファイルに保存する。

## 技術スタック

| | 技術 |
|---|---|
| フレームワーク | Next.js 16（App Router）+ TypeScript + Tailwind CSS |
| API | Next.js の Route Handlers（`app/api/**/route.ts`）。純粋な REST で、追加のフレームワークには依存しない |
| データ | SQLite。Node.js 組み込みの `node:sqlite` モジュール（`DatabaseSync`）を使用し、ファイルは `data/todos.db` に保存される |
| API ドキュメント | `openapi.yaml`（OpenAPI 3.0）を [`@scalar/nextjs-api-reference`](https://github.com/scalar/scalar) で操作可能なドキュメントページとしてレンダリング |

## 前提条件

- **Node.js 22.5+**（推奨: 22.5+ / 24+）—— 組み込みの `node:sqlite` を使用しているため。それより古いバージョンにはこのモジュールがない、または `--experimental-sqlite` フラグが必要

## 起動方法

```bash
npm install
npm run dev
```

`http://localhost:3000` を開くと Todo リストの画面が使える。`http://localhost:3000/api-docs` を開くと、`openapi.yaml` を Scalar でレンダリングした操作可能な API ドキュメントが見られる。

データはプロジェクト直下の `data/todos.db`（SQLite ファイル）に書き込まれる。初回起動時に自動作成され、このファイルを削除すれば全データがリセットされる。

## ディレクトリ構成

```
todo-app-demo/
├── app/
│   ├── page.tsx                      # Todo リストの画面
│   ├── api/
│   │   ├── todos/route.ts            # GET（一覧、status/sort での絞り込み・並び替えに対応）、POST（新規作成）
│   │   ├── todos/[id]/route.ts       # GET / PATCH / DELETE（1件のタスクの取得・更新・削除）
│   │   └── openapi.json/route.ts     # openapi.yaml を JSON に変換し、ドキュメントページへ渡す
│   └── api-docs/route.ts             # /api-docs ページ：Scalar で OpenAPI ドキュメントをレンダリング
├── components/                       # TodoForm / TodoList / TodoItem / FilterBar などの UI コンポーネント
├── lib/
│   ├── db.ts                         # SQLite の読み書き：listTodos / insertTodo / updateTodo / deleteTodo
│   ├── todoQuery.ts                  # 一覧の絞り込み（filterTodos）と並び替え（sortTodos）のロジック
│   └── todoStatus.ts                 # 優先度のラベル、タスクが期限切れ／今日が期限かどうかの判定
├── types/todo.ts                     # Todo・カテゴリ・優先度・フィルタ・ソートの型定義
└── openapi.yaml                      # API の OpenAPI 3.0 定義。/api-docs のデータソース
```

## 機能と練習ポイント

- **CRUD**：`GET/POST /api/todos`、`GET/PATCH/DELETE /api/todos/{id}` で、タスクの作成・参照・更新・削除に対応。
- **絞り込みと並び替え**：`GET /api/todos?status=active&sort=dueDate` —— `status` は `all/active/completed`、`sort` は `createdAt/dueDate/priority` に対応（ロジックは `lib/todoQuery.ts`）。
- **入力バリデーション**：`POST`/`PATCH` は Route Handler 内で手書きのバリデーションを行う（タイトルが空でないこと、`category`/`priority` が列挙値に収まっていること）。不正な場合はエラーメッセージ付きで 400 を返す。
- **業務フィールド**：各タスクにはタイトルの他に、カテゴリ（`仕事/プライベート/勉強/その他`）、優先度（`high/medium/low`）、期限日がある。`lib/todoStatus.ts` がタスクの期限切れ／今日が期限かどうかを判定する。
- **OpenAPI ドキュメント**：すべての API 定義は `openapi.yaml` に書かれており、`/api-docs` ページで Scalar がそのまま試し打ちできる操作可能なドキュメントに変換する。API を変更したらこのファイルも忘れずに更新すること。

## curl での動作確認

```bash
# タスクを新規作成
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"週報を書く","category":"仕事","priority":"high","dueDate":"2026-08-25"}'

# 一覧を取得（優先度順、未完了のみ）
curl "http://localhost:3000/api/todos?status=active&sort=priority"
```

## データベースについて

使っているのは **SQLite**（メモリ上のデータではない）で、Node.js 組み込みの `node:sqlite` モジュールを使い、ローカルファイル `data/todos.db` に直接読み書きしている。追加のデータベースサーバーや ORM は使っていない。テーブル定義は `lib/db.ts` の `CREATE TABLE IF NOT EXISTS` の一文だけで、初回起動時に自動的に作成される。このファイルはデフォルトで git にコミットされないため（ルートの `.gitignore` を参照）、各自のローカル環境は毎回独立したまっさらなデータから始まる。
