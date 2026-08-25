"""FastAPI 分页练习项目入口。"""
import math
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from crud import create_book, delete_book, get_book, list_books, list_books_cursor, update_book
from database import get_db, init_db, seed_data
from models import Book
from schemas import (
    AppliedFilters,
    BookCreate,
    BookListResponse,
    BookOut,
    BookQueryParams,
    BookUpdate,
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
def health(db: Session = Depends(get_db)):
    return {"status": "ok", "book_count": db.query(Book).count()}


@app.get("/books", response_model=BookListResponse)
def get_books(params: Annotated[BookQueryParams, Query()], db: Session = Depends(get_db)):
    """条件检索 + 排序 + 分页，所有查询参数都是可选的、可以任意组合。"""
    items, total = list_books(db, params)
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
    db: Session = Depends(get_db),
):
    """Cursor 分页：返回 id 大于 cursor 的下 limit 条数据。"""
    items = list_books_cursor(db, cursor, limit)
    next_cursor = items[-1].id if items else None
    return CursorBookListResponse(items=items, next_cursor=next_cursor, limit=limit)


@app.post("/books", response_model=BookOut, status_code=201)
def post_book(book_in: BookCreate, db: Session = Depends(get_db)):
    """新建一本书。"""
    return create_book(db, book_in)


@app.put("/books/{book_id}", response_model=BookOut)
def put_book(book_id: int, book_in: BookUpdate, db: Session = Depends(get_db)):
    """更新指定书籍（title / category / price 整体替换，created_at 不变）。"""
    book = get_book(db, book_id)
    if book is None:
        raise HTTPException(status_code=404, detail=f"book id={book_id} not found")
    return update_book(db, book, book_in)


@app.delete("/books/{book_id}", status_code=204)
def delete_book_endpoint(book_id: int, db: Session = Depends(get_db)):
    """删除指定书籍。"""
    book = get_book(db, book_id)
    if book is None:
        raise HTTPException(status_code=404, detail=f"book id={book_id} not found")
    delete_book(db, book)
    return Response(status_code=204)
