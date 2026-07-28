import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "../lib/i18n";
import { dictionaries, format } from "../lib/i18n";
import { generateQR, generateStylizedQR } from "../lib/qr";
import type { DotStyle } from "../lib/qr";
import { generateQRSvg } from "../lib/svg";
import {
  downloadDataUrl,
  downloadQrZip,
  triggerBlobDownload,
} from "../lib/zip";
import { exportTextToXlsx, readCsvFirstColumn, readXlsx } from "../lib/excel";
import {
  CONTENT_TYPES,
  CONTENT_TYPE_MAP,
  emptyValues,
} from "../lib/payload";
import type { ContentType } from "../lib/payload";
import type { HistoryItem } from "../lib/history";

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
  onGenerated?: (text: string) => void;
  restore?: HistoryItem | null;
  restoreNonce?: number;
}

export function Generator({ lang, onGenerated, restore, restoreNonce }: Props) {
  const t = dictionaries[lang];

  // --- shared options ---
  const [size, setSize] = useState(256);
  const [ecLevel, setEcLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [margin, setMargin] = useState(2);
  const [fg, setFg] = useState("#000000");
  const [bg, setBg] = useState("#ffffff");

  // --- stylized ---
  const [dotStyle, setDotStyle] = useState<DotStyle>("square");
  const [eyeColor, setEyeColor] = useState("#000000");
  const [useEyeColor, setUseEyeColor] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoRatio, setLogoRatio] = useState(0.2);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const stylized =
    dotStyle !== "square" || useEyeColor || !!logoDataUrl;

  // --- single: content type template ---
  const [contentType, setContentType] = useState<ContentType>("text");
  const [formValues, setFormValues] = useState<Record<string, string>>(
    emptyValues("text"),
  );
  const [singleDataUrl, setSingleDataUrl] = useState<string | null>(null);
  const [singleError, setSingleError] = useState<string | null>(null);
  const [singlePayload, setSinglePayload] = useState<string>("");

  // --- batch ---
  const [rows, setRows] = useState<BatchRow[]>([emptyRow()]);
  const [batchBusy, setBatchBusy] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<"xlsx" | "txt">("xlsx");

  const typeDef = CONTENT_TYPE_MAP[contentType];

  const onTypeChange = (next: ContentType) => {
    setContentType(next);
    setFormValues(emptyValues(next));
    setSingleDataUrl(null);
    setSingleError(null);
    setSinglePayload("");
  };

  const onFieldChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  // Restore a generated item from history → switch to plain text with that content.
  useEffect(() => {
    if (!restore || restoreNonce === 0) return;
    if (restore.kind !== "gen") return;
    setContentType("text");
    setFormValues({ text: restore.text });
    setSingleDataUrl(null);
    setSingleError(null);
    setSinglePayload("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoreNonce]);

  const runSingle = useCallback(async () => {
    const payload = typeDef.build(formValues);
    if (!payload) {
      setSingleError(t.errEmpty);
      setSingleDataUrl(null);
      return;
    }
    setSingleError(null);
    try {
      const result = stylized
        ? await generateStylizedQR({
            text: payload,
            width: size,
            errorCorrectionLevel: ecLevel,
            margin,
            color: { dark: fg, light: bg },
            dotStyle,
            eyeColor: useEyeColor ? eyeColor : undefined,
            logoDataUrl: logoDataUrl ?? undefined,
            logoRatio,
          })
        : await generateQR({
            text: payload,
            width: size,
            errorCorrectionLevel: ecLevel,
            margin,
            color: { dark: fg, light: bg },
          });
      setSingleDataUrl(result.dataUrl);
      setSinglePayload(payload);
      onGenerated?.(payload);
    } catch (e) {
      setSingleError(e instanceof Error ? e.message : String(e));
      setSingleDataUrl(null);
    }
  }, [
    typeDef, formValues, stylized, size, ecLevel, margin, fg, bg,
    dotStyle, useEyeColor, eyeColor, logoDataUrl, logoRatio, t.errEmpty,
  ]);

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
    setRows((rs) =>
      rs.map((r) => ({
        ...r,
        status: "pending",
        error: undefined,
        dataUrl: undefined,
      })),
    );
    for (const r of targets) {
      try {
        const { dataUrl } = stylized
          ? await generateStylizedQR({
              text: r.text,
              width: size,
              errorCorrectionLevel: ecLevel,
              margin,
              color: { dark: fg, light: bg },
              dotStyle,
              eyeColor: useEyeColor ? eyeColor : undefined,
              logoDataUrl: logoDataUrl ?? undefined,
              logoRatio,
            })
          : await generateQR({
              text: r.text,
              width: size,
              errorCorrectionLevel: ecLevel,
              margin,
              color: { dark: fg, light: bg },
            });
        setRows((rs) =>
          rs.map((row) =>
            row.id === r.id
              ? { ...row, status: "ok", dataUrl, error: undefined }
              : row,
          ),
        );
      } catch (e) {
        setRows((rs) =>
          rs.map((row) =>
            row.id === r.id
              ? {
                  ...row,
                  status: "error",
                  error: e instanceof Error ? e.message : String(e),
                }
              : row,
          ),
        );
      }
    }
    setBatchBusy(false);
  }, [
    rows, stylized, size, ecLevel, margin, fg, bg,
    dotStyle, useEyeColor, eyeColor, logoDataUrl, logoRatio, t.errRows,
  ]);

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

  const onLogoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogoDataUrl(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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
    if (!singlePayload) return;
    try {
      const svg = await generateQRSvg({
        text: singlePayload,
        errorCorrectionLevel: ecLevel,
        margin,
        color: { dark: fg, light: bg },
      });
      triggerBlobDownload(
        new Blob([svg], { type: "image/svg+xml" }),
        "qrcode.svg",
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  // Ctrl/Cmd+Enter generates single
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        runSingle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [runSingle]);

  const isTemplate = contentType !== "text";

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
            onChange={(e) =>
              setSize(Math.max(64, Math.min(1024, +e.target.value || 256)))
            }
          />
        </label>
        <label className="opt">
          <span>{t.ecLevel}</span>
          <select
            value={ecLevel}
            onChange={(e) => setEcLevel(e.target.value as "L" | "M" | "Q" | "H")}
          >
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
            onChange={(e) =>
              setMargin(Math.max(0, Math.min(10, +e.target.value || 0)))
            }
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

      {/* stylized options */}
      <div className="opt-grid">
        <label className="opt">
          <span>{t.dotStyle}</span>
          <select
            value={dotStyle}
            onChange={(e) => setDotStyle(e.target.value as DotStyle)}
          >
            <option value="square">{t.dotSquare}</option>
            <option value="rounded">{t.dotRounded}</option>
            <option value="dot">{t.dotDot}</option>
          </select>
        </label>
        <label className="opt color">
          <span>{t.eyeColor}</span>
          <input
            type="color"
            value={eyeColor}
            onChange={(e) => setEyeColor(e.target.value)}
            disabled={!useEyeColor}
          />
          <label className="checkbox-inline">
            <input
              type="checkbox"
              checked={useEyeColor}
              onChange={(e) => setUseEyeColor(e.target.checked)}
            />
            <span className="muted small">{t.eyeColor}</span>
          </label>
        </label>
        <label className="opt">
          <span>{t.logoSize}</span>
          <input
            type="range"
            min={0.1}
            max={0.3}
            step={0.02}
            value={logoRatio}
            onChange={(e) => setLogoRatio(+e.target.value)}
            disabled={!logoDataUrl}
          />
        </label>
        <label className="opt">
          <span>{t.embedLogo}</span>
          <div className="row">
            <button
              className="btn ghost small"
              onClick={() => logoInputRef.current?.click()}
            >
              {t.uploadLogo}
            </button>
            {logoDataUrl && (
              <button
                className="btn ghost danger small"
                onClick={() => setLogoDataUrl(null)}
              >
                {t.removeLogo}
              </button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={onLogoPick}
              hidden
            />
          </div>
        </label>
        {logoDataUrl && (
          <div className="opt hint">
            <span className="muted small">{t.autoEcHint}</span>
          </div>
        )}
      </div>

      <section className="card">
        <h3>{t.singleGen}</h3>

        {/* content type selector */}
        <div className="row type-row">
          <label className="opt inline">
            <span>{t.contentType}</span>
            <select
              value={contentType}
              onChange={(e) => onTypeChange(e.target.value as ContentType)}
            >
              {CONTENT_TYPES.map((c) => (
                <option key={c.type} value={c.type}>
                  {c.label[lang]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* dynamic form per content type */}
        {isTemplate ? (
          <div className="form-grid">
            {typeDef.fields.map((f) => (
              <label key={f.key} className="form-field">
                <span>
                  {f.label[lang]}
                  {f.required ? <em className="req">*</em> : null}
                </span>
                {f.type === "textarea" ? (
                  <textarea
                    className="text-area small"
                    placeholder={f.placeholder?.[lang] ?? ""}
                    value={formValues[f.key] ?? ""}
                    onChange={(e) => onFieldChange(f.key, e.target.value)}
                    rows={2}
                  />
                ) : f.type === "select" && f.options ? (
                  <select
                    value={formValues[f.key] ?? f.options[0].value}
                    onChange={(e) => onFieldChange(f.key, e.target.value)}
                  >
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label[lang]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="cell-input"
                    type={f.type === "number" ? "number" : "text"}
                    placeholder={f.placeholder?.[lang] ?? ""}
                    value={formValues[f.key] ?? ""}
                    onChange={(e) => onFieldChange(f.key, e.target.value)}
                  />
                )}
              </label>
            ))}
          </div>
        ) : (
          <textarea
            className="text-area"
            placeholder={t.contentPlaceholder}
            value={formValues.text ?? ""}
            onChange={(e) => onFieldChange("text", e.target.value)}
            rows={3}
          />
        )}

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
              <button className="btn" onClick={downloadSingleSvg} disabled={stylized}>
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
              accept={importType === "xlsx" ? ".xlsx,.xls" : ".txt,.csv"}
              onChange={handleImport}
              hidden
            />
            <button className="btn ghost" onClick={addRow}>
              {t.addRow}
            </button>
            <button
              className="btn ghost danger"
              onClick={clearRows}
              disabled={batchBusy}
            >
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
                    {r.status === "ok" && (
                      <span className="badge ok">{t.statusDone}</span>
                    )}
                    {r.status === "error" && (
                      <span className="badge err" title={r.error}>
                        {t.statusError}
                      </span>
                    )}
                    {r.status === "pending" && <span className="muted">…</span>}
                  </td>
                  <td className="col-actions">
                    {r.dataUrl && (
                      <button
                        className="link"
                        onClick={() =>
                          downloadDataUrl(
                            r.dataUrl!,
                            `${sanitize(r.text) || "qr"}.png`,
                          )
                        }
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
            {generatedCount > 0
              ? format(t.batchGenerated, { n: generatedCount })
              : t.batchEmpty}
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
