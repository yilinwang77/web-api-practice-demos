"""动态拼接 SQL：WHERE 筛选 -> ORDER BY 排序 -> LIMIT/OFFSET 分页。"""
from database import get_connection


def _build_where(params) -> tuple[str, list]:
    """根据查询参数拼出 WHERE 子句，值全部用 ? 占位符传参，不做字符串拼接。"""
    conditions = []
    values = []

    if params.category:
        conditions.append("category = ?")
        values.append(params.category)

    if params.min_price is not None:
        conditions.append("price >= ?")
        values.append(params.min_price)

    if params.max_price is not None:
        conditions.append("price <= ?")
        values.append(params.max_price)

    if params.keyword:
        conditions.append("title LIKE ?")
        values.append(f"%{params.keyword}%")

    where_sql = f" WHERE {' AND '.join(conditions)}" if conditions else ""
    return where_sql, values


def list_books(params) -> tuple[list[dict], int]:
    """按条件筛选 + 排序 + 分页，返回 (当页数据, 总条数)。"""
    where_sql, values = _build_where(params)
    conn = get_connection()

    total = conn.execute(f"SELECT COUNT(*) FROM books{where_sql}", values).fetchone()[0]

    order_sql = ""
    if params.sort_by:
        # sort_by / order 的值已经在 schemas.py 里用 Literal 做过白名单校验，
        # 到这里只可能是固定的几个字符串之一，所以可以放心直接拼进 SQL——
        # 列名和排序方向本来就不能用 ? 占位符，只有"值已被限定在白名单内"才安全。
        order_sql = f" ORDER BY {params.sort_by} {params.order.upper()}"

    offset = (params.page - 1) * params.page_size
    rows = conn.execute(
        f"SELECT * FROM books{where_sql}{order_sql} LIMIT ? OFFSET ?",
        [*values, params.page_size, offset],
    ).fetchall()
    conn.close()

    return [dict(row) for row in rows], total


def list_books_cursor(cursor: int, limit: int) -> list[dict]:
    """Cursor 分页：取 id 大于 cursor 的下 limit 条，按 id 升序排列。"""
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM books WHERE id > ? ORDER BY id ASC LIMIT ?",
        (cursor, limit),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]
