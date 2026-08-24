"""数据库初始化 + 假数据生成。

用 Python 内置的 sqlite3（不用 ORM），
方便后面在接口里直接手写 SQL，practicing 拼 WHERE / ORDER BY / LIMIT。
"""
import random
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

DB_PATH = Path(__file__).parent / "books.db"

CATEGORIES = ["小説", "技術書", "漫画", "その他"]

# 假数据条数范围
SEED_MIN = 60
SEED_MAX = 80


def get_connection() -> sqlite3.Connection:
    """获取一个数据库连接，row_factory 设为 Row 方便按列名取值 / 转成 dict。"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """创建 books 表（如果不存在）。"""
    conn = get_connection()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


def _random_created_at() -> str:
    """生成过去两年内的随机时间，方便按 created_at 排序时有区分度。"""
    days_ago = random.randint(0, 730)
    seconds_ago = random.randint(0, 86400)
    dt = datetime(2026, 8, 24) - timedelta(days=days_ago, seconds=seconds_ago)
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def seed_data() -> None:
    """如果表是空的，插入 60~80 条随机图书数据。"""
    conn = get_connection()
    count = conn.execute("SELECT COUNT(*) FROM books").fetchone()[0]

    if count > 0:
        conn.close()
        return

    total = random.randint(SEED_MIN, SEED_MAX)
    rows = []
    for i in range(1, total + 1):
        title = f"Book {i}"
        category = random.choice(CATEGORIES)
        price = round(random.uniform(300, 8000), 2)
        created_at = _random_created_at()
        rows.append((title, category, price, created_at))

    conn.executemany(
        "INSERT INTO books (title, category, price, created_at) VALUES (?, ?, ?, ?)",
        rows,
    )
    conn.commit()
    conn.close()
