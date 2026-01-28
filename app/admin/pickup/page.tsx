"use client";

import { useMemo, useRef, useState } from "react";

type Status = "new" | "working" | "done" | "ng";

type Row = {
  id: number;
  maker: string;
  model: string;
  drivable: "drivable" | "not_drivable";
  owner: "self" | "not_self";
  address: string;
  phone: string;
  email: string;
  status: Status;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

function formatJST(iso: string) {
  return new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function statusLabel(s: Status) {
  if (s === "new") return "新規";
  if (s === "working") return "対応中";
  if (s === "done") return "完了";
  return "NG";
}

async function safeReadJson(res: Response): Promise<any> {
  const text = await res.text().catch(() => "");
  if (!text) return {}; // 空レスポンス
  try {
    return JSON.parse(text);
  } catch {
    return { error: "Invalid JSON response", raw: text.slice(0, 200) };
  }
}

function getErrorMessage(res: Response, json: any) {
  if (json?.error) return String(json.error);
  if (res.status === 401) return "認証が切れました。ログインし直してください。";
  if (res.status === 429) return "アクセスが多すぎます。少し待ってから再試行してください。";
  if (res.status >= 500) return "サーバーエラーが発生しました。時間をおいて再試行してください。";
  return "エラーが発生しました。";
}

export default function AdminPickupPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | Status>("");
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState("");

  // 選択
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const selectedIds = useMemo(
    () => Object.keys(selected).filter((k) => selected[Number(k)]).map(Number),
    [selected]
  );

  // 行ごとの保存中表示
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [savedAt, setSavedAt] = useState<Record<number, number>>({});

  // メモ自動保存のdebounce（行ごと）
  const memoTimers = useRef<Map<number, any>>(new Map());

  const [detail, setDetail] = useState<Row | null>(null);

  async function load() {
    setMsg("読込中…");
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    params.set("limit", "200");

    const res = await fetch(`/api/admin/pickup?${params.toString()}`, { cache: "no-store" });
    const json = await safeReadJson(res);

    if (!res.ok || !json?.ok) {
      alert(`読込失敗：${getErrorMessage(res, json)}`);
      setRows([]);
      setMsg(json?.error ? `エラー：${json.error}` : "エラー");
      return;
    }

    // ★★★ ここだけ修正（表示されない原因の吸収） ★★★
    const list: Row[] = (json?.rows ?? json?.data?.rows ?? json?.data ?? []) as Row[];

    setRows(list);
    setMsg(`表示：${list.length} 件`);
    setSelected({}); // 読み込み時に選択はクリア
  }

  async function saveRowNow(id: number, patch: { status: Status; memo: string | null }) {
    setSaving((p) => ({ ...p, [id]: true }));

    const res = await fetch("/api/admin/pickup", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });

    const json = await safeReadJson(res);

    if (!res.ok || !json?.ok) {
      alert(`保存失敗：${getErrorMessage(res, json)}`);
      setSaving((p) => ({ ...p, [id]: false }));
      return;
    }

    setSaving((p) => ({ ...p, [id]: false }));
    setSavedAt((p) => ({ ...p, [id]: Date.now() }));
  }

  function scheduleMemoSave(id: number, nextMemo: string) {
    const t = memoTimers.current.get(id);
    if (t) clearTimeout(t);

    const timer = setTimeout(() => {
      const r = rows.find((x) => x.id === id);
      const st = (r?.status ?? "new") as Status;
      saveRowNow(id, { status: st, memo: nextMemo });
      memoTimers.current.delete(id);
    }, 1000);

    memoTimers.current.set(id, timer);
  }

  function toggleAll(checked: boolean) {
    if (!checked) {
      setSelected({});
      return;
    }
    const next: Record<number, boolean> = {};
    for (const r of rows) next[r.id] = true;
    setSelected(next);
  }

  async function bulkSetStatus(nextStatus: Status) {
    if (selectedIds.length === 0) return;

    const res = await fetch("/api/admin/pickup", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds, status: nextStatus }),
    });

    const json = await safeReadJson(res);
    if (!res.ok || !json?.ok) {
      alert(`一括更新失敗：${getErrorMessage(res, json)}`);
      return;
    }

    setRows((prev) => prev.map((r) => (selected[r.id] ? { ...r, status: nextStatus } : r)));
    setMsg(`一括更新：${selectedIds.length}件を「${statusLabel(nextStatus)}」に変更`);
  }

  const allChecked = rows.length > 0 && rows.every((r) => selected[r.id]);

  return (
    <main style={{ padding: 20, fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: 8 }}>引取問い合わせ 管理</h1>

      {/* 上部バー */}
      <div style={{ display: "grid", gap: 10, maxWidth: 1200 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ padding: 10, minWidth: 280 }}
            placeholder="検索：メーカー/車種/住所/電話/メール/メモ"
          />

          <select value={status} onChange={(e) => setStatus(e.target.value as any)} style={{ padding: 10 }}>
            <option value="">状態：すべて</option>
            <option value="new">新規</option>
            <option value="working">対応中</option>
            <option value="done">完了</option>
            <option value="ng">NG</option>
          </select>

 <button onClick={load} style={{ padding: "10px 12px", cursor: "pointer" }}>
            読み込み
          </button>


         <button
  onClick={async () => {
    alert("clicked"); 
    try {
      // 権限
      const perm = await Notification.requestPermission();
      alert("after permission");
      if (perm !== "granted") {
        alert("通知が許可されませんでした");
        return;
      }

      // SW ready
      // SW が無いと ready が返らず止まるので、ここで確実に取得する
let reg = await navigator.serviceWorker.getRegistration();
if (!reg) {
  // 未登録なら登録（devでも動かしたいならこれが必要）
  reg = await navigator.serviceWorker.register("/sw.js");
}

// 念のためアクティブ化を待つ（待てない環境ならここで止まるのを避ける）
await navigator.serviceWorker.ready;


      // 公開鍵取得
      const keyRes = await fetch("/api/admin/push/public-key", { cache: "no-store" });
      const keyJson = await safeReadJson(keyRes);
      const publicKey = keyJson?.key;
      if (!keyRes.ok || !publicKey) {
        alert(`公開鍵取得失敗：${getErrorMessage(keyRes, keyJson)} / key=${String(publicKey)}`);
        return;
      }

      // 購読作成
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // サーバへ保存（ここがDBに入るはず）
      const saveRes = await fetch("/api/admin/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
        cache: "no-store",
      });
      const saveJson = await safeReadJson(saveRes);

      if (!saveRes.ok || !saveJson?.ok) {
        alert(`購読保存失敗：${getErrorMessage(saveRes, saveJson)} (status=${saveRes.status})`);
        return;
      }

      alert("通知を有効化しました（購読が保存されました）");
    } catch (e: any) {
      alert(`通知設定で例外：${e?.message ?? e}`);
    }
  }}
  style={{ padding: "10px 12px", cursor: "pointer" }}
>
  通知を有効化
</button>


          <button
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
              location.href = "/admin/login";
            }}
            style={{ padding: "10px 12px", cursor: "pointer" }}
          >
            ログアウト
          </button>

          <span style={{ color: "#666" }}>{msg}</span>
        </div>

        {/* 一括操作バー */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: "#666" }}>選択：{selectedIds.length}件</span>

          <button
            disabled={selectedIds.length === 0}
            onClick={() => bulkSetStatus("new")}
            style={{ padding: "8px 10px", cursor: selectedIds.length ? "pointer" : "not-allowed" }}
          >
            新規へ
          </button>
          <button
            disabled={selectedIds.length === 0}
            onClick={() => bulkSetStatus("working")}
            style={{ padding: "8px 10px", cursor: selectedIds.length ? "pointer" : "not-allowed" }}
          >
            対応中へ
          </button>
          <button
            disabled={selectedIds.length === 0}
            onClick={() => bulkSetStatus("done")}
            style={{ padding: "8px 10px", cursor: selectedIds.length ? "pointer" : "not-allowed" }}
          >
            完了へ
          </button>
          <button
            disabled={selectedIds.length === 0}
            onClick={() => bulkSetStatus("ng")}
            style={{ padding: "8px 10px", cursor: selectedIds.length ? "pointer" : "not-allowed" }}
          >
            NGへ
          </button>

          <button onClick={() => setSelected({})} style={{ padding: "8px 10px", cursor: "pointer" }}>
            選択解除
          </button>
        </div>
      </div>

      {/* 一覧 */}
      <div className="desktopOnly" style={{ overflowX: "auto", marginTop: 14 }}>
        <table style={{ borderCollapse: "collapse", minWidth: 1300, width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px 6px" }}>
                <input type="checkbox" checked={allChecked} onChange={(e) => toggleAll(e.target.checked)} />
              </th>
              {[
                "ID",
                "作成日時",
                "メーカー/車種",
                "自走",
                "名義",
                "電話/メール",
                "住所",
                "状態（即保存）",
                "メモ（自動保存）",
                "更新日時",
                "状態",
              ].map((h) => (
                <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px 6px" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((r, idx) => {
              const isSaving = !!saving[r.id];
              const lastSaved = savedAt[r.id];
              const badge = isSaving ? "保存中…" : lastSaved ? "保存済" : "";

              return (
                <tr
                  key={r.id}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("input, select, textarea, button, a")) return;
                    setDetail(r);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px" }}>
                    <input
                      type="checkbox"
                      checked={!!selected[r.id]}
                      onChange={(e) => setSelected((p) => ({ ...p, [r.id]: e.target.checked }))}
                    />
                  </td>

                  <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px" }}>{r.id}</td>

                  <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px", whiteSpace: "nowrap" }}>
                    {formatJST(r.created_at)}
                  </td>

                  <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px" }}>
                    {r.maker} / {r.model}
                  </td>

                  <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px" }}>
                    {r.drivable === "drivable" ? "自走可" : "不動"}
                  </td>

                  <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px" }}>
                    {r.owner === "self" ? "本人" : "本人以外"}
                  </td>

                  <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px", whiteSpace: "nowrap" }}>
                    <a href={`tel:${r.phone}`} style={{ marginRight: 10 }}>
                      📞 {r.phone}
                    </a>
                    <a href={`mailto:${r.email}`}>✉ {r.email}</a>
                  </td>

                  <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px" }}>{r.address}</td>

                  <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px" }}>
                    <select
                      value={r.status}
                      onChange={(e) => {
                        const v = e.target.value as Status;
                        setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, status: v } : x)));
                        saveRowNow(r.id, { status: v, memo: r.memo ?? "" });
                      }}
                      style={{ padding: 8 }}
                    >
                      <option value="new">新規</option>
                      <option value="working">対応中</option>
                      <option value="done">完了</option>
                      <option value="ng">NG</option>
                    </select>
                  </td>

                  <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px" }}>
                    <textarea
                      value={r.memo ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, memo: v } : x)));
                        scheduleMemoSave(r.id, v);
                      }}
                      rows={2}
                      style={{ width: 280, padding: 8 }}
                      placeholder="対応メモ（1秒で自動保存）"
                    />
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{badge}</div>
                  </td>

                  <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px", whiteSpace: "nowrap", color: "#666" }}>
                    {formatJST(r.updated_at)}
                  </td>

                  <td style={{ borderBottom: "1px solid #eee", padding: "8px 6px", color: "#666" }}>
                    {statusLabel(r.status)}
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={12} style={{ padding: "14px 6px", color: "#666" }}>
                  上の「読み込み」を押してください。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mobileOnly" style={{ marginTop: 14, gap: 10 }}>
        {rows.map((r) => {
          const isSaving = !!saving[r.id];
          const lastSaved = savedAt[r.id];
          const badge = isSaving ? "保存中…" : lastSaved ? "保存済" : "";

          return (
            <div
              key={r.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 12,
                background: "#fff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontWeight: 700 }}>
                  #{r.id} {r.maker} / {r.model}
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={!!selected[r.id]}
                    onChange={(e) => setSelected((p) => ({ ...p, [r.id]: e.target.checked }))}
                  />
                  <span style={{ fontSize: 12, color: "#666" }}>選択</span>
                </label>
              </div>

              <div style={{ color: "#666", marginTop: 4, fontSize: 12 }}>
                受付：{formatJST(r.created_at)} / 更新：{formatJST(r.updated_at)}
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                <div>
                  <b>自走：</b> {r.drivable === "drivable" ? "自走可" : "不動"}　/　
                  <b>名義：</b> {r.owner === "self" ? "本人" : "本人以外"}
                </div>

                <div>
                  <b>住所：</b>
                  <div style={{ color: "#333" }}>{r.address}</div>
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <a href={`tel:${r.phone}`} style={{ textDecoration: "underline" }}>
                    📞 {r.phone}
                  </a>
                  <a href={`mailto:${r.email}`} style={{ textDecoration: "underline" }}>
                    ✉ {r.email}
                  </a>
                </div>

                <div>
                  <b>状態（即保存）</b>
                  <div>
                    <select
                      value={r.status}
                      onChange={(e) => {
                        const v = e.target.value as Status;
                        setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: v } : x)));
                        saveRowNow(r.id, { status: v, memo: r.memo ?? "" });
                      }}
                      style={{ padding: 10, width: "100%" }}
                    >
                      <option value="new">新規</option>
                      <option value="working">対応中</option>
                      <option value="done">完了</option>
                      <option value="ng">NG</option>
                    </select>
                  </div>
                </div>

                <div>
                  <b>メモ（自動保存）</b>
                  <textarea
                    value={r.memo ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, memo: v } : x)));
                      scheduleMemoSave(r.id, v);
                    }}
                    rows={4}
                    style={{ width: "100%", padding: 10 }}
                    placeholder="1秒で自動保存"
                  />
                  <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{badge}</div>
                </div>

                <button onClick={() => setDetail(r)} style={{ padding: "10px 12px", cursor: "pointer" }}>
                  詳細を開く
                </button>
              </div>
            </div>
          );
        })}

        {rows.length === 0 && <div style={{ padding: 12, color: "#666" }}>上の「読み込み」を押してください。</div>}
      </div>

      {detail && (
        <div
          onClick={() => setDetail(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              width: "min(900px, 92vw)",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              #{detail.id} {detail.maker} / {detail.model}
            </h2>

            <p style={{ color: "#666", marginTop: 0 }}>受付：{formatJST(detail.created_at)}</p>

            <hr />

            <p>
              <b>自走：</b> {detail.drivable === "drivable" ? "自走可" : "不動"}
              <br />
              <b>名義：</b> {detail.owner === "self" ? "本人" : "本人以外"}
            </p>

            <p>
              <b>住所</b>
              <br />
              {detail.address}
            </p>

            <p>
              <b>連絡先</b>
              <br />
              📞 <a href={`tel:${detail.phone}`}>{detail.phone}</a>
              <br />
              ✉ <a href={`mailto:${detail.email}`}>{detail.email}</a>
            </p>

            <p>
              <b>ステータス</b>
              <br />
              <select
                value={detail.status}
                onChange={(e) => {
                  const v = e.target.value as Status;
                  setRows((prev) => prev.map((x) => (x.id === detail.id ? { ...x, status: v } : x)));
                  setDetail({ ...detail, status: v });
                  saveRowNow(detail.id, { status: v, memo: detail.memo ?? "" });
                }}
                style={{ padding: 8 }}
              >
                <option value="new">新規</option>
                <option value="working">対応中</option>
                <option value="done">完了</option>
                <option value="ng">NG</option>
              </select>
            </p>

            <p>
              <b>対応メモ</b>
              <textarea
                value={detail.memo ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setRows((prev) => prev.map((x) => (x.id === detail.id ? { ...x, memo: v } : x)));
                  setDetail({ ...detail, memo: v });
                  scheduleMemoSave(detail.id, v);
                }}
                rows={6}
                style={{ width: "100%", padding: 10 }}
              />
            </p>

            <div style={{ textAlign: "right", marginTop: 12 }}>
              <button onClick={() => setDetail(null)} style={{ padding: "10px 14px", cursor: "pointer" }}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      

      {/* スマホ用 一括操作バー */}
      <div className="mobileBulkBar">
        <div>
          選択：<b>{selectedIds.length}</b>件
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button disabled={selectedIds.length === 0} onClick={() => bulkSetStatus("new")}>
            新規
          </button>
          <button disabled={selectedIds.length === 0} onClick={() => bulkSetStatus("working")}>
            対応中
          </button>
          <button disabled={selectedIds.length === 0} onClick={() => bulkSetStatus("done")}>
            完了
          </button>
          <button disabled={selectedIds.length === 0} onClick={() => bulkSetStatus("ng")}>
            NG
          </button>
        </div>
      </div>
    </main>
  );
}
