// app/pickup/HeroAd.tsx
import Image from "next/image";

export default function HeroAd() {
  return (
    <section className="card" aria-label="スマホ向け案内">
      <div className="heroAd">
        {/* 背景画像（雰囲気用：文字はHTMLで上書き） */}
        <Image
          src="/pickup-hero.png"
          alt=""
          width={1200}
          height={1200}
          priority
          className="heroAdBg"
        />

        {/* 読みやすさ確保のオーバーレイ */}
        <div className="heroAdOverlay" />

        <div className="heroAdInner">
          <p className="heroAdKicker">こんな車でお困りではありませんか？</p>

          {/* 改行位置を固定して“広告っぽさ”を再現 */}
          <h2 className="heroAdTitle">
            動かない車・<br />
            長年放置した車・<br />
            代理の方でも大丈夫
          </h2>

          {/* 斜体＋右上がり（画像の主役部分） */}
          <div className="heroAdRibbon" aria-label="引取費用の案内">
            <span>引取費用は無料！すぐにお伺いします！</span>
          </div>

          <p className="heroAdLead">
            高額な追加ロードサービス費用のお支払いゼロ！
            <br />
            写真なし、見積なし。
            <br />
            まずは状態を教えてください。
          </p>

          <div className="heroAdBadges" aria-label="安心ポイント">
            <div className="heroAdBadge">不動車 OK</div>
            <div className="heroAdBadge">名義違い OK</div>
            <div className="heroAdBadge">相続 OK</div>
            <div className="heroAdBadge">二次搬送 対応</div>
          </div>

          <div className="heroAdCtas">
            <a className="heroAdBtn" href="#pickup-form">
              フォームで相談する
            </a>
            <a className="heroAdTel" href="tel:0728146013">
              電話：072-814-6013
            </a>
          </div>

          <p className="heroAdNote">※ 強引な営業はしません。状況により確認が必要な場合は事前にご説明します。</p>
        </div>
      </div>
    </section>
  );
}
