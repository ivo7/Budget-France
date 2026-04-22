// Utilitaire partagé : capture un élément du DOM en PNG (canvas → blob).
// Utilisé par DownloadableCard pour l'export et par ShareButton pour l'envoi
// de l'image en pièce jointe via navigator.share.

import { toPng, toJpeg, toBlob } from "html-to-image";

type Options = {
  pixelRatio?: number;
  backgroundColor?: string;
};

const defaultOptions: Options = {
  pixelRatio: 2,
  backgroundColor: "#ffffff",
};

const exclude = (node: HTMLElement) => {
  if (!node.dataset) return true;
  if (node.dataset["html2canvasIgnore"] !== undefined) return false;
  if (node.classList?.contains?.("watermark-layer")) return false;
  return true;
};

async function waitFonts(): Promise<void> {
  try {
    await document.fonts.ready;
  } catch {
    /* non-fatal */
  }
}

/** Capture un élément en PNG (data URL). */
export async function captureToPng(el: HTMLElement, opts: Options = {}): Promise<string> {
  await waitFonts();
  const o = { ...defaultOptions, ...opts };
  const common = { ...o, cacheBust: true, filter: exclude, skipAutoScale: true };
  try {
    return await toPng(el, common);
  } catch {
    // Fallback sans polices (plus robuste)
    return await toPng(el, { ...common, skipFonts: true } as typeof common & { skipFonts: boolean });
  }
}

/** Capture un élément en JPEG (data URL). */
export async function captureToJpeg(el: HTMLElement, opts: Options = {}): Promise<string> {
  await waitFonts();
  const o = { ...defaultOptions, ...opts };
  const common = { ...o, cacheBust: true, filter: exclude, skipAutoScale: true, quality: 0.95 };
  try {
    return await toJpeg(el, common);
  } catch {
    return await toJpeg(el, { ...common, skipFonts: true } as typeof common & { skipFonts: boolean });
  }
}

/** Capture un élément en Blob PNG — utile pour navigator.share({ files }). */
export async function captureToBlob(el: HTMLElement, opts: Options = {}): Promise<Blob | null> {
  await waitFonts();
  const o = { ...defaultOptions, ...opts };
  const common = { ...o, cacheBust: true, filter: exclude, skipAutoScale: true };
  try {
    return await toBlob(el, common);
  } catch {
    try {
      return await toBlob(el, { ...common, skipFonts: true } as typeof common & { skipFonts: boolean });
    } catch {
      return null;
    }
  }
}
