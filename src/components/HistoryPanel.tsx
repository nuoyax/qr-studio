import { useEffect, useState } from "react";
import type { Lang } from "../lib/i18n";
import { dictionaries } from "../lib/i18n";
import {
  clearHistory,
  historyToCsv,
  historyToJson,
  loadHistory,
} from "../lib/history";
import type { HistoryItem } from "../lib/history";
import { triggerBlobDownload } from "../lib/zip";

interface Props {
  lang: Lang;
  /** Called when the user clicks "restore" on an item. */
  onRestore: (item: HistoryItem) => void;
}

export function HistoryPanel({ lang, onRestore }: Props) {
  const t = dictionaries[lang];
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setItems(loadHistory());
  }, [open]);

  const handleClear = () => {
    clearHistory();
    setItems([]);
  };

  const exportCsv = () => {
    if (items.length === 0) return;
    triggerBlobDownload(
      new Blob([historyToCsv(items)], { type: "text/csv;charset=utf-8" }),
      "qrcode-history.csv",
    );
  };

  const exportJson = () => {
    if (items.length === 0) return;
    triggerBlobDownload(
      new Blob([historyToJson(items)], { type: "application/json;charset=utf-8" }),
      "qrcode-history.json",
    );
  };

  return (
    <section className="card history-card">
      <div className="card-head">
        <h3>{t.history}</h3>
        {items.length > 0 && (
          <div className="row">
            <button className="btn ghost small" onClick={exportCsv}>
              {t.exportCsv}
            </button>
            <button className="btn ghost small" onClick={exportJson}>
              {t.exportJson}
            </button>
            <button className="btn ghost small" onClick={() => setOpen((v) => !v)}>
              {open ? "▾" : "▸"}
            </button>
            <button className="btn ghost danger small" onClick={handleClear}>
              {t.clearHistory}
            </button>
          </div>
        )}
      </div>
      {open && (
        <div className="history-list">
          {items.length === 0 ? (
            <div className="placeholder">{t.historyEmpty}</div>
          ) : (
            items.map((it) => (
              <div key={it.id} className="history-row">
                <span className={`badge ${it.kind === "gen" ? "ok" : "info"}`}>
                  {it.kind === "gen" ? t.historyGen : t.historyDec}
                </span>
                <span className="history-text" title={it.text}>
                  {it.text}
                </span>
                <button className="link" onClick={() => onRestore(it)}>
                  {t.restore}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
