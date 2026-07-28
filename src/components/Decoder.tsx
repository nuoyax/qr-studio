import { useCallback, useEffect, useRef, useState } from "react";
import { dictionaries } from "../lib/i18n";
import type { Lang } from "../lib/i18n";
import { decodeFromFile } from "../lib/decode";
import { writeXlsx } from "../lib/excel";
import { triggerBlobDownload } from "../lib/zip";
import { useCameraScanner } from "../lib/camera";
import type { HistoryItem } from "../lib/history";

interface DecodedRow {
  id: number;
  fileName: string;
  ok: boolean;
  value: string;
  thumbUrl: string;
}

const nextId = (() => {
  let n = 0;
  return () => ++n;
})();

interface Props {
  lang: Lang;
  onDecoded?: (text: string) => void;
  restore?: HistoryItem | null;
  restoreNonce?: number;
}

export function Decoder({ lang, onDecoded, restore, restoreNonce }: Props) {
  const t = dictionaries[lang];

  // --- single ---
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [singleThumb, setSingleThumb] = useState<string | null>(null);
  const [singleResult, setSingleResult] = useState<string | null>(null);
  const [singleError, setSingleError] = useState<string | null>(null);
  const [singleBusy, setSingleBusy] = useState(false);
  const singleInputRef = useRef<HTMLInputElement>(null);

  // --- batch ---
  const [rows, setRows] = useState<DecodedRow[]>([]);
  const [dragging, setDragging] = useState(false);
  const batchInputRef = useRef<HTMLInputElement>(null);

  const decodeOne = useCallback(async (file: File) => {
    const thumbUrl = URL.createObjectURL(file);
    try {
      const value = await decodeFromFile(file);
      if (value) onDecoded?.(value);
      return {
        id: nextId(),
        fileName: file.name,
        ok: value !== null,
        value: value ?? t.noQrFound,
        thumbUrl,
      } as DecodedRow;
    } catch (e) {
      return {
        id: nextId(),
        fileName: file.name,
        ok: false,
        value: e instanceof Error ? e.message : String(e),
        thumbUrl,
      } as DecodedRow;
    }
  }, [t.noQrFound, onDecoded]);

  const runSingle = useCallback(
    async (file: File) => {
      setSingleBusy(true);
      setSingleError(null);
      setSingleResult(null);
      setSingleFile(file);
      setSingleThumb(URL.createObjectURL(file));
      try {
        const value = await decodeFromFile(file);
        if (value === null) {
          setSingleError(t.noQrFound);
        } else {
          setSingleResult(value);
          onDecoded?.(value);
        }
      } catch (e) {
        setSingleError(e instanceof Error ? e.message : String(e));
      } finally {
        setSingleBusy(false);
      }
    },
    [t.noQrFound, onDecoded],
  );

  const handleSinglePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) runSingle(file);
    e.target.value = "";
  };

  const handleBatchPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) {
      const results = await Promise.all(files.map((f) => decodeOne(f)));
      setRows((prev) => [...prev, ...results]);
    }
    e.target.value = "";
  };

  // --- paste from clipboard (works anywhere on the tab) ---
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const images: File[] = [];
      for (const it of Array.from(items)) {
        if (it.kind === "file" && it.type.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) images.push(f);
        }
      }
      if (images.length === 0) return;
      e.preventDefault();
      if (images.length === 1) {
        runSingle(images[0]);
      } else {
        Promise.all(images.map((f) => decodeOne(f))).then((results) =>
          setRows((prev) => [...prev, ...results]),
        );
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [runSingle, decodeOne]);

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (!files.length) return;
    const results = await Promise.all(files.map((f) => decodeOne(f)));
    setRows((prev) => [...prev, ...results]);
  };

  const removeRow = (id: number) => {
    setRows((rs) => {
      const target = rs.find((r) => r.id === id);
      if (target) URL.revokeObjectURL(target.thumbUrl);
      return rs.filter((r) => r.id !== id);
    });
  };

  const clearBatch = () => {
    rows.forEach((r) => URL.revokeObjectURL(r.thumbUrl));
    setRows([]);
  };

  const copyValue = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const downloadSingleTxt = () => {
    if (!singleResult) return;
    triggerBlobDownload(
      new Blob([singleResult], { type: "text/plain;charset=utf-8" }),
      "decoded.txt",
    );
  };

  const exportBatchXlsx = () => {
    if (rows.length === 0) return;
    writeXlsx(
      rows.map((r, i) => ({
        "#": i + 1,
        File: r.fileName,
        Decoded: r.value,
        Status: r.ok ? "OK" : "Failed",
      })),
      "decoded-results.xlsx",
    );
  };

  // cleanup single thumb on change
  useEffect(() => {
    return () => {
      if (singleThumb) URL.revokeObjectURL(singleThumb);
    };
  }, [singleThumb]);

  // --- camera scanner: feed decoded text into the single result ---
  const onCameraDecode = useCallback((text: string) => {
    setSingleResult(text);
    setSingleError(null);
    setSingleFile(null);
    setSingleThumb(null);
    onDecoded?.(text);
  }, [onDecoded]);
  const cam = useCameraScanner(onCameraDecode);

  // Restore a decoded item from history → populate single result.
  useEffect(() => {
    if (!restore || restoreNonce === 0) return;
    if (restore.kind !== "dec") return;
    setSingleResult(restore.text);
    setSingleError(null);
    setSingleFile(null);
    setSingleThumb(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoreNonce]);

  const camErrorText = (() => {
    if (!cam.state.error) return null;
    if (cam.state.error === "unsupported") return t.cameraUnsupported;
    if (cam.state.error === "denied" || cam.state.error === "notfound")
      return t.cameraDenied;
    return cam.state.error;
  })();

  return (
    <div className="panel">
      <div className="panel-intro">
        <h2>{t.decSubtitle}</h2>
        <p className="muted">{t.pasteHint}</p>
      </div>

      <section className="card">
        <h3>{t.singleDec}</h3>
        <div className="row">
          <button className="btn primary" onClick={() => singleInputRef.current?.click()}>
            {t.pickImage}
          </button>
          <input
            ref={singleInputRef}
            type="file"
            accept="image/*"
            onChange={handleSinglePick}
            hidden
          />
          <span className="muted">{t.orPaste}</span>
        </div>

        <div className="preview-area dual">
          <div className="preview-slot">
            {singleThumb ? (
              <img src={singleThumb} alt="source" className="src-preview" />
            ) : (
              <div className="placeholder">—</div>
            )}
          </div>
          <div className="preview-slot">
            {singleBusy ? (
              <div className="placeholder">…</div>
            ) : singleResult ? (
              <div className="decoded-box">
                <div className="decoded-label">{t.decodedValue}</div>
                <div className="decoded-text">{singleResult}</div>
                <div className="row">
                  <button className="btn ghost" onClick={() => copyValue(singleResult)}>
                    {t.copy}
                  </button>
                  <button className="btn ghost" onClick={downloadSingleTxt}>
                    {t.download}
                  </button>
                </div>
              </div>
            ) : singleError ? (
              <div className="error">{singleError}</div>
            ) : (
              <div className="placeholder">{t.noQrFound}</div>
            )}
          </div>
        </div>
        {singleFile && (
          <div className="muted small">{t.fileName}: {singleFile.name}</div>
        )}
      </section>

      <section className="card">
        <h3>{t.cameraScan}</h3>
        <div className="row">
          {!cam.state.active ? (
            <button className="btn primary" onClick={() => cam.start()}>
              {t.startCamera}
            </button>
          ) : (
            <button className="btn danger" onClick={cam.stop}>
              {t.stopCamera}
            </button>
          )}
          {cam.state.active && cam.state.devices.length > 1 && (
            <button className="btn ghost" onClick={cam.switchCamera}>
              {t.switchCamera}
            </button>
          )}
        </div>
        {camErrorText && <div className="error">{camErrorText}</div>}
        <div className="camera-area">
          <video
            ref={cam.videoRef}
            className={`camera-video ${cam.state.active ? "" : "hidden"}`}
            playsInline
            muted
          />
          {!cam.state.active && (
            <div className="placeholder">
              {camErrorText ?? t.scanning}
            </div>
          )}
          {cam.state.active && <div className="muted small scan-hint">{t.scanning}</div>}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>{t.batchDec}</h3>
          {rows.length > 0 && (
            <div className="row">
              <button className="btn ghost" onClick={exportBatchXlsx}>
                {t.exportXlsx}
              </button>
              <button className="btn ghost danger" onClick={clearBatch}>
                {t.clearAll}
              </button>
            </div>
          )}
        </div>

        <div
          className={`dropzone ${dragging ? "active" : ""}`}
          onClick={() => batchInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {dragging ? t.dragDropActive : t.dragDrop}
          <input
            ref={batchInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleBatchPick}
            hidden
          />
        </div>

        {rows.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="col-idx">{t.index}</th>
                  <th className="col-img">{t.preview}</th>
                  <th>{t.fileName}</th>
                  <th>{t.colDecoded}</th>
                  <th className="col-status">{t.status}</th>
                  <th className="col-actions">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className={r.ok ? "" : "row-error"}>
                    <td className="col-idx">{i + 1}</td>
                    <td className="col-img">
                      <img src={r.thumbUrl} alt="src" className="thumb" />
                    </td>
                    <td className="cell-fname" title={r.fileName}>{r.fileName}</td>
                    <td className="cell-decoded">
                      {r.ok ? (
                        <span className="decoded-inline">{r.value}</span>
                      ) : (
                        <span className="muted">{r.value}</span>
                      )}
                    </td>
                    <td className="col-status">
                      {r.ok ? (
                        <span className="badge ok">{t.statusDone}</span>
                      ) : (
                        <span className="badge err">{t.statusError}</span>
                      )}
                    </td>
                    <td className="col-actions">
                      {r.ok && (
                        <>
                          <button className="link" onClick={() => copyValue(r.value)}>
                            {t.copy}
                          </button>
                          <button className="link danger" onClick={() => removeRow(r.id)}>
                            {t.remove}
                          </button>
                        </>
                      )}
                      {!r.ok && (
                        <button className="link danger" onClick={() => removeRow(r.id)}>
                          {t.remove}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
