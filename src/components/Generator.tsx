import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "../lib/i18n";
import { dictionaries, format } from "../lib/i18n";
import { generateQR } from "../lib/qr";
import { generateQRSvg } from "../lib/svg";
import {
  downloadDataUrl,
  downloadQrZip,
  triggerBlobDownload,
} from "../lib/zip";
import { exportTextToXlsx, readCsvFirstColumn, readXlsx } from "../lib/excel";

interface BatchRow {
  id: number;
  text: string;
  status: "pending" | "ok" | "error";
  dataUrl?: string;
  error?: string;
}

const nextId = (() => {
  let n = 0;
  return () => ++n;
})();

function emptyRow(text = ""): BatchRow {
  return { id: nextId(), text, status: "pending" };
}

interface Props {
  lang: Lang;
}

export function Generator({ lang }: Props) {
  const t = dictionaries[lang];

  // --- shared options ---
  const [size, setSize] = useState(256);
  const [ecLevel, setEcLevel] =
    useState<"L" | "M" | "Q" | "H">("M");
  const [margin, setMargin] = useState(2);
  const [fg, setFg] = useState("#000000");
  const [bg, setBg] = useState("#ffffff");

  // --- single ---
  const [singleText, setSingleText] = useState("");
  const [singleDataUrl, setSingleDataUrl] = useState<string | null>(null);
  const [singleError, setSingleError] = useState<string | null>(null);

  // --- batch ---
  const [rows, setRows] = useState<BatchRow[]>([emptyRow()]);
  const [batchBusy, setBatchBusy] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<"xlsx" | "txt">("xlsx");

  const runSingle = useCallback(async () => {
    if (!singleText.trim()) {
      setSingleError(t.errEmpty);
      setSingleDataUrl(null);
      return;
    }
    setSingleError(null);
    try {
      const { dataUrl } = await generateQR({
        text: singleText,
        width: size,
        errorCorrectionLevel: ecLevel,
        margin,
        color: { dark: fg, light: bg },
      });
      setSingleDataUrl(dataUrl);
    } catch (e) {
      setSingleError(e instanceof Error ? e.message : String(e));
      setSingleDataUrl(null);
    }
  }, [singleText, size, ecLevel, margin, fg, bg, t.errEmpty]);

  const updateRow = (id: number, text: string) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, text } : r)));

  const addRow = () => setRows((rs) => [...rs, emptyRow()]);

  const removeRow = (id: number) =>
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs));

  const clearRows = () => setRows([emptyRow()]);

  const runBatch = useCallback(async () => {
    const targets = rows.filter((r) => r.text.trim().length > 0);
    if (targets.length === 0) {
      setRows((rs) =>
        rs.map((r) => ({ ...r, status: "error", error: t.errRows })),
      );
      return;
    }
    setBatchBusy(true);
    // mark all pending first
    setRows((rs) => rs.map((r) => ({ ...r, status: "pending", error: undefined, dataUrl: undefined })));
    // generate sequentially (keeps UI responsive + avoids canvas churn)
    for (const r of targets) {
      try {
        const { dataUrl } = await generateQR({
          text: r.text,
          width: size,
          errorCorrectionLevel: ecLevel,
          margin,
          color: { dark: fg, light: bg },
        });
        setRows((rs) =>
          rs.map((row) =>
            row.id === r.id ? { ...row, status: "ok", dataUrl, error: undefined } : row,
          ),
        );
      } catch (e) {
        setRows((rs) =>
          rs.map((row) =>
            row.id === r.id
              ? { ...row, status: "error", error: e instanceof Error ? e.message : String(e) }
              : row,
          ),
        );
      }
    }
    setBatchBusy(false);
  }, [rows, size, ecLevel, margin, fg, bg, t.errRows]);

  const generatedCount = rows.filter((r) => r.status === "ok").length;

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      let texts: string[] = [];
      if (importType === "xlsx") {
        const records = await readXlsx(file);
        texts = records
          .map((rec) => {
            // prefer a Content/text-like column, else first value
            const key = Object.keys(rec).find((k) =>
              /content|text|value|qr|url|内容|文本/i.test(k),
            );
            const v = key ? rec[key] : Object.values(rec)[0];
            return v == null ? "" : String(v).trim();
          })
          .filter((v) => v.length > 0);
      } else if (/\.csv$/i.test(file.name)) {
        texts = await readCsvFirstColumn(file);
      } else {
        texts = (await file.text())
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
      }
      if (texts.length === 0) return;
      setRows(texts.map((text) => emptyRow(text)));
    } catch (err) {
      alert(t.errLoad + (err instanceof Error ? `: ${err.message}` : ""));
    } finally {
      e.target.value = "";
    }
  };

  const exportBatchXlsx = () => {
    const ok = rows.filter((r) => r.status === "ok");
    exportTextToXlsx(ok.map((r) => r.text), "qrcode-batch.xlsx");
  };

  const exportBatchZip = async () => {
    const ok = rows.filter((r) => r.status === "ok" && r.dataUrl);
    if (ok.length === 0) return;
    await downloadQrZip(
      ok.map((r, i) => ({
        name: sanitize(r.text) || `qr-${i + 1}`,
        dataUrl: r.dataUrl!,
      })),
      "qrcodes.zip",
    );
  };

  const downloadSingleSvg = async () => {
    if (!singleText.trim()) return;
    try {
      const svg = await generateQRSvg({
        text: singleText,
        errorCorrectionLevel: ecLevel,
        margin,
        color: { dark: fg, light: bg },
      });
      triggerBlobDownload(new Blob([svg], { type: "image/svg+xml" }), "qrcode.svg");
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  // keyboard: Ctrl/Cmd+Enter generates single
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        // only when single text area focused-ish; keep simple
        runSingle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [runSingle]);

  return (
    <div className="panel">
      <div className="panel-intro">
        <h2>{t.genSubtitle}</h2>
      </div>

      {/* shared options */}
      <div className="opt-grid">
        <label className="opt">
          <span>{t.size}</span>
          <input
            type="number"
            min={64}
            max={1024}
            step={16}
            value={size}
            onChange={(e) => setSize(Math.max(64, Math.min(1024, +e.target.value || 256)))}
          />
        </label>
        <label className="opt">
          <span>{t.ecLevel}</span>
          <select value={ecLevel} onChange={(e) => setEcLevel(e.target.value as "L" | "M" | "Q" | "H")}>
            <option value="L">L (7%)</option>
            <option value="M">M (15%)</option>
            <option value="Q">Q (25%)</option>
            <option value="H">H (30%)</option>
          </select>
        </label>
        <label className="opt">
          <span>{t.margin}</span>
          <input
            type="number"
            min={0}
            max={10}
            value={margin}
            onChange={(e) => setMargin(Math.max(0, Math.min(10, +e.target.value || 0)))}
          />
        </label>
        <label className="opt color">
          <span>{t.fgColor}</span>
          <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} />
        </label>
        <label className="opt color">
          <span>{t.bgColor}</span>
          <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
        </label>
      </div>

      <section className="card">
        <h3>{t.singleGen}</h3>
        <textarea
          className="text-area"
          placeholder={t.contentPlaceholder}
          value={singleText}
          onChange={(e) => setSingleText(e.target.value)}
          rows={3}
        />
        <div className="row">
          <button className="btn primary" onClick={runSingle}>
            {t.generate}
          </button>
          {singleDataUrl && (
            <>
              <button
                className="btn"
                onClick={() => downloadDataUrl(singleDataUrl, "qrcode.png")}
              >
                {t.downloadPng}
              </button>
              <button className="btn" onClick={downloadSingleSvg}>
                {t.downloadSvg}
              </button>
            </>
          )}
        </div>
        {singleError && <div className="error">{singleError}</div>}
        <div className="preview-area">
          {singleDataUrl ? (
            <img src={singleDataUrl} alt="QR" className="qr-preview" />
          ) : (
            <div className="placeholder">{t.genResultEmpty}</div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>{t.batchGen}</h3>
          <div className="row">
            <select
              className="import-select"
              value={importType}
              onChange={(e) => setImportType(e.target.value as "xlsx" | "txt")}
            >
              <option value="xlsx">XLSX</option>
              <option value="txt">TXT/CSV</option>
            </select>
            <button className="btn ghost" onClick={() => importRef.current?.click()}>
              {importType === "xlsx" ? t.importXlsx : t.importTxt}
            </button>
            <input
              ref={importRef}
              type="file"
              accept={
                importType === "xlsx"
                  ? ".xlsx,.xls"
                  : ".txt,.csv"
              }
              onChange={handleImport}
              hidden
            />
            <button className="btn ghost" onClick={addRow}>
              {t.addRow}
            </button>
            <button className="btn ghost danger" onClick={clearRows} disabled={batchBusy}>
              {t.clearAll}
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="col-idx">{t.index}</th>
                <th>{t.colContent}</th>
                <th className="col-img">{t.colImage}</th>
                <th className="col-status">{t.colStatus}</th>
                <th className="col-actions">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={r.status === "error" ? "row-error" : ""}>
                  <td className="col-idx">{i + 1}</td>
                  <td>
                    <input
                      className="cell-input"
                      value={r.text}
                      placeholder={t.contentPlaceholder}
                      onChange={(e) => updateRow(r.id, e.target.value)}
                      disabled={batchBusy}
                    />
                  </td>
                  <td className="col-img">
                    {r.dataUrl ? (
                      <img src={r.dataUrl} alt="QR" className="thumb" />
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="col-status">
                    {r.status === "ok" && <span className="badge ok">{t.statusDone}</span>}
                    {r.status === "error" && (
                      <span className="badge err" title={r.error}>{t.statusError}</span>
                    )}
                    {r.status === "pending" && <span className="muted">…</span>}
                  </td>
                  <td className="col-actions">
                    {r.dataUrl && (
                      <button
                        className="link"
                        onClick={() => downloadDataUrl(r.dataUrl!, `${sanitize(r.text) || "qr"}.png`)}
                      >
                        {t.download}
                      </button>
                    )}
                    <button
                      className="link danger"
                      onClick={() => removeRow(r.id)}
                      disabled={batchBusy}
                    >
                      {t.remove}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="row spaced">
          <button className="btn primary" onClick={runBatch} disabled={batchBusy}>
            {batchBusy ? "…" : t.generate}
          </button>
          <span className="muted">
            {generatedCount > 0 ? format(t.batchGenerated, { n: generatedCount }) : t.batchEmpty}
          </span>
          <div className="spacer" />
          <button
            className="btn ghost"
            onClick={exportBatchXlsx}
            disabled={generatedCount === 0}
            title={t.exportZipTip}
          >
            {t.exportXlsx}
          </button>
          <button
            className="btn ghost"
            onClick={exportBatchZip}
            disabled={generatedCount === 0}
          >
            {t.exportZip}
          </button>
        </div>
      </section>
    </div>
  );
}

function sanitize(text: string): string {
  return text
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 40);
}
