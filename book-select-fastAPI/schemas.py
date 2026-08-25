"""Pydantic 模型：请求参数校验 + 响应结构定义。"""
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

Category = Literal["小説", "技術書", "漫画", "その他"]
# sort_by 白名单：只允许这三个字段，Pydantic 的 Literal 在这里就是"白名单校验"，
# 不在这个集合里的值会直接被 FastAPI 拒绝并返回 422，根本进不到业务代码里。
SortField = Literal["price", "created_at", "id"]
Order = Literal["asc", "desc"]


class BookQueryParams(BaseModel):
    """GET /books 的查询参数，字段名会被 FastAPI 自动映射成同名的 query string 参数。"""

    category: Optional[Category] = Field(default=None, description="精确匹配分类")
    min_price: Optional[float] = Field(default=None, ge=0, description="最低价格")
    max_price: Optional[float] = Field(default=None, ge=0, description="最高价格")
    keyword: Optional[str] = Field(default=None, min_length=1, description="标题模糊搜索")
    sort_by: Optional[SortField] = Field(default=None, description="排序字段")
    order: Order = Field(default="asc", description="排序方向")
    page: int = Field(default=1, ge=1, description="页码，从 1 开始")
    page_size: int = Field(default=10, ge=1, le=50, description="每页条数，最大 50")

    @model_validator(mode="after")
    def check_price_range(self):
        if self.min_price is not None and self.max_price is not None:
            if self.min_price > self.max_price:
                raise ValueError("min_price 不能大于 max_price")
        return self


class BookOut(BaseModel):
    # from_attributes=True：允许直接从 SQLAlchemy 的 Book 对象读取属性，
    # 不用先手动转成 dict。
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    category: str
    price: float
    created_at: str


class BookBase(BaseModel):
    """POST / PUT 请求体的公共字段。"""

    title: str = Field(..., min_length=1)
    category: Category
    price: float = Field(..., ge=0)


class BookCreate(BookBase):
    pass


class BookUpdate(BookBase):
    pass


class AppliedFilters(BaseModel):
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    keyword: Optional[str] = None
    sort_by: Optional[str] = None
    order: str


class BookListResponse(BaseModel):
    items: list[BookOut]
    total: int
    page: int
    page_size: int
    total_pages: int
    applied_filters: AppliedFilters


class CursorBookListResponse(BaseModel):
    items: list[BookOut]
    next_cursor: Optional[int]
    limit: int
