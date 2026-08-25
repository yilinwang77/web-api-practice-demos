"""用 SQLAlchemy 查询实现 CRUD：filter 筛选 -> order_by 排序 -> offset/limit 分页。"""
from datetime import datetime

from sqlalchemy import asc, desc
from sqlalchemy.orm import Session

from models import Book
from schemas import BookCreate, BookUpdate

# sort_by 白名单：schemas.py 里 Literal["price", "created_at", "id"] 已经把
# 输入限制成这三个字符串之一，这里再映射到模型上真实的 Column 对象——
# 排序永远走 SQLAlchemy 的表达式，不会有拼接用户输入到 SQL 里的情况。
SORTABLE_COLUMNS = {"id": Book.id, "price": Book.price, "created_at": Book.created_at}


def _apply_filters(query, params):
    if params.category:
        query = query.filter(Book.category == params.category)
    if params.min_price is not None:
        query = query.filter(Book.price >= params.min_price)
    if params.max_price is not None:
        query = query.filter(Book.price <= params.max_price)
    if params.keyword:
        query = query.filter(Book.title.like(f"%{params.keyword}%"))
    return query


def list_books(db: Session, params) -> tuple[list[Book], int]:
    """按条件筛选 + 排序 + 分页，返回 (当页数据, 总条数)。"""
    query = _apply_filters(db.query(Book), params)
    total = query.count()

    if params.sort_by:
        column = SORTABLE_COLUMNS[params.sort_by]
        query = query.order_by(desc(column) if params.order == "desc" else asc(column))

    offset = (params.page - 1) * params.page_size
    items = query.offset(offset).limit(params.page_size).all()
    return items, total


def list_books_cursor(db: Session, cursor: int, limit: int) -> list[Book]:
    """Cursor 分页：取 id 大于 cursor 的下 limit 条，按 id 升序排列。"""
    return db.query(Book).filter(Book.id > cursor).order_by(asc(Book.id)).limit(limit).all()


def get_book(db: Session, book_id: int) -> Book | None:
    return db.query(Book).filter(Book.id == book_id).first()


def create_book(db: Session, book_in: BookCreate) -> Book:
    book = Book(
        title=book_in.title,
        category=book_in.category,
        price=book_in.price,
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


def update_book(db: Session, book: Book, book_in: BookUpdate) -> Book:
    book.title = book_in.title
    book.category = book_in.category
    book.price = book_in.price
    db.commit()
    db.refresh(book)
    return book


def delete_book(db: Session, book: Book) -> None:
    db.delete(book)
    db.commit()
