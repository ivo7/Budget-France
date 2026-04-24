import { useRef, useState } from "react";
import { ShareButton } from "./ShareButton";
import { captureToPng, captureToJpeg, captureToBlob } from "../lib/chartCapture";
import { toCsv, downloadCsv, type CsvData } from "../lib/csvExport";

interface Props {
  filename: string;
  children: React.ReactNode;
  className?: string;
  /** Titre utilisé pour le partage (email, WhatsApp, etc.). */
  shareTitle?: string;
  /** Callback optionnel : retourne les données tabulaires pour l'export CSV.
   *  Si fourni, le bouton "CSV" apparaît dans le menu de téléchargement. */
  getCsvData?: () => CsvData;
}

/**
 * Wrapper qui ajoute deux boutons flottants en bas à droite du chart :
 *   - Partage (image en fichier via navigator.share ou fallback téléchargement)
 *   - Téléchargement (PNG / JPEG)
 *
 * Les deux boutons partagent le même mécanisme de capture via chartCapture.ts.
 */
export function DownloadableCard({ filename, children, className = "", shareTitle, getCsvData }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [open, setOpen] = useState(false);

  async function download(format: "png" | "jpeg") {
    if (!ref.current) return;
    setState("busy");
    setOpen(false);
    try {
      const dataUrl =
        format === "png" ? await captureToPng(ref.current) : await captureToJpeg(ref.current);
      const a = document.createElement("a");
      a.download = `${filename}.${format}`;
      a.href = dataUrl;
      a.click();
      setState("done");
      setTimeout(() => setState("idle"), 1600);
    } catch (e) {
      console.error("[DownloadableCard] download failed:", e);
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  async function getImageBlob(): Promise<Blob | null> {
    if (!ref.current) return null;
    return captureToBlob(ref.current);
  }

  function exportCsv() {
    if (!getCsvData) return;
    setOpen(false);
    try {
      const data = getCsvData();
      downloadCsv(`${filename}.csv`, toCsv(data));
      setState("done");
      setTimeout(() => setState("idle"), 1600);
    } catch (e) {
      console.error("[DownloadableCard] CSV export failed:", e);
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {children}

      <div
        className="absolute bottom-3 right-3 z-[3] flex items-center gap-1.5"
        data-html2canvas-ignore
      >
        <ShareButton
          title={shareTitle ?? `Budget France — ${filename}`}
          filename={filename}
          getImageBlob={getImageBlob}
        />
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            disabled={state === "busy"}
            aria-label="Télécharger le graphique"
            title={
              state === "error"
                ? "Erreur : réessaie dans un instant"
                : "Télécharger le graphique"
            }
            className={`inline-flex items-center justify-center w-7 h-7 rounded-md border transition ${
              state === "error"
                ? "bg-red-50 border-red-200 text-flag-red"
                : state === "done"
                  ? "bg-green-50 border-green-200 text-money"
                  : "bg-white/95 hover:bg-white border-slate-200 text-slate-500 hover:text-brand hover:border-brand/40"
            } disabled:opacity-50`}
          >
            {state === "busy" ? <Spinner /> : state === "done" ? <CheckIcon /> : state === "error" ? <AlertIcon /> : <DownloadIcon />}
          </button>

          {open && (
            <div className="absolute bottom-full right-0 mb-1.5 bg-white border border-slate-200 rounded-md shadow-lg min-w-[140px] overflow-hidden">
              <button
                type="button"
                onClick={() => download("png")}
                className="w-full text-left px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-brand-soft hover:text-brand transition"
              >
                <strong>PNG</strong> (image)
              </button>
              <button
                type="button"
                onClick={() => download("jpeg")}
                className="w-full text-left px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-brand-soft hover:text-brand transition border-t border-slate-100"
              >
                <strong>JPEG</strong> (image)
              </button>
              {getCsvData && (
                <button
                  type="button"
                  onClick={exportCsv}
                  className="w-full text-left px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-brand-soft hover:text-brand transition border-t border-slate-100"
                >
                  <strong>CSV</strong> (données brutes)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
function Spinner() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="16" strokeLinecap="round" />
    </svg>
  );
}
