import { useEffect, useState } from "react";
import { Generator } from "./components/Generator";
import { Decoder } from "./components/Decoder";
import { dictionaries } from "./lib/i18n";
import type { Lang } from "./lib/i18n";

type Tab = "generate" | "decode";

const STORAGE_KEY = "qrcode-tools.lang";

export default function App() {
  const [tab, setTab] = useState<Tab>("generate");
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved === "en" || saved === "zh") setLang(saved);
  }, []);

  const toggleLang = () => {
    const next = lang === "en" ? "zh" : "en";
    setLang(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
  };

  const t = dictionaries[lang];

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <img src="./qr.svg" alt="" className="logo" />
          <div>
            <h1>{t.appTitle}</h1>
            <p className="subtitle">{t.appSubtitle}</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn ghost lang-btn" onClick={toggleLang}>
            {t.langLabel}
          </button>
          <a
            className="btn ghost github-btn"
            href="https://github.com/halo/qrcode-tools"
            target="_blank"
            rel="noreferrer noopener"
          >
            {t.github}
          </a>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${tab === "generate" ? "active" : ""}`}
          onClick={() => setTab("generate")}
        >
          {t.tabGenerate}
        </button>
        <button
          className={`tab ${tab === "decode" ? "active" : ""}`}
          onClick={() => setTab("decode")}
        >
          {t.tabDecode}
        </button>
      </nav>

      <main className="content">
        {tab === "generate" ? <Generator lang={lang} /> : <Decoder lang={lang} />}
      </main>

      <footer className="footer">
        <span className="muted">{t.footer}</span>
      </footer>
    </div>
  );
}
