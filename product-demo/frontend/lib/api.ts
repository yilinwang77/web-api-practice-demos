export const API_BASE = "http://127.0.0.1:8000";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

export async function login(username: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    throw new Error("用户名或密码错误");
  }
  const data = await res.json();
  return data.access_token as string;
}

export type Product = {
  id: number;
  name: string;
  price: number;
  description: string;
};

export type ProductsResponse = {
  items: Product[];
  page: number;
  size: number;
  total: number;
  total_pages: number;
  from_cache: boolean;
};

export async function fetchProducts(
  page: number,
  size: number,
  refresh = false
): Promise<ProductsResponse> {
  const token = getToken();
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (refresh) params.set("refresh", "true");

  const res = await fetch(`${API_BASE}/products?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearToken();
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) {
    throw new Error("获取商品列表失败");
  }
  return res.json();
}
