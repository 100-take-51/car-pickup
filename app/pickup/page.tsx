import "./pickup.css";
import PickupForm from "./PickupForm";
import type { Metadata } from "next";
import Image from "next/image";
import HeroAd from "./HeroAd";

export const metadata: Metadata = {
  title: "廃車・不動車の引取相談｜名義違い・相続や代理の方も対応",
  description:
    "動かない車・長年放置した車・名義が違う車でもご相談いただけます。写真不要・見積不要。事故後に移動できなくなった車の引取についても対応しています。",
};

const faqItems = [
  {
    q: "名義が本人ではなくても相談できますか？",
    a: "代理の方からのご相談も受け付けています。状況をお聞きしたうえでご案内します。",
  },
  {
    q: "写真や見積は必要ですか？",
    a: "写真の送付や事前の見積は必要ありません。まずは現在の状態を教えてください。",
  },
  {
    q: "追加費用が発生することはありますか？",
    a: "状況により確認が必要な場合がありますが、その際は事前にご説明します。",
  },
  {
    q: "相続した車でも相談できますか？",
    a: "相続された車についてのご相談も受け付けています。手続きの状況が分からない場合でも、まずは状態を教えてください。",
  },
  {
    q: "エンジンがかからない車でも引き取ってもらえますか？",
    a: "自走できない車についてもご相談いただけます。状況に応じて引取方法をご案内します。",
  },
  {
    q: "長年放置している車でも対応できますか？",
    a: "長期間動かしていない車についても、状況を確認のうえ対応しています。",
  },
  {
    q: "事故を起こした（起こされた）車で、移動できなくても相談できますか？",
    a: "事故後、警察による確認のために一度移動された車についても、その後の引取についてご相談を受け付けています。保険で対応できない二次搬送が必要な場合でも、状況を確認のうえご案内します。",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((x) => ({
    "@type": "Question",
    name: x.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: x.a,
    },
  })),
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "廃車・不動車の引取相談｜名義違い・相続や代理の方も対応",
  description:
    "動かない車や事故後に移動できなくなった車、名義違いや相続車の引取についてご相談を受け付けています。",
  author: {
    "@type": "Organization",
    name: "elg廃車引取急行サービス部",
  },
  publisher: {
    "@type": "Organization",
    name: "elg廃車引取急行サービス部",
    address: {
      "@type": "PostalAddress",
      addressRegion: "大阪府",
      addressLocality: "和泉市",
      streetAddress: "浦田町822",
    },
  },
};

export const dynamic = "force-static";

export default function PickupPage() {
  return (
    <>
      <main className="wrap">
        <header className="hero">
          <h1>廃車・不動車の引取相談｜名義違い・相続や代理の方も対応</h1>
          <p className="lead">
            こちらは<strong>買取査定サイトではなく</strong>、廃車・相続車などの「引取／手続き」のご相談窓口です。
            <br />
            不動車・状況不明でもOK。入力は1分ほどで完了します。
          </p>
        </header>

<HeroAd />

<section className="card" aria-label="サービス紹介">
  <div style={{ borderRadius: 16, overflow: "hidden" }}>
    <Image
      src="/pickup-hero.png"
      alt="廃車・不動車 引取のご相談（名義違い・相続・代理も対応）"
      width={1200}
      height={1200}
      priority
      style={{ width: "100%", height: "auto", display: "block" }}
    />
  </div>

  <h2 style={{ marginTop: 14 }}>動かない車・長年放置した車・代理の方でも大丈夫</h2>
  <p className="lead">
    高額な追加ロードサービス費用のお支払いゼロ。写真なし、見積なし。まずは状態を教えてください。
  </p>

  <ul className="lead" style={{ lineHeight: 1.8, paddingLeft: 18, margin: "10px 0 0" }}>
    <li>不動車・放置車・名義違い・相続のご相談</li>
    <li>事故後に動かない車（二次搬送）も対応</li>
    <li>強引な営業はしません</li>
  </ul>

  <p style={{ marginTop: 12 }}>
    <a href="tel:0728146013" style={{ fontWeight: 800, textDecoration: "underline" }}>
      電話で相談する：072-814-6013
    </a>
  </p>
</section>

        {/* フォーム（最優先） */}
        <section className="card" id="pickup-form">
          <h2>廃車・不動車 引取のご相談フォーム</h2>
          <PickupForm />
        </section>

        {/* 事故・二次搬送（今回の強み：フォーム直後） */}
        <section className="card">
          <h2>事故後に動かない車の引取（二次搬送にも対応）</h2>
          <p className="lead">
            事故を起こした、または事故に遭ったことで移動できなくなった車についてのご相談も多くいただいています。
            事故現場から警察署や指定場所までは保険で移動できても、その後の移動は「二次搬送」となり、追加で費用が必要になるケースがあります。
          </p>
          <p className="lead">
            事故後、警察による確認のために一度移動された車についても、その後の引取についてご相談を受け付けています。
            動かせない状態でも構いませんので、まずは現在の状況を教えてください。
          </p>
        </section>

        {/* 困りごと（ロングテール対策） */}
        <section className="card">
          <h2>こんな車でお困りではありませんか？</h2>

          <h3>エンジンがかからない不動車</h3>
          <p className="lead">自走できない車でもご相談いただけます。状況に応じて引取方法をご案内します。</p>

          <h3>長年放置している車</h3>
          <p className="lead">長期間動かしていない車についても、状況を確認のうえ対応しています。</p>

          <h3>名義が本人ではない車（代理の方）</h3>
          <p className="lead">名義が違う場合や、代理の方からのご相談も受け付けています。まずは状況を教えてください。</p>

          <h3>相続した車（名義変更前でも相談可）</h3>
          <p className="lead">相続された車についてもご相談いただけます。手続きの状況が分からない場合でも構いません。</p>
        </section>

        {/* 費用（不安を消す） */}
        <section className="card">
          <h2>引取費用と追加費用について</h2>

          <h3>引取費用は無料です</h3>
          <p className="lead">お車の状態を確認のうえ、引取方法をご案内します。</p>

          <h3>追加費用が必要な場合は事前にご説明します</h3>
          <p className="lead">状況により確認が必要な場合がありますが、その際は事前にご説明します。</p>
        </section>

        {/* 流れ（不安を消す） */}
        <section className="card">
          <h2>引取の流れ（写真・見積不要）</h2>
          <ol className="lead" style={{ lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
            <li>フォームから、メーカー・車種・状態などを入力</li>
            <li>内容を確認のうえ、必要な追加確認がある場合のみご連絡</li>
            <li>引取方法や手続きの流れをご案内</li>
          </ol>
          <p className="note" style={{ marginTop: 10 }}>
            ※ 強引な営業はしません。状況により確認が必要な場合は事前にご説明します。
          </p>
        </section>

        {/* FAQ（表示＋JSON-LDで一致） */}
        <section className="card">
          <h2>よくあるご質問</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {faqItems.map((x) => (
              <details
                key={x.q}
                style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, padding: 10 }}
              >
                <summary style={{ cursor: "pointer", fontWeight: 700 }}>{x.q}</summary>
                <p className="lead" style={{ marginTop: 8 }}>
                  {x.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* フッター（指定どおり） */}
        <footer className="footer">
          <div style={{ lineHeight: 1.8 }}>
            <div>運営元</div>
            <div>elg廃車引取急行サービス部</div>
            <div>大阪府和泉市浦田町822</div>
            <div>Call 072-814-6013</div>
          </div>
        </footer>

        {/* JSON-LD（FAQ + Article） */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      </main>
    </>
  );
}
