"use client";

import { useEffect } from "react";

const MAKES_MODELS: Record<string, string[]> = {
  "トヨタ": ["プリウス", "アクア", "アルファード", "ハイエース", "わからない"],
  "ホンダ": ["N-BOX", "フィット", "ヴェゼル", "フリード", "わからない"],
  "日産": ["ノート", "セレナ", "エクストレイル", "わからない"],
  "スズキ": ["ワゴンR", "スペーシア", "ハスラー", "わからない"],
  "ダイハツ": ["タント", "ムーヴ", "ミライース", "わからない"],
  "マツダ": ["デミオ", "CX-5", "ロードスター", "わからない"],
  "スバル": ["インプレッサ", "フォレスター", "レヴォーグ", "わからない"],
  "三菱": ["デリカD:5", "eKワゴン", "わからない"],
};

export default function PickupForm() {
  const makes = Object.keys(MAKES_MODELS).sort((a, b) =>
    a.localeCompare(b, "ja")
  );

  // メーカー→車種 連動（最小）
  useEffect(() => {
    const makerEl = document.getElementById("maker") as HTMLSelectElement | null;
    const modelEl = document.getElementById("model") as HTMLSelectElement | null;
    if (!makerEl || !modelEl) return;

    function setModels(make: string) {
	if (!modelEl) return;
      modelEl.innerHTML = "";

      const opt0 = document.createElement("option");
      opt0.value = "";
      opt0.disabled = true;
      opt0.textContent = "選択してください";
      modelEl.appendChild(opt0);

      const models = MAKES_MODELS[make] ?? ["わからない"];
      for (const m of models) {
        const opt = document.createElement("option");
        opt.value = m;
        opt.textContent = m;
        modelEl.appendChild(opt);
      }

      modelEl.value = "";
    }

    const onChange = () => setModels(makerEl.value);
    makerEl.addEventListener("change", onChange);

    return () => makerEl.removeEventListener("change", onChange);
  }, []);

  return (
    <form
      className="form"
      onSubmit={async (e) => {
  e.preventDefault();

  const form = e.currentTarget as HTMLFormElement;
  const fd = new FormData(form);

  const payload = {
    maker: String(fd.get("maker") ?? ""),
    model: String(fd.get("model") ?? ""),
    drivable: String(fd.get("drivable") ?? ""),
    owner: String(fd.get("owner") ?? ""),
    address: String(fd.get("address") ?? ""),
    phone: String(fd.get("phone") ?? ""),
    email: String(fd.get("email") ?? ""),
  company: String(fd.get("company") ?? ""), // 追加

  };

  const msg = document.getElementById("result-msg");
  if (msg) {
    msg.textContent = "送信中…";
    msg.className = "msg";
  }

  const res = await fetch("/api/pickup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));

  if (res.ok && json?.ok) {
    form.reset();
    if (msg) {
      msg.textContent = "受付しました。内容を確認のうえご連絡します。";
      msg.className = "msg ok";
    }
  } else {
    if (msg) {
      msg.textContent = json?.error
        ? `送信に失敗しました：${json.error}`
        : "送信に失敗しました。時間をおいて再度お試しください。";
      msg.className = "msg ng";
    }
  }
}}
   >
      <div className="grid2">
        <label>
          メーカー <span className="req">必須</span>
          <select name="maker" id="maker" required defaultValue="">
            <option value="" disabled>
              選択してください
            </option>
            {makes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label>
          車種 <span className="req">必須</span>
          <select name="model" id="model" required defaultValue="">
            <option value="" disabled>
              メーカーを先に選択
            </option>
          </select>
        </label>
      </div>

      <fieldset className="fieldset">
        <legend>
          自走可否 <span className="req">必須</span>
        </legend>
        <label className="radio">
          <input type="radio" name="drivable" value="drivable" required />
          自走可能
        </label>
        <label className="radio">
          <input type="radio" name="drivable" value="not_drivable" required />
          不動車
        </label>
      </fieldset>

      <fieldset className="fieldset">
        <legend>
          所有者名義 <span className="req">必須</span>
        </legend>
        <label className="radio">
          <input type="radio" name="owner" value="self" required />
          本人
        </label>
        <label className="radio">
          <input type="radio" name="owner" value="not_self" required />
          本人ではない（相続等）
        </label>
      </fieldset>

      <label>
        住所 <span className="req">必須</span>
        <input
          name="address"
          type="text"
          placeholder="例：大阪府〇〇市〇〇…"
          required
        />
      </label>

      <div className="grid2">
        <label>
          携帯電話番号 <span className="req">必須</span>
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="例：09012345678"
            required
          />
        </label>
        <label>
          メールアドレス <span className="req">必須</span>
          <input
            name="email"
            type="email"
            inputMode="email"
            placeholder="例：example@mail.com"
            required
          />
        </label>
      </div>

{/* bot対策（人は触らない） */}
<div style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
  <label>
    ここは入力しないでください
    <input name="company" tabIndex={-1} autoComplete="off" />
  </label>
</div>


      <button className="btn" type="submit">
        この内容で相談する
      </button>

      <p id="result-msg" className="msg" aria-live="polite"></p>

      <p className="note">
        ※ 送信内容をもとに、追加確認が必要な場合のみご連絡します。
      </p>
    </form>
  );
}
