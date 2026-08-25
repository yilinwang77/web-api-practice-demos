"""SQLAlchemy 引擎 / Session 管理，以及假数据生成。"""
import random
from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DB_PATH = Path(__file__).parent / "books.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# check_same_thread=False：sqlite 默认只允许创建它的线程访问连接，
# 但 FastAPI 用线程池处理请求，所以要关掉这个限制。
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

CATEGORIES = ["小説", "技術書", "漫画", "その他"]
SEED_MIN = 60
SEED_MAX = 80


def get_db():
    """FastAPI 依赖：每个请求开一个 Session，处理完自动关闭，不用手动管理连接。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """建表（如果不存在）。局部 import 是为了避免和 models.py 之间循环 import。"""
    from models import Book  # noqa: F401  注册到 Base.metadata 里

    Base.metadata.create_all(bind=engine)


def _random_created_at() -> str:
    """生成过去两年内的随机时间，方便按 created_at 排序时有区分度。"""
    days_ago = random.randint(0, 730)
    seconds_ago = random.randint(0, 86400)
    dt = datetime(2026, 8, 24) - timedelta(days=days_ago, seconds=seconds_ago)
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def seed_data() -> None:
    """如果表是空的，插入 60~80 条随机图书数据。"""
    from models import Book

    db = SessionLocal()
    try:
        if db.query(Book).count() > 0:
            return

        total = random.randint(SEED_MIN, SEED_MAX)
        books = [
            Book(
                title=f"Book {i}",
                category=random.choice(CATEGORIES),
                price=round(random.uniform(300, 8000), 2),
                created_at=_random_created_at(),
            )
            for i in range(1, total + 1)
        ]
        db.add_all(books)
        db.commit()
    finally:
        db.close()
