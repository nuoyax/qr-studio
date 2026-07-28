import { useCallback, useEffect, useState } from "react";
import { Generator } from "./components/Generator";
import { Decoder } from "./components/Decoder";
import { HistoryPanel } from "./components/HistoryPanel";
import { dictionaries } from "./lib/i18n";
import type { Lang } from "./lib/i18n";
import {
  applyTheme,
  getStoredTheme,
  toggleTheme,
} from "./lib/theme";
import type { Theme } from "./lib/theme";
import { addHistory } from "./lib/history";
import type { HistoryItem } from "./lib/history";

type Tab = "generate" | "decode";

const LANG_KEY = "qr-studio.lang";

export default function App() {
  const [tab, setTab] = useState<Tab>("generate");
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<Theme>("light");
  /** Bump to force Generator/Decoder to re-read restore target. */
  const [restoreNonce, setRestoreNonce] = useState(0);
  const [restoreTarget, setRestoreTarget] = useState<HistoryItem | null>(null);

  // bootstrap persisted prefs
  useEffect(() => {
    const savedLang = localStorage.getItem(LANG_KEY) as Lang | null;
    if (savedLang === "en" || savedLang === "zh") setLang(savedLang);
    const th = getStoredTheme();
    setTheme(th);
    applyTheme(th);
  }, []);

  const toggleLang = () => {
    const next: Lang = lang === "en" ? "zh" : "en";
    setLang(next);
    localStorage.setItem(LANG_KEY, next);
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
  };

  const onToggleTheme = () => setTheme((th) => toggleTheme(th));

  const t = dictionaries[lang];

  // Record generation/decoding into history. Components call this via props.
  const recordGen = useCallback((text: string) => addHistory("gen", text), []);
  const recordDec = useCallback((text: string) => addHistory("dec", text), []);

  const onRestore = useCallback((item: HistoryItem) => {
    setRestoreTarget(item);
    setRestoreNonce((n) => n + 1);
    setTab(item.kind === "gen" ? "generate" : "decode");
  }, []);

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
          <button
            className="btn ghost theme-btn"
            onClick={onToggleTheme}
            title={theme === "dark" ? t.lightMode : t.darkMode}
            aria-label={theme === "dark" ? t.lightMode : t.darkMode}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <button className="btn ghost lang-btn" onClick={toggleLang}>
            {t.langLabel}
          </button>
          <a
            className="btn ghost github-btn"
            href="https://github.com/halo/qr-studio"
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
        {tab === "generate" ? (
          <Generator
            lang={lang}
            onGenerated={recordGen}
            restore={restoreTarget}
            restoreNonce={restoreNonce}
          />
        ) : (
          <Decoder
            lang={lang}
            onDecoded={recordDec}
            restore={restoreTarget}
            restoreNonce={restoreNonce}
          />
        )}
        <HistoryPanel lang={lang} onRestore={onRestore} />
      </main>

      <footer className="footer">
        <span className="muted">{t.footer}</span>
      </footer>
    </div>
  );
}
