# 商品浏览页面 Demo

[日本語版はこちら](README.ja.md)

一个用来练习**认证（JWT）、分页、缓存**三个知识点的最小化全栈 Demo。前后端分离，故意不引入数据库、状态管理库、组件库等额外复杂度，聚焦在这三件事本身。

## 技术栈

| | 技术 |
|---|---|
| 前端 | Next.js 16（App Router）+ TypeScript + Tailwind CSS |
| 后端 | FastAPI + PyJWT（签发/校验 JWT）+ Passlib/Bcrypt（密码加密） |
| 数据 | 全部写死在内存里，没有数据库，重启进程即重置 |

## 前置要求

- Python 3.10+（本地开发用的是 3.14）
- Node.js 18+
- 两个服务分别监听 `8000`（后端）和 `3000`（前端，被占用时自动改用其他端口，比如 3002）

## 快速开始

```bash
# 1. 后端
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 2. 前端（另开一个终端）
cd frontend
npm install
npm run dev
```

浏览器打开前端终端打印出的地址（一般是 `http://localhost:3000`，3000 被占用时会自动改成 3002 等）。

测试账号（写死在 `backend/main.py` 的 `USERS` 里）：

- `test / 123456`
- `alice / password`

## 目录结构

```
product-demo/
├── backend/
│   ├── main.py            # 唯一的后端文件：登录、JWT 校验、分页、缓存全在这里
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── page.tsx         # 根路径：按 localStorage 里有没有 token 跳转
    │   ├── login/page.tsx   # 登录页
    │   └── products/page.tsx # 商品列表页（分页 + 缓存状态展示）
    └── lib/api.ts           # fetch 封装：登录、取商品、token 存取
```

## 1. 认证（JWT）

**涉及文件**：`backend/main.py`（`USERS`、`create_access_token`、`get_current_user`、`/login`）、`frontend/lib/api.ts`、`frontend/app/login/page.tsx`、`frontend/app/products/page.tsx`

流程：

1. 后端启动时，`USERS` 数组里已经写死了 1-2 个账号，密码用 `passlib` 的 `bcrypt.hash()` 提前加密存好（明文密码从来不落地）。
2. 用户在登录页输入用户名密码 → 前端 `POST /login`。
3. 后端在 `USERS` 里找到同名用户，用 `pwd_context.verify()` 校验密码；对的话调用 `create_access_token()`，用 `PyJWT` 签发一个 JWT（payload 里带 `sub`=用户名、`exp`=2 小时后过期），返回给前端。
4. 前端拿到 `access_token` 后存进 `localStorage`（`lib/api.ts` 的 `setToken`），然后跳转到 `/products`。
5. 之后每次请求 `/products`，前端都从 `localStorage` 取出 token，加到请求头 `Authorization: Bearer <token>`。
6. 后端用依赖函数 `get_current_user`（`Depends`）拦截 `/products`：从请求头解析 token，`jwt.decode` 校验签名和过期时间；没带 token / token 无效或过期 → 返回 401。
7. 前端收到 401，清空 `localStorage` 里的 token 并跳回登录页；`/products` 页面加载时也会主动检查有没有 token，没有直接跳转，不会先发请求再等 401。

这里没有 refresh token、没有 httpOnly cookie、没有权限分级，是刻意简化过的版本，只演示"签发 → 携带 → 校验"这个最核心的闭环。

## 2. 分页

**涉及文件**：`backend/main.py`（`PRODUCTS`、`/products` 里的切片逻辑）、`frontend/app/products/page.tsx`

- 后端写死了 25 条商品（`PRODUCTS`），每条只有 `id / name / price / description`。
- `/products?page=1&size=10` 里：
  - `start = (page - 1) * size`，`end = start + size`，用 `PRODUCTS[start:end]` 切出当页数据。
  - `total = len(PRODUCTS)`，`total_pages = ceil(total / size)`。
- 响应统一带上 `page / size / total / total_pages`，前端靠这几个字段判断"上一页/下一页"按钮要不要禁用（`page <= 1` 禁用上一页，`page >= total_pages` 禁用下一页）。
- 前端 `products/page.tsx` 用一个 `page` 的 `useState` 记录当前页，点击按钮改这个 state，`useEffect` 监听 `page` 变化自动重新请求。

## 3. 缓存（这里特意分了两层，容易搞混，见下面的对比）

### 3.1 后端内存缓存（应用层缓存）—— 这次练习的重点

**涉及文件**：`backend/main.py` 的 `CACHE`、`CACHE_TTL_SECONDS`

- 用一个全局字典 `CACHE` 存 `"分页参数 -> 数据"`，key 是 `f"{page}_{size}"`，因为这个 demo 没有搜索/筛选参数，page+size 已经能唯一确定一次查询。
- **过期时间**在 `backend/main.py` 里的常量 `CACHE_TTL_SECONDS = 60`（写入时刻 + 60 秒后过期，改这一个数字就行，其他地方不用动）。
- **读取逻辑**：请求进来先算 `cache_key`，如果 `CACHE` 里有对应记录且没过期 → 直接返回存的数据，`from_cache: true`；否则（没有 / 过期 / 带了 `refresh=true`）→ 重新查一遍 `PRODUCTS`（这里"查"只是重新切片，模拟真实场景里查数据库/调用下游服务的开销），把新结果连同新的过期时间写回 `CACHE`，返回 `from_cache: false`。
- `?refresh=true` 可以强制跳过缓存判断，直接走"重新查询"分支，方便手动测试缓存失效的效果。

关键点：**命中这层缓存时，请求依然是真实打到后端服务器的**，只是服务器偷懒没有重新计算，所以你在浏览器 Network 面板里能看到这次请求，响应体里 `from_cache` 字段就是证据。

### 3.2 HTTP 层缓存（Cache-Control / max-age）—— 对比用，不是本次练习重点

**涉及文件**：`backend/main.py` 里 `/products` 设置的 `response.headers["Cache-Control"]`

- 正常请求：响应头带 `Cache-Control: max-age=15`（常量 `HTTP_CACHE_MAX_AGE_SECONDS`），告诉浏览器"这份响应 15 秒内可以直接复用，不用再问服务器"。
- `refresh=true` 请求：响应头是 `Cache-Control: no-store`，明确告诉浏览器这份不许缓存。

关键点：这层缓存命中时，**请求根本不会真正发出去**——浏览器自己在本地把上次的响应吐出来了，Network 面板里会显示 `(memory cache)` / `(disk cache)`，后端完全不知道这次"请求"发生过。

### 两层缓存怎么区分着看

在浏览器 DevTools → Network 面板里观察同一页的连续请求：

| 时间窗口 | Network 面板现象 | 响应体 `from_cache` |
|---|---|---|
| 15 秒内刷新 | 请求不会真正发出（`(disk/memory cache)`），HTTP 层缓存生效 | 看不到响应体，因为请求没发出 |
| 15～60 秒内刷新 | 请求真实发出，Status 200 | `true`（HTTP 缓存过期了，但后端内存缓存还没过期） |
| 超过 60 秒刷新 | 请求真实发出，Status 200 | `false`（两层缓存都过期，真的重新查了） |
| 点"强制刷新"按钮 | 请求真实发出（`no-store` 禁止浏览器缓存） | `false`（后端也跳过了内存缓存） |

## 数据库情况

**没有数据库**，这是故意的设计：用户（`USERS`）和商品（`PRODUCTS`）都是硬编码在 `backend/main.py` 里的 Python 列表，缓存（`CACHE`）也只是进程内存里的字典。重启后端进程，这三份数据都会重置，没有任何持久化存储。

## 已知的坑（踩过的）

- `passlib` + 新版 `bcrypt`（4.1+）不兼容：bcrypt 4.1 起对超长密码从"静默截断"改成抛异常，导致 passlib 启动时的自检直接崩溃报 `password cannot be longer than 72 bytes`。已在 `requirements.txt` 锁定 `bcrypt==4.0.1` 解决，不需要再处理。
