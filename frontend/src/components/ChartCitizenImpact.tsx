// ============================================================================
// ChartCitizenImpact — encadré pédagogique « concrètement pour toi »
// ============================================================================
//
// Composant réutilisable à insérer SOUS chaque graphe du site. Met en avant
// les conséquences concrètes pour le citoyen, avec un lien optionnel vers
// la vidéo pédagogique YouTube/Insta correspondante.
//
// Usage :
//   <ChartCitizenImpact
//     text="Quand le ratio dette/PIB monte..."
//     videoUrl="https://youtu.be/xxxxx"
//   />
//
// Tant que les vidéos ne sont pas produites, on laisse videoUrl vide :
// le bloc affiche un placeholder neutre « Vidéo pédagogique à venir ».
// ============================================================================

interface Props {
  /** Texte explicatif court (1-3 phrases) sur les conséquences citoyennes. */
  text: React.ReactNode;
  /** URL de la vidéo YouTube/Insta (optionnel). */
  videoUrl?: string;
  /** Plateforme de la vidéo (pour l'icône). Auto-détecté depuis l'URL si non fourni. */
  platform?: "youtube" | "instagram" | "tiktok";
}

export function ChartCitizenImpact({ text, videoUrl, platform }: Props) {
  const detectedPlatform = platform ?? detectPlatform(videoUrl);

  return (
    <div className="mt-3 p-4 rounded-xl bg-brand-soft/40 border border-brand/15">
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0 leading-none mt-0.5" aria-hidden="true">
          👤
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-widest text-brand mb-1 font-semibold">
            Concrètement pour toi
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{text}</p>

          {videoUrl ? (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-brand hover:underline"
            >
              {detectedPlatform === "youtube" && <span aria-hidden="true">▶️</span>}
              {detectedPlatform === "instagram" && <span aria-hidden="true">📸</span>}
              {detectedPlatform === "tiktok" && <span aria-hidden="true">🎵</span>}
              {!detectedPlatform && <span aria-hidden="true">🎬</span>}
              Voir la vidéo explicative (1 min 30) →
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] text-slate-400 italic">
              🎬 Vidéo pédagogique à venir
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

ChartCitizenImpact.displayName = "ChartCitizenImpact";

function detectPlatform(url?: string): "youtube" | "instagram" | "tiktok" | null {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("tiktok.com")) return "tiktok";
  return null;
}
