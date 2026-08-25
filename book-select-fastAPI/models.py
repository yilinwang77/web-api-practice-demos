"""SQLAlchemy ORM 模型定义。"""
from sqlalchemy import Column, Float, Integer, String

from database import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)
    price = Column(Float, nullable=False)
    created_at = Column(String, nullable=False)
