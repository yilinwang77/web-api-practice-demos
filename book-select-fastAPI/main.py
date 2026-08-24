"""FastAPI 分页练习项目入口。"""
import math
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, Query
from fastapi.responses import FileResponse

from crud import list_books, list_books_cursor
from database import get_connection, init_db, seed_data
from schemas import (
    AppliedFilters,
    BookListResponse,
    BookQueryParams,
    CursorBookListResponse,
)

STATIC_DIR = Path(__file__).parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时：建表 + 插入假数据（如果表是空的）
    init_db()
    seed_data()
    yield


app = FastAPI(title="Book Select API", lifespan=lifespan)


@app.get("/", include_in_schema=False)
def index():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/health")
def health():
    conn = get_connection()
    count = conn.execute("SELECT COUNT(*) FROM books").fetchone()[0]
    conn.close()
    return {"status": "ok", "book_count": count}


@app.get("/books", response_model=BookListResponse)
def get_books(params: Annotated[BookQueryParams, Query()]):
    """条件检索 + 排序 + 分页，所有查询参数都是可选的、可以任意组合。"""
    items, total = list_books(params)
    total_pages = math.ceil(total / params.page_size) if total else 0

    return BookListResponse(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=total_pages,
        applied_filters=AppliedFilters(
            category=params.category,
            min_price=params.min_price,
            max_price=params.max_price,
            keyword=params.keyword,
            sort_by=params.sort_by,
            order=params.order,
        ),
    )


@app.get("/books/cursor", response_model=CursorBookListResponse)
def get_books_cursor(
    cursor: int = Query(default=0, ge=0, description="上一页最后一条的 id，从 0 开始"),
    limit: int = Query(default=10, ge=1, le=50),
):
    """Cursor 分页：返回 id 大于 cursor 的下 limit 条数据。"""
    items = list_books_cursor(cursor, limit)
    next_cursor = items[-1]["id"] if items else None
    return CursorBookListResponse(items=items, next_cursor=next_cursor, limit=limit)
