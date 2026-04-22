// ============================================================================
// Webhooks sortants — Slack, Discord, générique
// ============================================================================
//
// Quand le job threshold détecte une alerte (dette qui franchit un cap, OAT
// qui bouge > 20 pb, etc.), on pousse l'événement vers les webhooks configurés
// en plus des emails aux abonnés. Pratique pour les rédactions qui
// consolident leurs alertes dans un canal Slack dédié.
//
// 3 transports supportés :
//   - Slack      : format Block Kit (SLACK_WEBHOOK_URL)
//   - Discord    : format embeds (DISCORD_WEBHOOK_URL)
//   - Générique  : POST JSON brut vers une URL (GENERIC_WEBHOOK_URL)
//
// Tous sont optionnels. Les trois peuvent coexister.

import { config } from "./config.ts";

export interface AlertPayload {
  kind: "dette" | "oat";
  title: string;
  summary: string;
  previousValue: number | string;
  newValue: number | string;
  deltaLabel: string;
  crossedMilestone?: string;
  dashboardUrl: string;
}

export interface WebhookResult {
  transport: string;
  ok: boolean;
  status?: number;
  error?: string;
}

/**
 * Diffuse l'alerte vers TOUS les webhooks configurés en parallèle.
 * Les échecs ne bloquent pas l'envoi aux autres destinations.
 */
export async function broadcastAlert(payload: AlertPayload): Promise<WebhookResult[]> {
  const targets = [
    config.webhooks.slackUrl && { name: "slack", fn: () => postSlack(config.webhooks.slackUrl!, payload) },
    config.webhooks.discordUrl && { name: "discord", fn: () => postDiscord(config.webhooks.discordUrl!, payload) },
    config.webhooks.genericUrl && { name: "generic", fn: () => postGeneric(config.webhooks.genericUrl!, payload) },
  ].filter((x): x is { name: string; fn: () => Promise<WebhookResult> } => Boolean(x));

  if (targets.length === 0) return [];
  return Promise.all(targets.map((t) => t.fn().catch((e) => ({ transport: t.name, ok: false, error: (e as Error).message }))));
}

// ---------------------------------------------------------------------------
// Slack — Block Kit
// ---------------------------------------------------------------------------

async function postSlack(url: string, p: AlertPayload): Promise<WebhookResult> {
  const emoji = p.kind === "dette" ? ":chart_with_upwards_trend:" : ":zap:";
  const milestoneLine = p.crossedMilestone
    ? { type: "section", text: { type: "mrkdwn", text: `:rotating_light: *Cap franchi : ${p.crossedMilestone}*` } }
    : null;

  const body = {
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: `${emoji} Budget France — ${p.title}` },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: p.summary },
      },
      ...(milestoneLine ? [milestoneLine] : []),
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Précédent*\n${p.previousValue}` },
          { type: "mrkdwn", text: `*Nouveau*\n${p.newValue}` },
          { type: "mrkdwn", text: `*Variation*\n${p.deltaLabel}` },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Voir le dashboard" },
            url: p.dashboardUrl,
          },
        ],
      },
    ],
  };

  return doPost(url, body, "slack");
}

// ---------------------------------------------------------------------------
// Discord — embed
// ---------------------------------------------------------------------------

async function postDiscord(url: string, p: AlertPayload): Promise<WebhookResult> {
  const colorInt = p.kind === "dette" ? 0xef4135 : 0x0055a4;
  const body = {
    username: "Budget France",
    embeds: [
      {
        title: p.title,
        description: p.summary + (p.crossedMilestone ? `\n\n**Cap franchi : ${p.crossedMilestone}**` : ""),
        url: p.dashboardUrl,
        color: colorInt,
        fields: [
          { name: "Précédent", value: String(p.previousValue), inline: true },
          { name: "Nouveau", value: String(p.newValue), inline: true },
          { name: "Variation", value: p.deltaLabel, inline: true },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };
  return doPost(url, body, "discord");
}

// ---------------------------------------------------------------------------
// Webhook générique — POST JSON brut
// ---------------------------------------------------------------------------

async function postGeneric(url: string, p: AlertPayload): Promise<WebhookResult> {
  return doPost(url, {
    source: "budget-france",
    type: "threshold_alert",
    at: new Date().toISOString(),
    payload: p,
  }, "generic");
}

// ---------------------------------------------------------------------------
// Helper fetch avec timeout
// ---------------------------------------------------------------------------

async function doPost(url: string, body: unknown, transport: string): Promise<WebhookResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    return { transport, ok: res.ok, status: res.status };
  } catch (e) {
    return { transport, ok: false, error: (e as Error).message };
  } finally {
    clearTimeout(timer);
  }
}
