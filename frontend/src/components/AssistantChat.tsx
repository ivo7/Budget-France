// ============================================================================
// AssistantChat — bouton flottant + fenêtre de chat avec l'assistant IA
// ============================================================================
//
// Composant global affiché sur toutes les pages. Bouton en bas à droite qui
// ouvre une mini-fenêtre de chat. L'assistant est strictement cadré pour
// répondre uniquement aux questions sur les finances publiques françaises,
// avec citations obligatoires des sources.
//
// Backend : POST /api/assistant/ask
//   { question, history } → { answer, sources?: string[] }
//
// Rate limit : 10 questions/heure/IP (côté backend).
// ============================================================================

import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

interface ApiResponse {
  answer: string;
  sources?: string[];
  error?: string;
  message?: string;
}

const SUGGESTIONS = [
  "C'est quoi la CSG ?",
  "Combien coûte le nucléaire à la France ?",
  "Quelle est la dette de ma commune ?",
  "Qui sont les top fournisseurs des marchés publics ?",
  "Comment se compare le taux d'IS français à l'Allemagne ?",
];

export function AssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll en bas quand un nouveau message arrive
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  async function send(question: string) {
    if (!question.trim() || loading) return;
    setError(null);

    // Ajoute le message utilisateur immédiatement
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: question },
    ];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch("/api/assistant/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          history: newMessages.slice(0, -1).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data: ApiResponse = await resp.json().catch(() => ({
        answer: "",
        error: "parse_error",
      }));

      if (!resp.ok) {
        if (resp.status === 429) {
          setError(
            data.message ??
              "Limite atteinte (10 questions/heure). Réessaye plus tard.",
          );
        } else {
          setError(
            data.message ??
              "L'assistant est temporairement indisponible. Réessaye plus tard.",
          );
        }
        // Ne pas ajouter de réponse vide à l'historique
      } else {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: data.answer,
            sources: data.sources,
          },
        ]);
      }
    } catch (e) {
      setError(`Erreur réseau : ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  function reset() {
    setMessages([]);
    setError(null);
    setInput("");
  }

  return (
    <>
      {/* Bouton flottant */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Ouvrir l'assistant"
          className="fixed bottom-6 right-6 z-40 bg-brand hover:bg-brand-dark text-white rounded-full px-5 py-3 shadow-xl flex items-center gap-2 text-sm font-semibold transition-all hover:scale-105"
        >
          <span className="text-base">💬</span>
          <span className="hidden sm:inline">Demander à l'assistant</span>
          <span className="sm:hidden">Aide</span>
        </button>
      )}

      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-40 w-[calc(100vw-3rem)] sm:w-[420px] max-h-[calc(100vh-3rem)] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-brand text-white px-4 py-3 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span>💬</span>
                <strong className="text-sm">Assistant Budget France</strong>
              </div>
              <div className="text-[10px] opacity-80">
                Strictement finances publiques · Cite ses sources
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  aria-label="Effacer la conversation"
                  title="Effacer la conversation"
                  className="text-white/80 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10"
                >
                  ✕ Effacer
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fermer"
                className="text-white/80 hover:text-white text-xl leading-none px-2 py-0.5 rounded hover:bg-white/10"
              >
                ×
              </button>
            </div>
          </div>

          {/* Corps */}
          <div
            ref={bodyRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 min-h-[300px] max-h-[60vh]"
          >
            {messages.length === 0 && !loading && (
              <div className="space-y-3">
                <p className="text-sm text-slate-700 leading-relaxed">
                  Bonjour 👋 Je suis l'assistant de Budget France. Je réponds aux
                  questions sur le budget de l'État, la fiscalité, la Sécu, les
                  comptes communaux, l'économie publique. <strong>Je cite
                  toujours mes sources.</strong>
                </p>
                <div className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mt-3">
                  Quelques exemples
                </div>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="text-left text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-brand hover:bg-brand-soft/30 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 italic pl-2">
                <span className="inline-block w-2 h-2 bg-brand rounded-full animate-pulse" />
                <span>L'assistant réfléchit…</span>
              </div>
            )}

            {error && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                ⚠ {error}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-200 p-3 bg-white"
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pose ta question sur les finances publiques…"
                maxLength={600}
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-slate-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-brand hover:bg-brand-dark disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Envoyer
              </button>
            </div>
            <div className="text-[10px] text-slate-400 mt-1.5 leading-tight">
              IA peut faire des erreurs. Toujours vérifier les chiffres
              importants. Limite : 10 questions/heure.
            </div>
          </form>
        </div>
      )}
    </>
  );
}

// ============================================================================
// MessageBubble
// ============================================================================

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  // Convertit les liens internes (#/xxx) en liens cliquables
  const renderContent = (text: string) => {
    const parts = text.split(/(#\/[a-z0-9-]+(?:\/[a-z0-9-]+)*)/gi);
    return parts.map((part, idx) => {
      if (part.startsWith("#/")) {
        return (
          <a
            key={idx}
            href={part}
            className="text-brand underline hover:text-brand-dark"
          >
            {part}
          </a>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-brand text-white rounded-br-sm"
            : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
        }`}
      >
        {renderContent(message.content)}

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
            <strong className="text-slate-600">Sources citées :</strong>{" "}
            {message.sources.join(" · ")}
          </div>
        )}
      </div>
    </div>
  );
}
