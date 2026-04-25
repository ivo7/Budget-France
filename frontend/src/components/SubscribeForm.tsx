import { useEffect, useState } from "react";

type Tab = "particulier" | "entreprise";

interface FieldError {
  path: string;
  message: string;
}

interface SubmitState {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
  fieldErrors?: FieldError[];
}

export function SubscribeForm() {
  const [tab, setTab] = useState<Tab>("particulier");
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  // La popup s'ouvre dès que le statut bascule en "success" ou "error".
  const [modalOpen, setModalOpen] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload: Record<string, unknown> = {
      type: tab,
      email: fd.get("email"),
      firstName: fd.get("firstName") || undefined,
      lastName: fd.get("lastName") || undefined,
      prefMonthly: fd.get("prefMonthly") === "on",
      prefThreshold: fd.get("prefThreshold") === "on",
      consent: fd.get("consent") === "on",
    };

    if (tab === "entreprise") {
      payload.companyName = fd.get("companyName");
      payload.siret = fd.get("siret") || undefined;
      payload.role = fd.get("role") || undefined;
      payload.companySize = fd.get("companySize") || undefined;
    }

    setState({ status: "loading" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({
          status: "error",
          message: body?.error === "validation" ? "Vérifie les champs en rouge." : "Une erreur est survenue. Réessaie dans un instant.",
          fieldErrors: body?.issues,
        });
        setModalOpen(true);
        return;
      }
      setState({
        status: "success",
        message: body?.message ?? "Email de confirmation envoyé. Clique sur le lien dans ta boîte de réception pour finaliser ton inscription.",
      });
      setModalOpen(true);
      form.reset();
    } catch (err) {
      setState({ status: "error", message: (err as Error).message });
      setModalOpen(true);
    }
  }

  // Touche Echap pour fermer la popup
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const err = (path: string) => state.fieldErrors?.find((e) => e.path === path)?.message;

  return (
    <div className="card p-6 md:p-8" id="subscribe">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Alertes & bulletin</div>
          <h2 className="font-display text-2xl font-semibold mt-1 text-slate-900">
            Reçois les mouvements du budget dans ta boîte mail
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-lg">
            Reçois des notifications quand le site évolue (nouveaux indicateurs,
            mises à jour de données, articles pédagogiques).
            Désinscription en un clic.
          </p>
        </div>
      </div>

      <div className="mt-6 inline-flex rounded-full bg-slate-100 p-1 border border-slate-200">
        <TabButton active={tab === "particulier"} onClick={() => setTab("particulier")}>
          Particulier
        </TabButton>
        <TabButton active={tab === "entreprise"} onClick={() => setTab("entreprise")}>
          Entreprise
        </TabButton>
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Email *" error={err("email")}>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="input"
            placeholder={tab === "entreprise" ? "contact@entreprise.fr" : "prenom.nom@email.fr"}
          />
        </Field>

        {tab === "particulier" ? (
          <>
            <Field label="Prénom" error={err("firstName")}>
              <input name="firstName" type="text" autoComplete="given-name" className="input" />
            </Field>
            <Field label="Nom" error={err("lastName")} wide>
              <input name="lastName" type="text" autoComplete="family-name" className="input" />
            </Field>
          </>
        ) : (
          <>
            <Field label="Raison sociale *" error={err("companyName")}>
              <input name="companyName" type="text" required className="input" placeholder="Acme SAS" />
            </Field>
            <Field label="SIRET (14 chiffres)" error={err("siret")}>
              <input name="siret" type="text" inputMode="numeric" pattern="\d{14}" maxLength={14} className="input" placeholder="12345678901234" />
            </Field>
            <Field label="Votre poste" error={err("role")}>
              <input name="role" type="text" className="input" placeholder="DAF, CFO, analyste…" />
            </Field>
            <Field label="Taille de l'entreprise" error={err("companySize")}>
              <select name="companySize" className="input">
                <option value="">—</option>
                <option value="1">1 personne</option>
                <option value="2-10">2 à 10</option>
                <option value="11-50">11 à 50</option>
                <option value="51-250">51 à 250</option>
                <option value="251-1000">251 à 1 000</option>
                <option value="1000+">Plus de 1 000</option>
              </select>
            </Field>
            <Field label="Prénom" error={err("firstName")}>
              <input name="firstName" type="text" autoComplete="given-name" className="input" />
            </Field>
            <Field label="Nom" error={err("lastName")}>
              <input name="lastName" type="text" autoComplete="family-name" className="input" />
            </Field>
          </>
        )}

        <fieldset className="md:col-span-2 mt-2 space-y-2 text-sm">
          <legend className="text-xs uppercase tracking-widest text-muted mb-2">Notifications</legend>
          {/* On garde le nom de champ "prefThreshold" pour rester compatible
              avec le backend existant (Postgres + jobs cron). Côté UX,
              le sens est élargi : recevoir une notification quand le site
              évolue (nouveaux indicateurs, MAJ données, fiches…). */}
          <Checkbox name="prefThreshold" defaultChecked>
            Recevoir des notifications quand le site évolue (nouveaux indicateurs,
            mises à jour de données, fiches pédagogiques)
          </Checkbox>
        </fieldset>

        <fieldset className="md:col-span-2 text-sm">
          <Checkbox name="consent" required>
            J'accepte de recevoir ces emails et de voir mes données stockées conformément à la{" "}
            <a href="#privacy" className="underline hover:text-brand">politique de confidentialité</a>.
          </Checkbox>
          {err("consent") && <p className="text-flag-red text-xs mt-1">{err("consent")}</p>}
        </fieldset>

        <div className="md:col-span-2 flex items-center gap-4 mt-2 flex-wrap">
          <button
            type="submit"
            disabled={state.status === "loading"}
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-semibold rounded-xl px-5 py-3 transition-colors"
          >
            {state.status === "loading" ? "Envoi…" : `S'inscrire ${tab === "entreprise" ? "(entreprise)" : ""}`}
          </button>
        </div>
      </form>

      {/* Popup modale de confirmation/erreur */}
      {modalOpen && (state.status === "success" || state.status === "error") && (
        <ResultModal
          status={state.status}
          message={state.message}
          onClose={() => {
            setModalOpen(false);
            // On garde le statut "success" pour que l'utilisateur puisse rouvrir
            // la popup en cliquant sur la bannière s'il le souhaite. En cas
            // d'erreur on remet à zéro pour qu'il puisse réessayer.
            if (state.status === "error") setState({ status: "idle" });
          }}
        />
      )}

      <style>{`
        .input {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          border-radius: 10px;
          padding: 10px 12px;
          width: 100%;
          font-size: 14px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input:focus {
          outline: none;
          border-color: #0055A4;
          box-shadow: 0 0 0 3px rgba(0, 85, 164, 0.12);
        }
        .input::placeholder { color: #94a3b8; }
      `}</style>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-2 rounded-full text-sm font-medium transition ${
        active ? "bg-brand text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, error, wide, children }: { label: string; error?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${wide ? "md:col-span-2" : ""}`}>
      <span className="block text-xs uppercase tracking-widest text-muted mb-1">{label}</span>
      {children}
      {error && <span className="text-flag-red text-xs mt-1 block">{error}</span>}
    </label>
  );
}

function Checkbox({ name, defaultChecked, required, children }: { name: string; defaultChecked?: boolean; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-2 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        required={required}
        className="mt-0.5 w-4 h-4 accent-brand rounded"
      />
      <span className="text-slate-700 text-sm leading-relaxed">{children}</span>
    </label>
  );
}

// ----------------------------------------------------------------------------
// ResultModal — popup centrée affichée après une soumission du formulaire.
// Bloque le scroll en arrière-plan, fermable via Échap, clic sur l'overlay
// ou bouton OK.
// ----------------------------------------------------------------------------

function ResultModal({
  status,
  message,
  onClose,
}: {
  status: "success" | "error";
  message?: string;
  onClose: () => void;
}) {
  const isSuccess = status === "success";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscribe-result-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Overlay — clic = fermer */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Boîte */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 border border-slate-200">
        {/* Icône d'état */}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isSuccess ? "bg-green-50 text-money" : "bg-red-50 text-flag-red"
          }`}
        >
          {isSuccess ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
        </div>

        <h2
          id="subscribe-result-title"
          className={`font-display text-xl font-bold text-center ${
            isSuccess ? "text-money" : "text-flag-red"
          }`}
        >
          {isSuccess ? "Inscription enregistrée !" : "Une erreur est survenue"}
        </h2>

        <p className="text-sm text-slate-700 text-center mt-3 leading-relaxed">
          {message ??
            (isSuccess
              ? "Email de confirmation envoyé."
              : "Réessaie dans un instant.")}
        </p>

        {isSuccess && (
          <div className="mt-4 p-3 rounded-lg bg-brand-soft/30 border border-brand/20 text-xs text-slate-600 text-center">
            💡 Pense à vérifier le dossier <strong>spam</strong> si tu ne reçois rien dans la minute.
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          autoFocus
          className={`mt-6 w-full inline-flex items-center justify-center gap-2 font-semibold rounded-xl px-5 py-3 transition-colors ${
            isSuccess
              ? "bg-brand hover:bg-brand-dark text-white"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          OK
        </button>
      </div>
    </div>
  );
}
