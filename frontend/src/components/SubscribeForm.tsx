import { useState } from "react";

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
        return;
      }
      setState({
        status: "success",
        message: body?.message ?? "Email de confirmation envoyé.",
      });
      form.reset();
    } catch (err) {
      setState({ status: "error", message: (err as Error).message });
    }
  }

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
          {state.status === "success" && (
            <span className="text-money text-sm font-medium">{state.message}</span>
          )}
          {state.status === "error" && (
            <span className="text-flag-red text-sm font-medium">{state.message}</span>
          )}
        </div>
      </form>

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
