# 商品一覧ページ Demo

**認証（JWT）・ページネーション・キャッシュ**の3つのポイントを練習するための、最小構成のフルスタック Demo。フロントエンドとバックエンドを分離し、あえてデータベース・状態管理ライブラリ・UI コンポーネントライブラリなどの余計な複雑さを持ち込まず、この3つのテーマそのものに集中している。

## 技術スタック

| | 技術 |
|---|---|
| フロントエンド | Next.js 16（App Router）+ TypeScript + Tailwind CSS |
| バックエンド | FastAPI + PyJWT（JWT の発行・検証）+ Passlib/Bcrypt（パスワード暗号化） |
| データ | すべてメモリ上にハードコードしたデータで、データベースは使わない |

## ディレクトリ構成

```
product-demo/
├── backend/
│   ├── main.py            # バックエンドは1ファイルのみ：ログイン、JWT 検証、ページネーション、キャッシュが全部ここにある
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── page.tsx        # ルートパス：localStorage に token があるかどうかでリダイレクト先を決める
    │   ├── login/page.tsx   # ログインページ
    │   └── products/page.tsx # 商品一覧ページ（ページネーション + キャッシュ状態の表示）
    └── lib/api.ts           # fetch のラッパー：ログイン、商品取得、token の保存/取得
```

なぜフロントエンドとバックエンドを別々に起動する必要があるのか：これらは独立した2つのプロセスだから。バックエンド（8000番ポート）は純粋な API で、画面のレンダリングは一切しない。フロントエンド（デフォルト3000番ポート、使用中なら自動的に変更される）は Web ページで、裏側で `fetch` を使ってバックエンドを呼び出している。ブラウザで開くのはフロントエンドのアドレスだけでよい。

## 前提条件

- Python 3.10+（開発時は 3.14 を使用）
- Node.js 18+
- 8000番ポート（バックエンド）と 3000番ポート（フロントエンド）が空いていること

## 起動方法

```bash
# バックエンド
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# フロントエンド（別のターミナルで）
cd frontend
npm install
npm run dev
```

フロントエンドが起動時に表示するアドレスをブラウザで開く（通常は http://localhost:3000 、ポートが使用中の場合は 3002 など）。

テストアカウント（`backend/main.py` の `USERS` にハードコードされている）：

- `test / 123456`
- `alice / password`

## 1. 認証（JWT）

**関連ファイル**：`backend/main.py`（`USERS`、`create_access_token`、`get_current_user`、`/login`）、`frontend/lib/api.ts`、`frontend/app/login/page.tsx`、`frontend/app/products/page.tsx`

流れ：

1. バックエンド起動時、`USERS` 配列にあらかじめ1〜2個のアカウントをハードコードしてある。パスワードは `passlib` の `bcrypt.hash()` で事前に暗号化して保存している（平文のパスワードは一切保存しない）。
2. ユーザーがログインページでユーザー名とパスワードを入力 → フロントエンドが `POST /login` を実行。
3. バックエンドは `USERS` から同名のユーザーを探し、`pwd_context.verify()` でパスワードを検証する。一致すれば `create_access_token()` を呼び出し、`PyJWT` で JWT を発行する（payload には `sub`=ユーザー名、`exp`=2時間後の有効期限を含む）。これをフロントエンドに返す。
4. フロントエンドは受け取った `access_token` を `localStorage` に保存し（`lib/api.ts` の `setToken`）、`/products` へ遷移する。
5. 以降、`/products` へリクエストするたびに、フロントエンドは `localStorage` から token を取り出し、リクエストヘッダー `Authorization: Bearer <token>` に付与する。
6. バックエンドは依存関数 `get_current_user`（`Depends`）で `/products` をガードしている：リクエストヘッダーから token を取り出し、`jwt.decode` で署名と有効期限を検証する。token がない／無効／期限切れの場合は 401 を返す。
7. フロントエンドは 401 を受け取ると、`localStorage` の token をクリアしてログインページへ戻す。`/products` ページの読み込み時にも token の有無を先にチェックしており、token がなければリクエストを送る前に即座にリダイレクトする。

ここでは refresh token、httpOnly cookie、権限レベルの分岐などは実装していない。あえて簡略化したバージョンであり、「発行 → 保持・送信 → 検証」という最も核心的な一連の流れだけを示すことが目的。

## 2. ページネーション

**関連ファイル**：`backend/main.py`（`PRODUCTS`、`/products` 内のスライス処理）、`frontend/app/products/page.tsx`

- バックエンドには25件の商品データ（`PRODUCTS`）をハードコードしてある。各商品は `id / name / price / description` のみを持つ。
- `/products?page=1&size=10` では：
  - `start = (page - 1) * size`、`end = start + size` とし、`PRODUCTS[start:end]` で該当ページのデータを切り出す。
  - `total = len(PRODUCTS)`、`total_pages = ceil(total / size)` を計算する。
- レスポンスには常に `page / size / total / total_pages` を含めており、フロントエンドはこれらの値を使って「前のページ／次のページ」ボタンを無効化するかどうかを判断する（`page <= 1` なら前のページを無効化、`page >= total_pages` なら次のページを無効化）。
- フロントエンドの `products/page.tsx` では `page` を `useState` で管理しており、ボタンをクリックするとこの state を更新し、`useEffect` が `page` の変化を監視して自動的に再リクエストする。

## 3. キャッシュ（あえて2つの層に分けている。混同しやすいので下の比較を参照）

### 3.1 バックエンドのメモリキャッシュ（アプリケーション層のキャッシュ）—— 今回の練習の本題

**関連ファイル**：`backend/main.py` の `CACHE`、`CACHE_TTL_SECONDS`

- グローバルな辞書 `CACHE` を使って「ページネーションのパラメータ → データ」を保存する。key は `f"{page}_{size}"` としている。この demo には検索・フィルタのパラメータがないため、page + size だけで1回のクエリを一意に特定できる。
- **有効期限**は `backend/main.py` の定数 `CACHE_TTL_SECONDS = 60`（書き込み時刻の60秒後に失効する。この数値だけを変更すればよく、他の箇所は変更不要）。
- **読み込みロジック**：リクエストが来たらまず `cache_key` を計算し、`CACHE` に対応するレコードがあり、かつ失効していなければ → 保存済みのデータをそのまま返し、`from_cache: true` とする。それ以外（レコードがない／失効している／`refresh=true` が付いている）の場合 → `PRODUCTS` を再度クエリする（ここでの「クエリ」は単なる再スライスだが、実際のシステムにおけるデータベースへの問い合わせや下流サービス呼び出しのコストを模している）。新しい結果を新しい失効時刻とともに `CACHE` に書き戻し、`from_cache: false` を返す。
- `?refresh=true` を付けるとキャッシュの判定を強制的にスキップし、直接「再クエリ」の分岐に入る。手動でキャッシュ失効の挙動をテストするのに使える。

ポイント：**この層のキャッシュがヒットしたときも、リクエストは実際にバックエンドサーバーまで届いている**。サーバー側が「サボって」再計算していないだけであり、ブラウザの Network パネルにはこのリクエストがちゃんと表示される。レスポンスボディの `from_cache` フィールドがその証拠。

### 3.2 HTTP層のキャッシュ（Cache-Control / max-age）—— 比較用であり、今回の練習の本題ではない

**関連ファイル**：`backend/main.py` の `/products` 内で設定している `response.headers["Cache-Control"]`

- 通常のリクエスト：レスポンスヘッダーに `Cache-Control: max-age=15`（定数 `HTTP_CACHE_MAX_AGE_SECONDS`）を付与し、「このレスポンスは15秒以内であればそのまま再利用してよく、サーバーに問い合わせ直す必要はない」とブラウザに伝える。
- `refresh=true` のリクエスト：レスポンスヘッダーは `Cache-Control: no-store` となり、「これはキャッシュしてはいけない」と明示的にブラウザへ伝える。

ポイント：この層のキャッシュがヒットしたときは、**リクエストはそもそも実際には送信されない**——ブラウザがローカルで前回のレスポンスをそのまま返しているだけであり、Network パネルには `(memory cache)` / `(disk cache)` と表示され、バックエンド側はこの「リクエスト」が発生したことすら一切関知しない。

### 2つのキャッシュ層をどう見分けるか

ブラウザの DevTools → Network パネルで、同じページへの連続したリクエストを観察する：

| 時間の経過 | Network パネル上の現象 | レスポンスボディの `from_cache` |
|---|---|---|
| 15秒以内に再読み込み | リクエストは実際には送信されない（`(disk/memory cache)`）。HTTP層のキャッシュが有効になっている | レスポンスボディは見えない（リクエストが送信されていないため） |
| 15〜60秒の間に再読み込み | リクエストが実際に送信され、Status 200 | `true`（HTTP キャッシュは失効したが、バックエンドのメモリキャッシュはまだ有効） |
| 60秒を超えてから再読み込み | リクエストが実際に送信され、Status 200 | `false`（両方の層のキャッシュが失効しており、本当に再クエリしている） |
| 「強制リフレッシュ」ボタンをクリック | リクエストが実際に送信される（`no-store` によりブラウザのキャッシュが禁止される） | `false`（バックエンド側もメモリキャッシュをスキップしている） |

## データベースについて

**データベースは存在しない**。これは意図的な設計で、ユーザー（`USERS`）と商品（`PRODUCTS`）はどちらも `backend/main.py` にハードコードされた Python のリスト、キャッシュ（`CACHE`）もプロセスのメモリ上の辞書にすぎない。バックエンドのプロセスを再起動すると、この3つのデータはすべてリセットされる。永続化されたストレージは一切ない。

## 既知の落とし穴（実際にハマったもの）

- `passlib` と新しいバージョンの `bcrypt`（4.1以降）の非互換性：bcrypt 4.1 以降、長すぎるパスワードに対する挙動が「暗黙に切り詰める」から「例外を投げる」に変わったため、passlib 起動時の自己診断処理がそのままクラッシュし、`password cannot be longer than 72 bytes` というエラーになる。`requirements.txt` で `bcrypt==4.0.1` に固定することで解決済みであり、追加対応は不要。
