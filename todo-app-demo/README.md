# Todo App Demo

一个用来练习 **REST API 设计（CRUD）**、**OpenAPI 文档**的最小化 Demo。前后端都在同一个 Next.js 项目里：页面走前端渲染，接口走 App Router 的 Route Handlers，数据存在本地 SQLite 文件里。

## 技术栈

| | 技术 |
|---|---|
| 框架 | Next.js 16（App Router）+ TypeScript + Tailwind CSS |
| API | Next.js Route Handlers（`app/api/**/route.ts`），纯 REST，无框架依赖 |
| 数据 | SQLite，用 Node.js 内置的 `node:sqlite` 模块（`DatabaseSync`），文件存在 `data/todos.db` |
| API 文档 | `openapi.yaml`（OpenAPI 3.0），配合 [`@scalar/nextjs-api-reference`](https://github.com/scalar/scalar) 渲染成可交互的文档页面 |

## 前置要求

- **Node.js 22.5+**（推荐 22.5+ / 24+）—— 因为用到了内置的 `node:sqlite`，低版本没有这个模块或需要 `--experimental-sqlite` 标志

## 快速开始

```bash
npm install
npm run dev
```

打开 `http://localhost:3000` 使用待办事项列表；打开 `http://localhost:3000/api-docs` 查看可交互的 API 文档（Scalar 渲染的 `openapi.yaml`）。

数据会写到项目目录下的 `data/todos.db`（SQLite 文件），首次运行自动创建，删掉这个文件就相当于清空所有数据。

## 目录结构

```
todo-app-demo/
├── app/
│   ├── page.tsx                      # 待办事项列表页面
│   ├── api/
│   │   ├── todos/route.ts            # GET（列表，支持 status/sort 筛选排序）、POST（新建）
│   │   ├── todos/[id]/route.ts       # GET / PATCH / DELETE 单条任务
│   │   └── openapi.json/route.ts     # 把 openapi.yaml 转成 JSON 供文档页面消费
│   └── api-docs/route.ts             # /api-docs 页面：用 Scalar 渲染 OpenAPI 文档
├── components/                       # TodoForm / TodoList / TodoItem / FilterBar 等 UI 组件
├── lib/
│   ├── db.ts                         # SQLite 读写：listTodos / insertTodo / updateTodo / deleteTodo
│   ├── todoQuery.ts                  # 列表的筛选（filterTodos）和排序（sortTodos）逻辑
│   └── todoStatus.ts                 # 优先级文案、判断任务是否过期/今天到期
├── types/todo.ts                     # Todo / 分类 / 优先级 / 筛选 / 排序的类型定义
└── openapi.yaml                      # 接口的 OpenAPI 3.0 定义，是 /api-docs 的数据源
```

## 功能与练习点

- **CRUD**：`GET/POST /api/todos`、`GET/PATCH/DELETE /api/todos/{id}`，对应任务的增删改查。
- **筛选与排序**：`GET /api/todos?status=active&sort=dueDate` —— `status` 支持 `all/active/completed`，`sort` 支持 `createdAt/dueDate/priority`（逻辑在 `lib/todoQuery.ts`）。
- **字段校验**：`POST`/`PATCH` 在 Route Handler 里手写校验（标题非空、`category`/`priority` 必须落在枚举值内），不合法直接返回 400 加错误信息。
- **业务字段**：每个任务除标题外还有分类（`仕事/プライベート/勉強/その他`）、优先级（`high/medium/low`）、截止日期，`lib/todoStatus.ts` 会判断任务是否已过期/今天到期。
- **OpenAPI 文档**：所有接口定义写在 `openapi.yaml` 里，`/api-docs` 页面用 Scalar 把它渲染成可以直接试调用的交互式文档，修改接口后记得同步改这个文件。

## 用 curl 测试

```bash
# 新建一条任务
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"写周报","category":"仕事","priority":"high","dueDate":"2026-08-25"}'

# 查看列表（按优先级排序，只看未完成的）
curl "http://localhost:3000/api/todos?status=active&sort=priority"
```

## 数据库情况

用的是 **SQLite**（不是内存数据），通过 Node.js 内置的 `node:sqlite` 模块直接读写本地文件 `data/todos.db`，没有额外的数据库服务器、没有 ORM。表结构在 `lib/db.ts` 里用一句 `CREATE TABLE IF NOT EXISTS` 定义，首次启动自动建表。这个文件默认不会提交到 git（见根目录 `.gitignore`），每个人本地跑起来都是一份独立、干净的数据。
