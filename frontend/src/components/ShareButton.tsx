import { useEffect, useRef, useState } from "react";

interface Props {
  /** Titre du graphique (sujet du mail, texte partagé). */
  title?: string;
  /** URL à partager. Par défaut : URL courante du navigateur. */
  url?: string;
  /**
   * Optionnel : capture le graphique en Blob PNG pour l'envoyer en
   * pièce jointe (via navigator.share) ou le télécharger avant de
   * composer le message (gmail, email, etc.).
   * Si absent, seule l'URL sera partagée.
   */
  getImageBlob?: () => Promise<Blob | null>;
  /** Nom de fichier suggéré pour l'image partagée / téléchargée. */
  filename?: string;
}

/**
 * Bouton de partage — menu vers email / Gmail / WhatsApp / Twitter / LinkedIn
 * / copier le lien. Quand `getImageBlob` est fourni :
 *   - l'option "Partager l'image" utilise navigator.share({ files }) pour
 *     envoyer le PNG en pièce jointe (mobile natif : WhatsApp, Messages, etc.).
 *   - les options spécifiques (Gmail, Email) proposent de télécharger
 *     l'image localement + d'ouvrir le composeur pour y joindre l'image
 *     manuellement (limitation des URIs mailto qui ne supportent pas
 *     les pièces jointes pour raisons de sécurité).
 */
export function ShareButton({ title = "Budget France", url, getImageBlob, filename = "budget-france" }: Props) {
  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const textBody = `${title}\n\n${shareUrl}`;
  const encodedBody = encodeURIComponent(textBody);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copie le lien ci-dessous :", shareUrl);
    }
    setOpen(false);
  }

  function openIn(u: string) {
    window.open(u, "_blank", "noopener,noreferrer,width=600,height=500");
    setOpen(false);
  }

  /** Partage le PNG en pièce jointe via l'API native du mobile/desktop. */
  async function shareAsImage() {
    if (!getImageBlob) return;
    setBusy(true);
    try {
      const blob = await getImageBlob();
      if (!blob) throw new Error("Capture PNG impossible");

      const file = new File([blob], `${filename}.png`, { type: "image/png" });

      // Essai 1 : API native avec fichier (iOS / Android / Chrome desktop récent)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title, text: title });
        setOpen(false);
        return;
      }

      // Essai 2 : fallback — téléchargement de l'image + copie du texte
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${filename}.png`;
      a.click();
      URL.revokeObjectURL(href);
      try {
        await navigator.clipboard.writeText(textBody);
      } catch {
        /* optionnel */
      }
      alert("Image téléchargée. Le titre a été copié dans le presse-papier — colle-le où tu veux puis attache l'image.");
      setOpen(false);
    } catch (e) {
      console.error("[ShareButton] shareAsImage failed:", e);
      alert("Partage de l'image indisponible. Utilise le téléchargement PNG puis ton outil de messagerie.");
    } finally {
      setBusy(false);
    }
  }

  const hasShareApi = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div ref={rootRef} className="relative" data-html2canvas-ignore>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        aria-label="Partager"
        title="Partager le graphique"
        className={`inline-flex items-center justify-center w-7 h-7 rounded-md border transition disabled:opacity-50 ${
          copied
            ? "bg-green-50 border-green-200 text-money"
            : "bg-white/95 hover:bg-white border-slate-200 text-slate-500 hover:text-brand hover:border-brand/40"
        }`}
      >
        {copied ? <CheckIcon /> : <ShareIcon />}
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-1.5 bg-white border border-slate-200 rounded-md shadow-lg min-w-[190px] overflow-hidden text-[11px]">
          {getImageBlob && (
            <MenuItem onClick={shareAsImage} highlight>
              <ImageIcon /> {hasShareApi ? "Partager l'image…" : "Télécharger l'image"}
            </MenuItem>
          )}
          <MenuItem onClick={() => openIn(`mailto:?subject=${encodedTitle}&body=${encodedBody}`)}>
            <MailIcon /> Email
          </MenuItem>
          <MenuItem onClick={() => openIn(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodedTitle}&body=${encodedBody}`)}>
            <GmailIcon /> Gmail
          </MenuItem>
          <MenuItem onClick={() => openIn(`https://wa.me/?text=${encodedBody}`)}>
            <WhatsAppIcon /> WhatsApp
          </MenuItem>
          <MenuItem onClick={() => openIn(`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`)}>
            <XIcon /> X (Twitter)
          </MenuItem>
          <MenuItem onClick={() => openIn(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`)}>
            <LinkedInIcon /> LinkedIn
          </MenuItem>
          <MenuItem onClick={copyLink}>
            <LinkIcon /> Copier le lien
          </MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({ onClick, children, highlight }: { onClick: () => void; children: React.ReactNode; highlight?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-2.5 py-1.5 transition flex items-center gap-2 border-b border-slate-100 last:border-b-0 ${
        highlight ? "bg-brand-soft/40 text-brand font-medium hover:bg-brand-soft" : "text-slate-700 hover:bg-brand-soft hover:text-brand"
      }`}
    >
      {children}
    </button>
  );
}

// --- Icônes (SVG inline) ---

function ShareIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
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
function ImageIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function GmailIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#EA4335">
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.454 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
    </svg>
  );
}
function WhatsAppIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
