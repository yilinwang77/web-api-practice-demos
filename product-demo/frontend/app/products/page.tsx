"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearToken, fetchProducts, getToken, ProductsResponse } from "@/lib/api";

const PAGE_SIZE = 5;

export default function ProductsPage() {
  const router = useRouter();
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async (targetPage: number, refresh = false) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchProducts(targetPage, PAGE_SIZE, refresh);
        setData(res);
      } catch (err) {
        if (err instanceof Error && err.message === "UNAUTHORIZED") {
          router.push("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">商品列表</h1>
            {data && (
              <p className="mt-1 text-sm text-slate-400">
                第 {data.page} / {data.total_pages} 页 · 共 {data.total} 件商品
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-500 transition hover:bg-slate-200/60 hover:text-slate-900"
          >
            退出登录
          </button>
        </div>

        {data && (
          <div className="mb-5 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                data.from_cache
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  data.from_cache ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {data.from_cache ? "from_cache: true · 命中缓存" : "from_cache: false · 重新查询"}
            </span>
          </div>
        )}

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="h-[72px] animate-pulse rounded-xl bg-slate-200/60" />
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            {data?.items.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">{p.name}</span>
                  <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-sm font-medium text-white">
                    ¥{p.price}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{p.description}</p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!data || data.page <= 1}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
          >
            ← 上一页
          </button>

          <button
            onClick={() => load(page, true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition hover:text-slate-700"
          >
            强制刷新（跳过缓存）
          </button>

          <button
            onClick={() => setPage((p) => (data ? Math.min(data.total_pages, p + 1) : p))}
            disabled={!data || data.page >= data.total_pages}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
          >
            下一页 →
          </button>
        </div>
      </div>
    </div>
  );
}
