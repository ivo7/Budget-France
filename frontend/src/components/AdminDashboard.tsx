// ============================================================================
// AdminDashboard — back-office accessible via /#/admin
// ============================================================================
//
// Auth :
//   - Page de login si pas de token en localStorage (clé "bf_admin_token")
//   - Token Bearer envoyé sur toutes les requêtes API
//   - Logout supprime le token côté client + appelle /api/admin/logout
//
// Onglets :
//   - Stats        : KPIs + évolution sur 30 jours
//   - Inscrits     : tableau filtrable + export CSV
//   - Sources      : statut des sources de données
//   - Emails       : logs d'envoi
//
// ============================================================================

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { downloadCsv, objectsToCsv, toCsv } from "../lib/csvExport";

const TOKEN_KEY = "bf_admin_token";
const TOKEN_EXP_KEY = "bf_admin_token_exp";

type Tab = "stats" | "subscribers" | "analytics" | "sources" | "emails";

interface Subscriber {
  id: string;
  email: string;
  type: "particulier" | "entreprise";
  plan: "free" | "premium";
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  siret: string | null;
  role: string | null;
  companySize: string | null;
  createdAt: string;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  prefMonthly: boolean;
  prefWeekly: boolean;
  prefThreshold: boolean;
  lastNotifiedAt: string | null;
}

interface Stats {
  total: number;
  confirmed: number;
  pending: number;
  unsubscribed: number;
  particuliers: number;
  entreprises: number;
  confirmationRate: number;
  evolution: {
    date: string;
    signups: number;
    confirmed: number;
    unsubscribed: number;
  }[];
  recentList: {
    email: string;
    type: string;
    createdAt: string;
    confirmedAt: string | null;
  }[];
}

interface SourcesPayload {
  generatedAt: string | null;
  snapshotPath: string;
  counts: { total: number; live: number; fallback: number; error: number };
  sources: {
    id: string;
    label: string;
    status?: string;
    url?: string;
    fallback?: boolean;
  }[];
  error?: string;
}

interface CheckSourcesPayload {
  generatedAt: string | null;
  counts: { total: number; ok: number; ko: number; noUrl: number };
  results: {
    id: string;
    label: string;
    url: string | null;
    ok: boolean;
    httpStatus: number | null;
    error: string | null;
    durationMs: number;
  }[];
}

interface EmailLog {
  id: string;
  type: "confirm" | "monthly" | "weekly" | "threshold";
  sentAt: string;
  success: boolean;
  error: string | null;
  subscriber: { email: string; type: string };
}

interface EmailLogsPayload {
  totals: { success: number; failure: number };
  logs: EmailLog[];
}

// ----------------------------------------------------------------------------

function getToken(): string | null {
  const tok = localStorage.getItem(TOKEN_KEY);
  const exp = Number(localStorage.getItem(TOKEN_EXP_KEY) || 0);
  if (!tok || !exp || exp < Date.now()) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXP_KEY);
    return null;
  }
  return tok;
}

function setToken(token: string, expiresAt: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXP_KEY, String(new Date(expiresAt).getTime()));
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXP_KEY);
}

async function adminFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("not_authenticated");
  const res = await fetch(path, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (res.status === 401) {
    clearToken();
    throw new Error("unauthorized");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ============================================================================

export function AdminDashboard() {
  const [authed, setAuthed] = useState<boolean>(() => Boolean(getToken()));

  // Au reload, on revérifie que le token est encore valide côté serveur
  useEffect(() => {
    if (!authed) return;
    adminFetch<{ authenticated: boolean }>("/api/admin/me").catch(() => {
      setAuthed(false);
    });
  }, [authed]);

  if (!authed) {
    return <LoginScreen onLoggedIn={() => setAuthed(true)} />;
  }
  return <DashboardScreen onLogout={() => setAuthed(false)} />;
}

// ============================================================================
// LoginScreen
// ============================================================================

function LoginScreen({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 503) setError("Dashboard désactivé : ADMIN_PASSWORD non défini côté serveur.");
        else if (res.status === 401) setError("Mot de passe incorrect.");
        else if (res.status === 429) setError("Trop de tentatives. Attends une minute.");
        else setError(body?.error ?? "Erreur de connexion");
        return;
      }
      setToken(body.token, body.expiresAt);
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10 max-w-md mx-auto">
      <div className="card p-6 md:p-8">
        <div className="text-xs uppercase tracking-widest text-muted">Back-office</div>
        <h1 className="font-display text-2xl font-bold text-slate-900 mt-1">
          Connexion administrateur
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Cet espace est réservé à l'équipe Budget France. Mot de passe défini
          dans la variable d'environnement <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">ADMIN_PASSWORD</code>.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="block text-xs uppercase tracking-widest text-muted mb-1">
              Mot de passe
            </span>
            <input
              type="password"
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 font-mono focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>
          {error && (
            <div className="text-flag-red text-sm font-medium">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-semibold rounded-xl px-5 py-3 transition-colors"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </section>
  );
}

// ============================================================================
// DashboardScreen
// ============================================================================

function DashboardScreen({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("stats");

  async function logout() {
    try {
      await adminFetch("/api/admin/logout", { method: "POST" });
    } catch {
      // ignore
    }
    clearToken();
    onLogout();
  }

  return (
    <>
      <section className="mt-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Back-office Budget France</div>
          <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">
            Dashboard administrateur
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Gestion des inscrits, suivi des sources de données et des emails envoyés.
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-flag-red hover:text-flag-red text-slate-700 font-medium rounded-lg px-4 py-2 transition-colors text-sm"
        >
          Se déconnecter
        </button>
      </section>

      <section className="mt-6">
        <div className="inline-flex rounded-full bg-slate-100 p-1 border border-slate-200 flex-wrap">
          <TabBtn active={tab === "stats"} onClick={() => setTab("stats")}>📊 Stats</TabBtn>
          <TabBtn active={tab === "subscribers"} onClick={() => setTab("subscribers")}>👥 Inscrits</TabBtn>
          <TabBtn active={tab === "analytics"} onClick={() => setTab("analytics")}>📈 Analytics</TabBtn>
          <TabBtn active={tab === "sources"} onClick={() => setTab("sources")}>🗂️ Sources</TabBtn>
          <TabBtn active={tab === "emails"} onClick={() => setTab("emails")}>✉️ Emails</TabBtn>
        </div>
      </section>

      <section className="mt-4">
        {tab === "stats" && <StatsTab />}
        {tab === "subscribers" && <SubscribersTab />}
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "sources" && <SourcesTab />}
        {tab === "emails" && <EmailsTab />}
      </section>
    </>
  );
}

function TabBtn({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
        active ? "bg-brand text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

// ============================================================================
// StatsTab
// ============================================================================

function StatsTab() {
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<Stats>("/api/admin/stats").then(setData).catch((e) => setError(String(e.message ?? e)));
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!data) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total inscrits" value={data.total} color="text-slate-900" />
        <StatCard label="Confirmés actifs" value={data.confirmed} color="text-money" sub={`${data.confirmationRate} % confirmation`} />
        <StatCard label="En attente" value={data.pending} color="text-amber-600" sub="non confirmés" />
        <StatCard label="Désinscrits" value={data.unsubscribed} color="text-flag-red" />
        <StatCard label="Particuliers" value={data.particuliers} color="text-brand" />
        <StatCard label="Entreprises" value={data.entreprises} color="text-purple-600" />
      </div>

      <div className="card p-5 md:p-6">
        <h3 className="font-display text-lg font-semibold text-slate-900 mb-3">
          Évolution sur 30 jours
        </h3>
        {data.evolution.length === 0 ? (
          <p className="text-sm text-slate-500">Pas encore d'inscriptions.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.evolution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={20} tickFormatter={(d) => String(d).slice(5)} />
                <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 12 }} labelFormatter={(d) => `Jour ${d}`} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="square" />
                <Bar dataKey="signups" name="Inscriptions" fill="#0055A4" radius={[3, 3, 0, 0]} />
                <Bar dataKey="confirmed" name="Confirmés" fill="#16a34a" radius={[3, 3, 0, 0]} />
                <Bar dataKey="unsubscribed" name="Désinscrits" fill="#EF4135" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card p-5 md:p-6">
        <h3 className="font-display text-lg font-semibold text-slate-900 mb-3">
          5 dernières inscriptions
        </h3>
        {data.recentList.length === 0 ? (
          <p className="text-sm text-slate-500">Pas encore d'inscrits.</p>
        ) : (
          <ul className="text-sm space-y-2">
            {data.recentList.map((s, i) => (
              <li key={i} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0">
                <span className="font-mono text-slate-800 truncate">{s.email}</span>
                <span className="text-xs text-slate-500 shrink-0 flex items-center gap-2">
                  <Badge color={s.type === "particulier" ? "blue" : "purple"}>{s.type}</Badge>
                  <span>{new Date(s.createdAt).toLocaleString("fr-FR")}</span>
                  {s.confirmedAt ? (
                    <Badge color="green">confirmé</Badge>
                  ) : (
                    <Badge color="amber" title="L'utilisateur n'a pas encore cliqué sur le lien de confirmation reçu par email">en attente d'email</Badge>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SubscribersTab
// ============================================================================

function SubscribersTab() {
  const [subs, setSubs] = useState<Subscriber[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "unsubscribed">("all");
  const [search, setSearch] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  function reload() {
    adminFetch<{ subscribers: Subscriber[] }>("/api/admin/subscribers")
      .then((d) => setSubs(d.subscribers))
      .catch((e) => setError(String(e.message ?? e)));
  }

  useEffect(() => {
    reload();
  }, []);

  async function suspend(id: string, email: string) {
    if (!window.confirm(`Suspendre ${email} ?\n\nL'abonné ne recevra plus aucun email mais reste en base. Action réversible.`)) return;
    setActionLoadingId(id);
    try {
      await adminFetch(`/api/admin/subscribers/${id}/suspend`, { method: "POST" });
      reload();
    } catch (e) {
      window.alert(`Erreur : ${(e as Error).message}`);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function reactivate(id: string, email: string) {
    if (!window.confirm(`Réactiver ${email} ?\n\nL'abonné recommencera à recevoir les emails.`)) return;
    setActionLoadingId(id);
    try {
      await adminFetch(`/api/admin/subscribers/${id}/reactivate`, { method: "POST" });
      reload();
    } catch (e) {
      window.alert(`Erreur : ${(e as Error).message}`);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function remove(id: string, email: string) {
    if (!window.confirm(`SUPPRESSION DÉFINITIVE\n\nSupprimer ${email} de la base ?\n\nCette action est irréversible et efface aussi tous ses logs d'envoi. À utiliser uniquement pour les demandes RGPD ("droit à l'effacement").`)) return;
    setActionLoadingId(id);
    try {
      await adminFetch(`/api/admin/subscribers/${id}`, { method: "DELETE" });
      reload();
    } catch (e) {
      window.alert(`Erreur : ${(e as Error).message}`);
    } finally {
      setActionLoadingId(null);
    }
  }

  const filtered = useMemo(() => {
    if (!subs) return [];
    return subs.filter((s) => {
      if (filter === "confirmed" && (!s.confirmedAt || s.unsubscribedAt)) return false;
      if (filter === "pending" && (s.confirmedAt || s.unsubscribedAt)) return false;
      if (filter === "unsubscribed" && !s.unsubscribedAt) return false;
      if (search) {
        const q = search.toLowerCase();
        const fields = [s.email, s.firstName, s.lastName, s.companyName, s.siret, s.role].filter(Boolean).map(String).map((x) => x.toLowerCase());
        if (!fields.some((f) => f.includes(q))) return false;
      }
      return true;
    });
  }, [subs, filter, search]);

  function exportCsv() {
    const rows = filtered.map((s) => ({
      email: s.email,
      type: s.type,
      plan: s.plan,
      prenom: s.firstName ?? "",
      nom: s.lastName ?? "",
      entreprise: s.companyName ?? "",
      siret: s.siret ?? "",
      role: s.role ?? "",
      taille: s.companySize ?? "",
      inscrit_le: s.createdAt,
      confirme_le: s.confirmedAt ?? "",
      desinscrit_le: s.unsubscribedAt ?? "",
      pref_mensuel: s.prefMonthly ? "oui" : "non",
      pref_hebdo: s.prefWeekly ? "oui" : "non",
      pref_alertes: s.prefThreshold ? "oui" : "non",
      derniere_notif: s.lastNotifiedAt ?? "",
    }));
    downloadCsv(`budget-france-inscrits-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(objectsToCsv(rows)));
  }

  if (error) return <ErrorBox message={error} />;
  if (!subs) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="inline-flex rounded-full bg-slate-100 p-1 border border-slate-200">
          <TabBtn active={filter === "all"} onClick={() => setFilter("all")}>Tous ({subs.length})</TabBtn>
          <TabBtn active={filter === "confirmed"} onClick={() => setFilter("confirmed")}>Confirmés</TabBtn>
          <TabBtn active={filter === "pending"} onClick={() => setFilter("pending")}>En attente d'email</TabBtn>
          <TabBtn active={filter === "unsubscribed"} onClick={() => setFilter("unsubscribed")}>Désinscrits</TabBtn>
        </div>
        <input
          type="search"
          placeholder="🔍 Rechercher email, nom, SIRET…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="button"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-brand hover:text-brand text-slate-700 font-medium rounded-lg px-4 py-2 transition-colors text-sm disabled:opacity-50"
        >
          ⬇️ Export CSV ({filtered.length})
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-widest text-muted">
              <tr>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Identité / Entreprise</th>
                <th className="text-left p-3">Inscrit le</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-left p-3">Préfs</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    Aucun résultat.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100 hover:bg-brand-soft/20">
                    <td className="p-3 font-mono text-xs text-slate-800 align-top">{s.email}</td>
                    <td className="p-3 align-top">
                      <Badge color={s.type === "particulier" ? "blue" : "purple"}>{s.type}</Badge>
                    </td>
                    <td className="p-3 text-xs text-slate-600 align-top">
                      {s.type === "particulier"
                        ? [s.firstName, s.lastName].filter(Boolean).join(" ") || "—"
                        : (
                          <>
                            <div className="font-medium text-slate-800">{s.companyName ?? "—"}</div>
                            {s.siret && <div className="font-mono text-[10px]">{s.siret}</div>}
                            {s.role && <div className="text-slate-500">{s.role}</div>}
                          </>
                        )}
                    </td>
                    <td className="p-3 text-xs text-slate-600 align-top whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="p-3 align-top">
                      {s.unsubscribedAt ? (
                        <Badge color="red">désinscrit</Badge>
                      ) : s.confirmedAt ? (
                        <Badge color="green">actif</Badge>
                      ) : (
                        <Badge color="amber" title="L'utilisateur n'a pas encore cliqué sur le lien de confirmation reçu par email">en attente d'email</Badge>
                      )}
                    </td>
                    <td className="p-3 align-top text-xs">
                      <div className="flex flex-wrap gap-1">
                        {s.prefMonthly && <Badge color="slate">mensuel</Badge>}
                        {s.prefWeekly && <Badge color="slate">hebdo</Badge>}
                        {s.prefThreshold && <Badge color="slate">notif</Badge>}
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <div className="flex flex-col gap-1">
                        {s.unsubscribedAt ? (
                          <button
                            type="button"
                            disabled={actionLoadingId === s.id}
                            onClick={() => reactivate(s.id, s.email)}
                            className="text-[10px] px-2 py-1 rounded border border-money/40 text-money hover:bg-green-50 transition disabled:opacity-50 whitespace-nowrap"
                            title="Réactiver l'abonné"
                          >
                            ↺ réactiver
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={actionLoadingId === s.id}
                            onClick={() => suspend(s.id, s.email)}
                            className="text-[10px] px-2 py-1 rounded border border-amber-300 text-amber-700 hover:bg-amber-50 transition disabled:opacity-50 whitespace-nowrap"
                            title="Suspendre — l'abonné ne recevra plus d'emails (action réversible)"
                          >
                            ⏸ suspendre
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={actionLoadingId === s.id}
                          onClick={() => remove(s.id, s.email)}
                          className="text-[10px] px-2 py-1 rounded border border-flag-red/40 text-flag-red hover:bg-red-50 transition disabled:opacity-50 whitespace-nowrap"
                          title="Suppression définitive (RGPD — droit à l'effacement)"
                        >
                          🗑 supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SourcesTab
// ============================================================================

function SourcesTab() {
  const [data, setData] = useState<SourcesPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkData, setCheckData] = useState<CheckSourcesPayload | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<SourcesPayload>("/api/admin/sources").then(setData).catch((e) => setError(String(e.message ?? e)));
  }, []);

  async function runCheck() {
    setChecking(true);
    setCheckError(null);
    try {
      const r = await adminFetch<CheckSourcesPayload>("/api/admin/check-sources");
      setCheckData(r);
    } catch (e) {
      setCheckError(e instanceof Error ? e.message : String(e));
    } finally {
      setChecking(false);
    }
  }

  // Map id → résultat de vérification
  const checkById = new Map(checkData?.results.map((r) => [r.id, r] as const) ?? []);

  if (error) return <ErrorBox message={error} />;
  if (!data) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total sources" value={data.counts.total} color="text-slate-900" />
        <StatCard label="Live" value={data.counts.live} color="text-money" sub="API répondu" />
        <StatCard label="Secours" value={data.counts.fallback} color="text-amber-600" sub="seed local" />
        <StatCard label="Erreurs" value={data.counts.error} color="text-flag-red" />
      </div>

      <div className="card p-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted mb-2">
            Dernier snapshot
          </div>
          <div className="font-mono text-sm text-slate-700">
            {data.generatedAt ? new Date(data.generatedAt).toLocaleString("fr-FR") : "indisponible"}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Fichier : <code className="bg-slate-100 px-1.5 py-0.5 rounded">{data.snapshotPath}</code>
          </div>
          {data.error && <div className="text-flag-red text-sm mt-2">{data.error}</div>}
        </div>
        <div className="text-right">
          <button
            type="button"
            onClick={runCheck}
            disabled={checking}
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2 text-sm transition-colors"
          >
            {checking ? "Vérification…" : "🔗 Vérifier les liens"}
          </button>
          {checkData && (
            <div className="text-[11px] text-slate-600 mt-2 leading-tight">
              {checkData.counts.ok} OK · {checkData.counts.ko} KO · {checkData.counts.noUrl} sans URL
            </div>
          )}
          {checkError && <div className="text-flag-red text-xs mt-2">{checkError}</div>}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-widest text-muted">
            <tr>
              <th className="text-left p-3">Source</th>
              <th className="text-left p-3">Statut snapshot</th>
              <th className="text-left p-3">Lien (vérifié)</th>
              <th className="text-left p-3">URL</th>
            </tr>
          </thead>
          <tbody>
            {data.sources.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-500">Aucune source dans le snapshot.</td>
              </tr>
            ) : (
              data.sources.map((s) => {
                const isFallback = s.fallback || s.status === "fallback";
                const isError = s.status === "error";
                const check = checkById.get(s.id);
                return (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="p-3">
                      <div className="font-medium text-slate-800">{s.label}</div>
                      <div className="text-[10px] font-mono text-slate-400">{s.id}</div>
                    </td>
                    <td className="p-3">
                      {isError ? (
                        <Badge color="red">erreur</Badge>
                      ) : isFallback ? (
                        <Badge color="amber">secours</Badge>
                      ) : (
                        <Badge color="green">live</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      {!check ? (
                        <span className="text-slate-300 text-xs">—</span>
                      ) : check.ok ? (
                        <span className="inline-flex items-center gap-2">
                          <Badge color="green">✓ {check.httpStatus}</Badge>
                          <span className="text-[10px] text-slate-400">{check.durationMs}ms</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <Badge color="red">✗ {check.httpStatus ?? "err"}</Badge>
                          {check.error && (
                            <span className="text-[10px] text-flag-red font-mono truncate max-w-[180px]" title={check.error}>
                              {check.error}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand hover:underline text-xs font-mono break-all"
                        >
                          {s.url}
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// AnalyticsTab — fréquentation et téléchargements
// ============================================================================

interface AnalyticsPayload {
  windows: {
    today: { views: number; sessions: number; downloads: number };
    week: { views: number; sessions: number; downloads: number };
    month: { views: number; sessions: number; downloads: number };
    allTime: { views: number; downloads: number };
  };
  topPages: { page: string; views: number }[];
  downloadsByFormat: { format: "png" | "jpeg" | "csv"; count: number }[];
  topFiles: { filename: string; format: "png" | "jpeg" | "csv"; count: number }[];
  evolution: { date: string; views: number; sessions: number; downloads: number }[];
  topCountries: { country: string; views: number; sessions: number }[];
  unknownCountryViews: number;
}

const COUNTRY_NAMES: Record<string, string> = {
  FR: "🇫🇷 France",
  DE: "🇩🇪 Allemagne",
  IT: "🇮🇹 Italie",
  ES: "🇪🇸 Espagne",
  GB: "🇬🇧 Royaume-Uni",
  BE: "🇧🇪 Belgique",
  LU: "🇱🇺 Luxembourg",
  CH: "🇨🇭 Suisse",
  NL: "🇳🇱 Pays-Bas",
  PT: "🇵🇹 Portugal",
  IE: "🇮🇪 Irlande",
  PL: "🇵🇱 Pologne",
  AT: "🇦🇹 Autriche",
  US: "🇺🇸 États-Unis",
  CA: "🇨🇦 Canada",
  MA: "🇲🇦 Maroc",
  TN: "🇹🇳 Tunisie",
  DZ: "🇩🇿 Algérie",
  SN: "🇸🇳 Sénégal",
  CI: "🇨🇮 Côte d'Ivoire",
  CM: "🇨🇲 Cameroun",
  CN: "🇨🇳 Chine",
  JP: "🇯🇵 Japon",
  AU: "🇦🇺 Australie",
  BR: "🇧🇷 Brésil",
};

function countryDisplay(code: string): string {
  return COUNTRY_NAMES[code] ?? `🏳 ${code}`;
}

const PAGE_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  europe: "Europe",
  historique: "Historique",
  fraudes: "Fraudes",
  "mes-impots": "Mes impôts",
  pedagogie: "Comprendre",
  "secu-collec": "Sécu & Collectivités",
  sources: "Sources",
  glossaire: "Fiches pédagogiques",
  tarifs: "Premium",
  compte: "Mon compte",
  "paiement-reussi": "Paiement réussi",
  __admin: "Admin (interne)",
};

function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<AnalyticsPayload>("/api/admin/analytics")
      .then(setData)
      .catch((e) => setError(String(e.message ?? e)));
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!data) return <Loading />;

  const w = data.windows;
  const totalDl = data.downloadsByFormat.reduce((a, b) => a + b.count, 0);

  return (
    <div className="space-y-4">
      {/* KPIs par fenêtre */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Vues 24h" value={w.today.views} color="text-brand" sub={`${w.today.sessions} visiteurs uniques`} />
        <StatCard label="Vues 7j" value={w.week.views} color="text-brand" sub={`${w.week.sessions} visiteurs uniques`} />
        <StatCard label="Vues 30j" value={w.month.views} color="text-brand" sub={`${w.month.sessions} visiteurs uniques`} />
        <StatCard label="Vues totales" value={w.allTime.views} color="text-slate-900" sub={`depuis le lancement`} />
        <StatCard label="Téléchargements 24h" value={w.today.downloads} color="text-money" />
        <StatCard label="Téléchargements 7j" value={w.week.downloads} color="text-money" />
        <StatCard label="Téléchargements 30j" value={data.evolution.reduce((a, b) => a + b.downloads, 0)} color="text-money" />
        <StatCard label="Téléchargements totaux" value={w.allTime.downloads} color="text-money" />
      </div>

      {/* Évolution sur 30 jours */}
      <div className="card p-5 md:p-6">
        <h3 className="font-display text-lg font-semibold text-slate-900 mb-3">
          Évolution sur 30 jours
        </h3>
        {data.evolution.length === 0 ? (
          <p className="text-sm text-slate-500">Pas encore de fréquentation enregistrée.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.evolution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={20} tickFormatter={(d) => String(d).slice(5)} />
                <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 12 }} labelFormatter={(d) => `Jour ${d}`} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="square" />
                <Bar dataKey="views" name="Vues" fill="#0055A4" radius={[3, 3, 0, 0]} />
                <Bar dataKey="sessions" name="Visiteurs uniques" fill="#16a34a" radius={[3, 3, 0, 0]} />
                <Bar dataKey="downloads" name="Téléchargements" fill="#d97706" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top pays d'origine */}
      <div className="card p-5 md:p-6">
        <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-display text-lg font-semibold text-slate-900">
            🌍 Pays d'origine des visiteurs (30 jours)
          </h3>
          {data.unknownCountryViews > 0 && (
            <span className="text-[11px] text-slate-500">
              {data.unknownCountryViews} vues sans pays résolu
            </span>
          )}
        </div>
        {data.topCountries.length === 0 ? (
          <p className="text-sm text-slate-500">
            Pas encore de pays résolus. Les visiteurs depuis le VPS lui-même (debug) sont
            ignorés. Les premiers visiteurs externes apparaîtront ici sous quelques minutes.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.topCountries.map((c) => {
              const max = data.topCountries[0]?.views || 1;
              const pct = (c.views / max) * 100;
              return (
                <li key={c.country}>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="font-medium text-slate-800">
                      {countryDisplay(c.country)}
                    </span>
                    <span className="tabular-nums text-slate-500 shrink-0 text-xs">
                      <strong className="text-brand">{c.views} vues</strong>
                      {" · "}
                      <span className="text-money">{c.sessions} visiteurs uniques</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${Math.max(3, pct)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-4 text-[11px] text-slate-500 leading-relaxed">
          Géolocalisation par IP (service ip-api.com). L'IP n'est <strong>jamais
          stockée</strong> en base — uniquement le code pays. Cache 24h en mémoire.
        </div>
      </div>

      {/* Top pages + Téléchargements par format */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5 md:p-6">
          <h3 className="font-display text-lg font-semibold text-slate-900 mb-3">
            Pages les plus consultées (30 jours)
          </h3>
          {data.topPages.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune donnée pour l'instant.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.topPages.map((p) => {
                const max = data.topPages[0]?.views || 1;
                const pct = (p.views / max) * 100;
                return (
                  <li key={p.page}>
                    <div className="flex items-center justify-between gap-3 text-sm mb-1">
                      <span className="font-medium text-slate-800">
                        {PAGE_LABELS[p.page] ?? p.page}
                      </span>
                      <span className="tabular-nums font-semibold text-brand shrink-0">
                        {p.views} vues
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${Math.max(3, pct)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card p-5 md:p-6">
          <h3 className="font-display text-lg font-semibold text-slate-900 mb-3">
            Téléchargements par format
          </h3>
          {totalDl === 0 ? (
            <p className="text-sm text-slate-500">Aucun téléchargement pour l'instant.</p>
          ) : (
            <ul className="space-y-3">
              {(["png", "jpeg", "csv"] as const).map((fmt) => {
                const found = data.downloadsByFormat.find((d) => d.format === fmt);
                const count = found?.count ?? 0;
                const pct = totalDl > 0 ? (count / totalDl) * 100 : 0;
                const color = fmt === "csv" ? "#16a34a" : fmt === "png" ? "#0055A4" : "#7c3aed";
                return (
                  <li key={fmt}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-mono uppercase text-slate-700">{fmt}</span>
                      <span className="tabular-nums font-semibold text-slate-900">
                        {count} <span className="text-xs text-slate-500 font-normal">({pct.toFixed(0)} %)</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(3, pct)}%`, background: color }} />
                    </div>
                  </li>
                );
              })}
              <li className="border-t border-slate-100 pt-2 text-xs text-slate-500">
                Total : <strong>{totalDl}</strong> téléchargements
              </li>
            </ul>
          )}
        </div>
      </div>

      {/* Top fichiers téléchargés */}
      <div className="card p-5 md:p-6">
        <h3 className="font-display text-lg font-semibold text-slate-900 mb-3">
          Graphes les plus téléchargés (top 25)
        </h3>
        {data.topFiles.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun téléchargement pour l'instant.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-widest text-muted">
                <tr>
                  <th className="text-left p-2">Fichier</th>
                  <th className="text-left p-2">Format</th>
                  <th className="text-right p-2">Téléchargements</th>
                </tr>
              </thead>
              <tbody>
                {data.topFiles.map((f, i) => (
                  <tr key={`${f.filename}-${f.format}-${i}`} className="border-t border-slate-100">
                    <td className="p-2 font-mono text-xs text-slate-800">{f.filename}</td>
                    <td className="p-2">
                      <Badge color={f.format === "csv" ? "green" : f.format === "png" ? "blue" : "purple"}>
                        {f.format}
                      </Badge>
                    </td>
                    <td className="p-2 text-right tabular-nums font-semibold">{f.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card p-4 bg-brand-soft/20 border-brand/20 text-xs text-slate-600 leading-relaxed">
        <strong className="text-brand">Confidentialité :</strong> ces statistiques sont
        anonymes. On stocke uniquement un identifiant aléatoire (sessionId) côté
        navigateur pour distinguer les visiteurs ; aucune IP, aucun User-Agent
        identifiant, aucune donnée personnelle. Conforme RGPD sans bandeau
        cookies (article 6.1.f, intérêt légitime).
      </div>
    </div>
  );
}

// ============================================================================
// EmailsTab
// ============================================================================

function EmailsTab() {
  const [data, setData] = useState<EmailLogsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "confirm" | "monthly" | "weekly" | "threshold">("all");

  useEffect(() => {
    adminFetch<EmailLogsPayload>("/api/admin/email-logs?limit=500").then(setData).catch((e) => setError(String(e.message ?? e)));
  }, []);

  const logs = useMemo(() => {
    if (!data) return [];
    if (typeFilter === "all") return data.logs;
    return data.logs.filter((l) => l.type === typeFilter);
  }, [data, typeFilter]);

  if (error) return <ErrorBox message={error} />;
  if (!data) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="grid grid-cols-3 gap-3 flex-1 min-w-[260px]">
          <StatCard label="Réussis" value={data.totals.success} color="text-money" />
          <StatCard label="Échecs" value={data.totals.failure} color="text-flag-red" />
          <StatCard label="Total chargé" value={data.logs.length} color="text-slate-900" sub={`max 500`} />
        </div>
      </div>

      <div className="inline-flex rounded-full bg-slate-100 p-1 border border-slate-200 flex-wrap">
        <TabBtn active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>Tous</TabBtn>
        <TabBtn active={typeFilter === "confirm"} onClick={() => setTypeFilter("confirm")}>Confirmation</TabBtn>
        <TabBtn active={typeFilter === "monthly"} onClick={() => setTypeFilter("monthly")}>Mensuel</TabBtn>
        <TabBtn active={typeFilter === "weekly"} onClick={() => setTypeFilter("weekly")}>Hebdo</TabBtn>
        <TabBtn active={typeFilter === "threshold"} onClick={() => setTypeFilter("threshold")}>Notification</TabBtn>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-widest text-muted">
              <tr>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Destinataire</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-left p-3">Erreur</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">Aucun log.</td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="border-t border-slate-100">
                    <td className="p-3 text-xs text-slate-600 whitespace-nowrap">
                      {new Date(l.sentAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="p-3">
                      <Badge color="blue">{l.type}</Badge>
                    </td>
                    <td className="p-3 font-mono text-xs">{l.subscriber.email}</td>
                    <td className="p-3">
                      {l.success ? <Badge color="green">envoyé</Badge> : <Badge color="red">échec</Badge>}
                    </td>
                    <td className="p-3 text-xs text-flag-red font-mono break-all">{l.error ?? ""}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helpers UI
// ============================================================================

function StatCard({
  label, value, color, sub,
}: {
  label: string;
  value: number | string;
  color: string;
  sub?: string;
}) {
  return (
    <div className="card p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted">{label}</div>
      <div className={`font-display text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function Badge({ color, children }: { color: "green" | "red" | "amber" | "blue" | "purple" | "slate"; children: React.ReactNode }) {
  const styles: Record<string, string> = {
    green: "bg-green-50 text-money border-green-200",
    red: "bg-red-50 text-flag-red border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-brand border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-medium ${styles[color]}`}>
      {children}
    </span>
  );
}

function Loading() {
  return <div className="card p-6 text-sm text-slate-500">Chargement…</div>;
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="card p-6 border-flag-red/20 bg-red-50/30">
      <div className="text-flag-red font-medium">Erreur</div>
      <div className="text-sm text-slate-700 mt-1">{message}</div>
    </div>
  );
}
