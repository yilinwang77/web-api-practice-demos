"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("test");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = await login(username, password);
      setToken(token);
      router.push("/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60"
      >
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-2xl">
            🛍️
          </div>
          <h1 className="text-xl font-semibold text-slate-900">欢迎回来</h1>
          <p className="mt-1 text-sm text-slate-400">登录以浏览商品</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-600">用户名</label>
            <input
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-600">密码</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "登录中..." : "登录"}
        </button>

        <p className="mt-5 text-center text-xs text-slate-400">
          测试账号：<span className="font-mono text-slate-500">test / 123456</span>
        </p>
      </form>
    </div>
  );
}
