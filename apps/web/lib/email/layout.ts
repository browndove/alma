import { parseCoordsFromAddress } from "@/lib/deliveries/tookan"

import { getAppUrl, getLogoUrl } from "./resend"

/**
 * Shared building blocks for every Diatel email.
 *
 * Email clients ignore most CSS, so layout is tables + inline styles. A small
 * <style> block adds phone tweaks (stacked columns, tighter padding, full-width
 * buttons) for the clients that support media queries — Gmail, Apple Mail, iOS.
 */

export const EMAIL_FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace"

const INK = "#0a2540"
const MUTED = "#5a6a7e"
const FAINT = "#8792a2"
const LINE = "#e6ebf1"
const ORANGE = "#fe5200"

export type EmailTone = "orange" | "green" | "navy"

const TONES: Record<EmailTone, { tint: string; text: string }> = {
  orange: { tint: "#fff1e8", text: "#c2410c" },
  green: { tint: "#e8f8ef", text: "#067647" },
  navy: { tint: "#eef2f7", text: "#334155" },
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName
}

/** Map picker stores "Place · lat, lng" — emails show the place only. */
export function displayAddress(address: string) {
  return parseCoordsFromAddress(address).label || address.trim()
}

export function trackUrl(trackingId: string) {
  return `${getAppUrl()}/track?id=${encodeURIComponent(trackingId)}`
}

const label = (text: string) =>
  `<p style="margin:0;font-size:11px;line-height:1.4;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${FAINT};">${text}</p>`

/** One full-width row inside the white card. */
function row(content: string, padding = "24px 32px 0") {
  return `<tr><td class="em-pad" style="padding:${padding};font-family:${EMAIL_FONT};">${content}</td></tr>`
}

export function heroBlock(params: {
  kicker: string
  tone?: EmailTone
  heading: string
  intro: string
}) {
  const tone = TONES[params.tone ?? "orange"]
  return row(
    `<span style="display:inline-block;padding:5px 10px;border-radius:999px;background:${tone.tint};color:${tone.text};font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(params.kicker)}</span>
     <h1 class="em-h1" style="margin:16px 0 0;font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-0.02em;color:${INK};">${escapeHtml(params.heading)}</h1>
     <p style="margin:10px 0 0;font-size:15px;line-height:1.6;color:${MUTED};">${params.intro}</p>`,
    "32px 32px 0",
  )
}

/** Big amount panel — the hero number for payment emails. */
export function amountBlock(params: { label: string; amount: string; note?: string }) {
  return row(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff7f2;border:1px solid #ffe2d1;border-radius:14px;">
       <tr><td style="padding:20px 22px;">
         ${label(escapeHtml(params.label))}
         <p class="em-amount" style="margin:8px 0 0;font-size:38px;line-height:1;font-weight:700;letter-spacing:-0.03em;color:${INK};">${escapeHtml(params.amount)}</p>
         ${params.note ? `<p style="margin:10px 0 0;font-size:13px;line-height:1.5;color:${MUTED};">${params.note}</p>` : ""}
       </td></tr>
     </table>`,
  )
}

/** Bulletproof button (a padded link — works without images or CSS support). */
export function buttonBlock(params: {
  href: string
  label: string
  secondary?: { href: string; label: string }
}) {
  const secondary = params.secondary
    ? `<p style="margin:14px 0 0;font-size:14px;text-align:center;"><a href="${escapeHtml(params.secondary.href)}" style="color:${ORANGE};text-decoration:none;font-weight:600;">${escapeHtml(params.secondary.label)}</a></p>`
    : ""
  return row(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
       <tr><td align="center" bgcolor="${ORANGE}" style="border-radius:10px;background:${ORANGE};">
         <a class="em-btn" href="${escapeHtml(params.href)}" style="display:block;padding:15px 20px;font-family:${EMAIL_FONT};font-size:16px;font-weight:700;line-height:1.2;color:#ffffff;text-decoration:none;border-radius:10px;">${escapeHtml(params.label)}</a>
       </td></tr>
     </table>
     ${secondary}`,
    "24px 32px 0",
  )
}

export function trackingBlock(params: { code: string; metaLabel: string; metaValue: string }) {
  return row(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fb;border-radius:14px;">
       <tr><td style="padding:18px 20px;">
         ${label("Tracking code")}
         <p style="margin:8px 0 0;font-size:26px;line-height:1;font-weight:700;letter-spacing:0.06em;color:${INK};font-family:${MONO};">${escapeHtml(params.code)}</p>
         <p style="margin:12px 0 0;font-size:13px;line-height:1.4;color:${MUTED};">
           <span style="color:${FAINT};">${escapeHtml(params.metaLabel)}</span>&nbsp;·&nbsp;<strong style="color:${INK};font-weight:600;">${escapeHtml(params.metaValue)}</strong>
         </p>
       </td></tr>
     </table>`,
  )
}

export function routeBlock(params: {
  pickup: string
  pickupNote?: string
  dropoff: string
  dropoffNote?: string
}) {
  const note = (text?: string) =>
    text ? `<p style="margin:3px 0 0;font-size:13px;line-height:1.4;color:${MUTED};">${escapeHtml(text)}</p>` : ""
  const stop = (kind: "pickup" | "dropoff", title: string, place: string, extra?: string) => `
    <tr>
      <td width="26" valign="top" style="padding-top:3px;">
        <div style="width:10px;height:10px;${kind === "pickup" ? `border:3px solid ${ORANGE};border-radius:50%;background:#ffffff;` : `border:3px solid ${INK};border-radius:3px;background:${INK};`}"></div>
      </td>
      <td valign="top" style="padding-bottom:${kind === "pickup" ? "16px" : "0"};">
        ${label(title)}
        <p style="margin:4px 0 0;font-size:15px;line-height:1.45;font-weight:600;color:${INK};">${escapeHtml(place)}</p>
        ${note(extra)}
      </td>
    </tr>`
  return row(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
       ${stop("pickup", "Pickup", params.pickup, params.pickupNote)}
       ${stop("dropoff", "Drop-off", params.dropoff, params.dropoffNote)}
     </table>`,
  )
}

/** 2–3 facts side by side; they stack on phones. */
export function factsBlock(items: { label: string; value: string; sub?: string }[]) {
  const width = `${Math.floor(100 / items.length)}%`
  const cells = items
    .map(
      (item, index) => `
      <td class="em-stack" width="${width}" valign="top" style="padding:16px ${index === items.length - 1 ? "0" : "12px"} 0 0;">
        ${label(escapeHtml(item.label))}
        <p style="margin:6px 0 0;font-size:15px;line-height:1.35;font-weight:600;color:${INK};">${escapeHtml(item.value)}</p>
        ${item.sub ? `<p style="margin:2px 0 0;font-size:13px;color:${MUTED};">${escapeHtml(item.sub)}</p>` : ""}
      </td>`,
    )
    .join("")
  return row(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE};">
       <tr>${cells}</tr>
     </table>`,
  )
}

/** The recipient's handover code — the one secret in a Diatel email. */
export function handoverCodeBlock(code: string) {
  const digits = code
    .split("")
    .map(
      (digit) =>
        `<td align="center" style="width:52px;height:60px;border:1px solid ${LINE};border-radius:10px;background:#ffffff;font-family:${MONO};font-size:30px;font-weight:700;color:${INK};">${escapeHtml(digit)}</td>`,
    )
    .join(`<td style="width:8px;font-size:0;">&nbsp;</td>`)
  return row(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fb;border-radius:14px;">
       <tr><td style="padding:20px 22px;">
         ${label("Your handover code")}
         <table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0 0;"><tr>${digits}</tr></table>
         <p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:${MUTED};">
           Give this code to the rider <strong style="color:${INK};">only once the package is in your hands</strong>. It confirms you received it — keep it private until then.
         </p>
       </td></tr>
     </table>`,
  )
}

/** Labelled free-text block (e.g. a contact message). Pass already-escaped HTML. */
export function messageBlock(params: { label: string; html: string }) {
  return row(
    `${label(escapeHtml(params.label))}
     <div style="margin:10px 0 0;padding:16px 18px;border-left:3px solid ${ORANGE};background:#f6f8fb;border-radius:0 10px 10px 0;font-size:15px;line-height:1.65;color:${INK};">${params.html}</div>`,
  )
}

/** Small muted closing note with the raw link, for clients that block buttons. */
export function linkFallbackBlock(url: string, lead = "Button not working? Paste this link into your browser:") {
  return row(
    `<p style="margin:0;padding-top:18px;border-top:1px solid ${LINE};font-size:12px;line-height:1.5;color:${FAINT};">
       ${escapeHtml(lead)}<br />
       <a href="${escapeHtml(url)}" style="color:${MUTED};text-decoration:underline;word-break:break-all;">${escapeHtml(url)}</a>
     </p>`,
    "24px 32px 0",
  )
}

export function renderEmail(params: {
  title: string
  preheader: string
  blocks: string[]
  footerNote?: string
}) {
  const home = getAppUrl()
  const logo = getLogoUrl()
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${escapeHtml(params.title)}</title>
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
    a { color: ${ORANGE}; }
    @media (max-width: 600px) {
      .em-outer { padding: 16px 10px 28px !important; }
      .em-pad { padding-left: 20px !important; padding-right: 20px !important; }
      .em-h1 { font-size: 22px !important; }
      .em-amount { font-size: 32px !important; }
      .em-stack { display: block !important; width: 100% !important; padding-right: 0 !important; }
      .em-btn { padding: 16px 18px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f2f4f7;font-family:${EMAIL_FONT};color:${INK};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
    ${escapeHtml(params.preheader)}&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f7;">
    <tr>
      <td class="em-outer" align="center" style="padding:32px 16px 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="padding:0 4px 18px;">
              <a href="${escapeHtml(home)}" style="text-decoration:none;">
                <img src="${escapeHtml(logo)}" width="32" height="32" alt="" style="display:inline-block;vertical-align:middle;width:32px;height:32px;border:0;" />
                <span style="display:inline-block;vertical-align:middle;margin-left:8px;font-family:${EMAIL_FONT};font-size:20px;font-weight:700;letter-spacing:-0.02em;color:${INK};">diatel</span>
              </a>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border:1px solid ${LINE};border-radius:18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${params.blocks.join("\n")}
                <tr><td style="height:32px;line-height:32px;font-size:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 12px 0;font-family:${EMAIL_FONT};text-align:center;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${FAINT};">
                ${params.footerNote ? `${escapeHtml(params.footerNote)}<br />` : ""}
                Diatel Delivery · Accra, Ghana · <a href="${escapeHtml(home)}" style="color:${FAINT};text-decoration:underline;">${escapeHtml(new URL(home).host)}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
