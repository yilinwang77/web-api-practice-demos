# Book Select FastAPI

書籍一覧 API の練習用プロジェクト。**条件検索・ソート・ページネーション**を組み合わせて実装し、
FastAPI がクエリパラメータをどう受け取り、動的に SQL を組み立て、安全に結果を返すかを理解することが目的。

## 技術スタック

| | 技術 |
|---|---|
| フレームワーク | FastAPI + Uvicorn |
| データ | SQLite。Python 組み込みの `sqlite3` モジュールを使用し、ファイルは `books.db` に保存される（ORM は使わず、SQL を直接組み立てる練習を優先） |
| バリデーション | Pydantic（クエリパラメータのバリデーションとレスポンス構造の定義） |
| フロントエンド | `static/index.html`（素の HTML/JS、ビルド不要） |

## 起動方法

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --reload
```

`http://127.0.0.1:8000` を開くと簡単な検索画面が使える。`http://127.0.0.1:8000/docs` では
自動生成された API ドキュメント（Swagger UI）が見られる。

初回起動時に自動でテーブルを作成し、60〜80 件のランダムな書籍データを投入する
（`books.db` はルートの `.gitignore` で除外済み）。

止めるときはサーバーを起動しているターミナルで `Ctrl+C`。`--reload` を付けているので、
`.py` ファイルを保存するたびに自動でプロセスが再起動し、コードの変更がすぐ反映される。

## ディレクトリ構成

```
book-select-fastAPI/
├── main.py           # FastAPI のエンドポイント定義
├── schemas.py         # Pydantic モデル（クエリパラメータのバリデーション・レスポンス構造）
├── crud.py            # WHERE / ORDER BY / LIMIT-OFFSET を動的に組み立てる SQL ロジック
├── database.py        # sqlite3 の接続・テーブル作成・ダミーデータ生成
└── static/index.html  # 検索・ページ送りができる簡易フロントエンド
```

## 機能と練習ポイント

### `GET /books` — 条件検索 + ソート + ページネーション

以下のクエリパラメータはすべて任意で、自由に組み合わせられる。

| パラメータ | 説明 |
|---|---|
| `category` | カテゴリの完全一致（`小説` / `技術書` / `漫画` / `その他`） |
| `min_price` / `max_price` | 価格の範囲指定 |
| `keyword` | タイトルの部分一致検索（SQL の `LIKE`） |
| `sort_by` | ソート対象。`price` / `created_at` / `id` のみ許可（ホワイトリスト方式） |
| `order` | `asc` または `desc`（デフォルト `asc`） |
| `page` | ページ番号。デフォルト 1、1 未満は不可 |
| `page_size` | 1 ページの件数。デフォルト 10、最大 50 |

```bash
curl "http://127.0.0.1:8000/books?category=技術書&min_price=1000&max_price=3000&keyword=Book&sort_by=price&order=desc&page=1&page_size=10"
```

レスポンスには `items` / `total` / `page` / `page_size` / `total_pages` に加え、
実際に適用されたフィルタ条件を `applied_filters` として返す。

**なぜ `sort_by` にホワイトリストが必要か**：SQL の列名やソート方向は `?` プレースホルダーで
渡せないため、文字列としてそのまま `ORDER BY` に組み込むしかない。ユーザーの入力をそのまま
組み込むと SQL インジェクションの入口になるため、`schemas.py` で `Literal["price", "created_at", "id"]`
としてホワイトリスト化し、この 3 つ以外の値は Pydantic が業務ロジックに届く前に 422 エラーで
弾く。値が固定の候補に限定されていることが保証されて初めて、`crud.py` 側で安全に文字列連結できる。

### `GET /books/cursor` — カーソルページネーション（オプション）

`id` をカーソルとして使い、`GET /books/cursor?cursor=50&limit=10` で id が 50 より大きい
次の 10 件を返す。

## Offset ページネーション vs Cursor ページネーション

| | Offset（`page` / `page_size`） | Cursor（`cursor` / `limit`） |
|---|---|---|
| 実装 | `LIMIT ? OFFSET ?` | `WHERE id > ? ORDER BY id LIMIT ?` |
| ページジャンプ | 可能。任意のページ番号に直接移動できる | 不可。「次へ」しか進めない |
| パフォーマンス | ページが後ろになるほど遅くなる（OFFSET は手前の行を読み飛ばす必要がある） | 安定している。何ページ目でもインデックスの範囲検索一発で済む |
| データの一貫性 | ページ送りの途中でデータの追加・削除があると、重複や抜け漏れが発生し得る | カーソルに使うカラムの値さえ変わらなければ、追加・削除の影響を受けにくい |
| 総件数・総ページ数 | 標準で取得できる（`total` / `total_pages`）ので、ページ番号ナビゲーションを作りやすい | 直接は取得できない（別途 COUNT が必要）。無限スクロール型の UI に向く |

**使い分けの目安**：

- ページ番号ナビゲーション、任意ページへのジャンプ、総件数の表示が必要（管理画面の一覧、検索結果画面など）→ **Offset ページネーション**
- データ量が多く増え続ける、無限スクロール／「もっと見る」形式、ページ送りの性能と一貫性を重視する場面（フィード、ログ、メッセージ一覧など）→ **Cursor ページネーション**

## データベースについて

使っているのは **SQLite**（Python 組み込みの `sqlite3` モジュール）で、実体はプロジェクト直下の
`books.db` という1つのファイル。追加のデータベースサーバーは不要。

- テーブル作成とダミーデータ投入は `main.py` の `lifespan` から `database.py` の `init_db()` /
  `seed_data()` が起動時に自動で行う。
- `seed_data()` は毎回 `books` テーブルの件数を確認し、空のときだけ 60〜80 件のランダムデータを
  挿入する。すでにデータがあれば再起動しても増えたり変わったりしない。
- まっさらなデータからやり直したい場合は `books.db` を削除してから再起動すればよい。
- `get_connection()`（`database.py`）は呼び出すたびに新しい `sqlite3.connect()` を開くだけで、
  コネクションプールは使っていない。単一ファイル・練習用の規模ではこれで十分だが、実運用で
  同時接続数が多くなる場合はプール化や PostgreSQL などへの移行を検討する。
- `books.db` は `.gitignore` で除外されているため、リポジトリには含まれない。各自の環境で
  初回起動時に新しく生成される。
- 中身を直接見たい場合は `sqlite3` コマンドが使える。

```bash
sqlite3 books.db
sqlite> .headers on
sqlite> .mode column
sqlite> SELECT * FROM books LIMIT 5;
sqlite> .quit
```
