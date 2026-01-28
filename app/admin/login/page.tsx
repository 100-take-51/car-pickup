"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("ログイン中…");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // ★追加：cookie を確実に保存
      body: JSON.stringify({ pass }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json?.ok) {
      setMsg(json?.error ? `エラー：${json.error}` : "ログイン失敗");
      return;
    }

    setMsg("OK");

    // ★変更：Next Router より確実に画面遷移（SW/拡張/ hydration でも動く）
    const next = new URLSearchParams(window.location.search).get("next") || "/admin/pickup";
    window.location.href = next;
  }

  return (
    <main style={{ padding: 20, fontFamily: "system-ui", maxWidth: 520 }}>
      <h1>管理ログイン</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          placeholder="管理パスワード"
          style={{ padding: 12 }}
        />
        <button style={{ padding: "12px 14px", cursor: "pointer" }}>ログイン</button>
        <div style={{ color: "#666" }}>{msg}</div>
      </form>
    </main>
  );
}
