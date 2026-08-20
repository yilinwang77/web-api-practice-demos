import math
import time
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "demo-secret-key-change-me"
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 120

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 写死的测试账号，密码用 bcrypt 加密存储
USERS = [
    {"username": "test", "password_hash": pwd_context.hash("123456")},
    {"username": "alice", "password_hash": pwd_context.hash("password")},
]

# 写死的商品数据
PRODUCTS = [
    {
        "id": i,
        "name": f"商品 {i}",
        "price": round(9.9 + i * 3.5, 2),
        "description": f"这是第 {i} 号测试商品的简单描述",
    }
    for i in range(1, 26)
]

CACHE_TTL_SECONDS = 60
CACHE: dict[str, dict] = {}

# 浏览器 HTTP 缓存的过期时间，故意和 CACHE_TTL_SECONDS 不同，方便对比两层缓存
HTTP_CACHE_MAX_AGE_SECONDS = 15


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


def create_access_token(username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    payload = {"sub": username, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload["sub"]


@app.post("/login", response_model=LoginResponse)
def login(body: LoginRequest):
    user = next((u for u in USERS if u["username"] == body.username), None)
    if not user or not pwd_context.verify(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    token = create_access_token(user["username"])
    return LoginResponse(access_token=token)


@app.get("/products")
def get_products(
    response: Response,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    refresh: bool = Query(False),
    username: str = Depends(get_current_user),
):
    # HTTP 层缓存：告诉浏览器这份响应本身可以直接复用多少秒，
    # 命中时请求根本不会到达这里（跟下面的内存缓存是两回事）
    if refresh:
        response.headers["Cache-Control"] = "no-store"
    else:
        response.headers["Cache-Control"] = f"max-age={HTTP_CACHE_MAX_AGE_SECONDS}"

    cache_key = f"{page}_{size}"
    now = time.time()

    if not refresh:
        cached = CACHE.get(cache_key)
        if cached and cached["expire_at"] > now:
            return {**cached["data"], "from_cache": True}

    total = len(PRODUCTS)
    total_pages = math.ceil(total / size)
    start = (page - 1) * size
    end = start + size
    items = PRODUCTS[start:end]

    data = {
        "items": items,
        "page": page,
        "size": size,
        "total": total,
        "total_pages": total_pages,
    }
    CACHE[cache_key] = {"data": data, "expire_at": now + CACHE_TTL_SECONDS}

    return {**data, "from_cache": False}
