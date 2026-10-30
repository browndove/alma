import type { Delivery } from "@/lib/deliveries/types"
import { parseCoordsFromAddress } from "@/lib/deliveries/tookan"

import { getAppUrl, getLogoUrl, getResend, getResendFrom } from "./resend"

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

export const ORDERS_NOTIFY_EMAIL =
  process.env.ORDERS_NOTIFY_EMAIL?.trim() ||
  process.env.CONTACT_TO_EMAIL?.trim() ||
  "hrdiateldelivery@gmail.com"

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName
}

/** Map picker stores "Place · lat, lng" — emails should show the place only. */
function displayAddress(address: string) {
  return parseCoordsFromAddress(address).label || address.trim()
}

function pickupLabel(delivery: Delivery) {
  return delivery.etaLabel
}

function pickupKind(delivery: Delivery) {
  return delivery.pickupWindow === "schedule" && delivery.scheduledAt
    ? "Scheduled for"
    : "ETA"
}

function trackUrl(trackingId: string) {
  return `${getAppUrl()}/track?id=${encodeURIComponent(trackingId)}`
}

function liveTrackUrl(delivery: Delivery) {
  return delivery.tookanTrackingLink?.trim() || null
}

function buildEmailHtml(params: {
  title: string
  greeting: string
  intro: string
  delivery: Delivery
}) {
  const { delivery } = params
  const url = trackUrl(delivery.trackingId)
  const live = liveTrackUrl(delivery)
  const logo = getLogoUrl()
  const home = getAppUrl()
  const code = escapeHtml(delivery.trackingId)
  const pickup = escapeHtml(displayAddress(delivery.pickup))
  const dropoff = escapeHtml(displayAddress(delivery.dropoff))
  const liveBlock = live
    ? `<p style="margin:12px 0 0;font-size:13px;text-align:center;">
        <a href="${escapeHtml(live)}" style="color:#fe5200;text-decoration:none;font-weight:600;">Live rider map</a>
      </p>`
    : ""

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <title>${escapeHtml(params.title)}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f6;${FONT};color:#0a2540;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Tracking ${code} · ${escapeHtml(pickupLabel(delivery))}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f6;">
    <tr>
      <td align="center" style="padding:32px 14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="left" style="padding:0 4px 18px;">
              <a href="${escapeHtml(home)}" style="text-decoration:none;">
                <img src="${escapeHtml(logo)}" width="88" height="auto" alt="Diatel" style="display:block;width:88px;height:auto;border:0;" />
              </a>
            </td>
          </tr>

          <!-- Main -->
          <tr>
            <td style="background:#ffffff;border-radius:18px;overflow:hidden;">

              <!-- Intro -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 28px 0;${FONT}">
                    <p style="margin:0;font-size:15px;line-height:1.5;color:#0a2540;">
                      ${escapeHtml(params.greeting)}
                    </p>
                    <p style="margin:8px 0 0;font-size:15px;line-height:1.55;color:#5a6a7e;">
                      ${escapeHtml(params.intro)}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Tracking -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:24px 28px 0;${FONT}">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fb;border-radius:12px;">
                      <tr>
                        <td style="padding:18px 20px;">
                          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#8792a2;">
                            Tracking code
                          </p>
                          <p style="margin:8px 0 0;font-size:30px;line-height:1;font-weight:700;letter-spacing:0.08em;color:#0a2540;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">
                            ${code}
                          </p>
                          <p style="margin:12px 0 0;font-size:13px;line-height:1.4;color:#5a6a7e;">
                            <span style="color:#8792a2;">${escapeHtml(pickupKind(delivery))}</span>
                            &nbsp;·&nbsp;
                            <strong style="color:#0a2540;font-weight:600;">${escapeHtml(pickupLabel(delivery))}</strong>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Route -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:22px 28px 0;${FONT}">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="20" valign="top" style="padding-top:2px;">
                          <div style="width:10px;height:10px;border-radius:50%;background:#fe5200;"></div>
                          <div style="width:2px;height:28px;margin:4px 0 4px 4px;background:#e6ebf1;"></div>
                          <div style="width:10px;height:10px;border-radius:50%;background:#0a2540;"></div>
                        </td>
                        <td valign="top">
                          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#8792a2;">Pickup</p>
                          <p style="margin:4px 0 0;font-size:14px;line-height:1.45;font-weight:600;color:#0a2540;">${pickup}</p>
                          <p style="margin:18px 0 0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#8792a2;">Drop-off</p>
                          <p style="margin:4px 0 0;font-size:14px;line-height:1.45;font-weight:600;color:#0a2540;">${dropoff}</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#5a6a7e;">${escapeHtml(delivery.recipientName)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Facts -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:24px 28px 0;${FONT}">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eef2f6;">
                      <tr>
                        <td width="33%" style="padding:16px 8px 0 0;vertical-align:top;">
                          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#8792a2;">Package</p>
                          <p style="margin:6px 0 0;font-size:14px;font-weight:600;color:#0a2540;">${escapeHtml(delivery.packageType)}</p>
                          <p style="margin:2px 0 0;font-size:12px;color:#5a6a7e;text-transform:capitalize;">${escapeHtml(delivery.size)}</p>
                        </td>
                        <td width="33%" style="padding:16px 8px 0;vertical-align:top;">
                          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#8792a2;">Fare</p>
                          <p style="margin:6px 0 0;font-size:14px;font-weight:600;color:#0a2540;">GHS ${delivery.fareGhs}</p>
                        </td>
                        <td width="33%" style="padding:16px 0 0 8px;vertical-align:top;">
                          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#8792a2;">Sender</p>
                          <p style="margin:6px 0 0;font-size:14px;font-weight:600;color:#0a2540;">${escapeHtml(delivery.senderName)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px;${FONT}">
                    <a href="${escapeHtml(url)}" style="display:block;padding:14px 18px;background:#fe5200;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;text-align:center;border-radius:10px;">
                      Track ${code}
                    </a>
                    ${liveBlock}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 8px 0;${FONT}">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#8792a2;text-align:center;">
                Diatel Delivery · Accra
              </p>
              <p style="margin:8px 0 0;font-size:11px;line-height:1.5;color:#a3acb9;text-align:center;word-break:break-all;">
                ${escapeHtml(url)}
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

function buildText(params: {
  greeting: string
  intro: string
  delivery: Delivery
}) {
  const url = trackUrl(params.delivery.trackingId)
  const live = liveTrackUrl(params.delivery)
  return [
    params.greeting,
    "",
    params.intro,
    "",
    `Tracking code: ${params.delivery.trackingId}`,
    `${pickupKind(params.delivery)}: ${pickupLabel(params.delivery)}`,
    `Pickup: ${displayAddress(params.delivery.pickup)}`,
    `Drop-off: ${displayAddress(params.delivery.dropoff)}`,
    `Recipient: ${params.delivery.recipientName}`,
    `Package: ${params.delivery.packageType} · ${params.delivery.size}`,
    `Fare: GHS ${params.delivery.fareGhs}`,
    `Track: ${url}`,
    live ? `Live rider map: ${live}` : null,
    "",
    "Diatel Delivery",
  ]
    .filter((line) => line !== null)
    .join("\n")
}

async function sendOne(params: {
  to: string
  subject: string
  html: string
  text: string
  trackingId: string
}) {
  const resend = getResend()
  const from = getResendFrom()
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing — skipped", params.to)
    return { ok: false as const, reason: "missing_key" }
  }

  console.log(
    `[email] sending ${params.trackingId} → ${params.to} from ${from}`,
  )

  const { data, error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    headers: {
      "X-Entity-Ref-ID": params.trackingId,
    },
  })

  if (error) {
    console.error("[email] Resend failed", {
      to: params.to,
      trackingId: params.trackingId,
      from,
      error,
    })
    return { ok: false as const, reason: error.message }
  }

  console.log("[email] sent", {
    to: params.to,
    trackingId: params.trackingId,
    id: data?.id,
  })
  return { ok: true as const, id: data?.id }
}

function buildAdminOrderHtml(delivery: Delivery) {
  const url = trackUrl(delivery.trackingId)
  const live = liveTrackUrl(delivery)
  const logo = getLogoUrl()
  const home = getAppUrl()
  const code = escapeHtml(delivery.trackingId)
  const pickup = escapeHtml(displayAddress(delivery.pickup))
  const dropoff = escapeHtml(displayAddress(delivery.dropoff))
  const tookan = delivery.tookanJobId
    ? `Pickup #${delivery.tookanPickupJobId ?? "—"} · Delivery #${delivery.tookanDeliveryJobId ?? delivery.tookanJobId}`
    : "Not created yet"
  const liveLine = live
    ? `<p style="margin:6px 0 0;font-size:13px;"><a href="${escapeHtml(live)}" style="color:#fe5200;text-decoration:none;font-weight:600;">Open Tookan map</a></p>`
    : ""

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <title>New order ${code}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f6;${FONT};color:#0a2540;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f6;">
    <tr>
      <td align="center" style="padding:32px 14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <tr>
            <td align="left" style="padding:0 4px 18px;">
              <a href="${escapeHtml(home)}" style="text-decoration:none;">
                <img src="${escapeHtml(logo)}" width="88" alt="Diatel" style="display:block;width:88px;height:auto;border:0;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:18px;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 28px 0;${FONT}">
                    <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#8792a2;">
                      New order
                    </p>
                    <h1 style="margin:10px 0 0;font-size:24px;line-height:1.2;font-weight:600;letter-spacing:-0.02em;color:#0a2540;">
                      ${code} needs a rider
                    </h1>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:22px 28px 0;${FONT}">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fb;border-radius:12px;">
                      <tr>
                        <td style="padding:18px 20px;">
                          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#8792a2;">Tracking code</p>
                          <p style="margin:8px 0 0;font-size:28px;line-height:1;font-weight:700;letter-spacing:0.06em;color:#0a2540;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">${code}</p>
                          <p style="margin:12px 0 0;font-size:13px;color:#5a6a7e;">
                            ${escapeHtml(pickupKind(delivery))} · <strong style="color:#0a2540;">${escapeHtml(pickupLabel(delivery))}</strong>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:22px 28px 0;${FONT}">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="20" valign="top" style="padding-top:2px;">
                          <div style="width:10px;height:10px;border-radius:50%;background:#fe5200;"></div>
                          <div style="width:2px;height:28px;margin:4px 0 4px 4px;background:#e6ebf1;"></div>
                          <div style="width:10px;height:10px;border-radius:50%;background:#0a2540;"></div>
                        </td>
                        <td valign="top">
                          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#8792a2;">Pickup</p>
                          <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#0a2540;">${pickup}</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#5a6a7e;">${escapeHtml(delivery.senderName)} · ${escapeHtml(delivery.senderPhone)}</p>
                          <p style="margin:18px 0 0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#8792a2;">Drop-off</p>
                          <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#0a2540;">${dropoff}</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#5a6a7e;">${escapeHtml(delivery.recipientName)} · ${escapeHtml(delivery.recipientPhone)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:22px 28px 0;${FONT}">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eef2f6;">
                      <tr>
                        <td width="50%" style="padding:16px 8px 0 0;vertical-align:top;">
                          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#8792a2;">Package</p>
                          <p style="margin:6px 0 0;font-size:14px;font-weight:600;color:#0a2540;">${escapeHtml(delivery.packageType)} · ${escapeHtml(delivery.size)}</p>
                        </td>
                        <td width="50%" style="padding:16px 0 0 8px;vertical-align:top;">
                          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#8792a2;">Fare</p>
                          <p style="margin:6px 0 0;font-size:14px;font-weight:600;color:#0a2540;">GHS ${delivery.fareGhs}</p>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding:16px 0 0;vertical-align:top;">
                          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#8792a2;">Tookan</p>
                          <p style="margin:6px 0 0;font-size:14px;font-weight:600;color:#0a2540;">${escapeHtml(tookan)}</p>
                          ${liveLine}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px;${FONT}">
                    <a href="${escapeHtml(url)}" style="display:block;padding:14px 18px;background:#fe5200;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;text-align:center;border-radius:10px;">
                      Open tracking ${code}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 8px 0;${FONT}">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#8792a2;text-align:center;">
                Diatel Delivery · Accra · New web order
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

async function sendAdminOrderNotification(delivery: Delivery) {
  const pickup = displayAddress(delivery.pickup)
  const dropoff = displayAddress(delivery.dropoff)
  const live = liveTrackUrl(delivery)
  const text = [
    `New Diatel order ${delivery.trackingId}`,
    "",
    `Pickup: ${pickup}`,
    `Sender: ${delivery.senderName} · ${delivery.senderPhone}`,
    `Drop-off: ${dropoff}`,
    `Recipient: ${delivery.recipientName} · ${delivery.recipientPhone}`,
    `Package: ${delivery.packageType} · ${delivery.size}`,
    `Fare: GHS ${delivery.fareGhs}`,
    `${pickupKind(delivery)}: ${pickupLabel(delivery)}`,
    `Tookan: ${delivery.tookanJobId ?? "not created"}`,
    live ? `Live rider map: ${live}` : null,
    `Track: ${trackUrl(delivery.trackingId)}`,
  ]
    .filter((line) => line !== null)
    .join("\n")

  return sendOne({
    to: ORDERS_NOTIFY_EMAIL,
    trackingId: delivery.trackingId,
    subject: `[New order] ${delivery.trackingId} · ${pickup} → ${dropoff}`,
    text,
    html: buildAdminOrderHtml(delivery),
  })
}

export async function sendDeliveryBookingEmails(delivery: Delivery) {
  if (!delivery.trackingId) {
    console.error("[email] missing trackingId — refusing to send", delivery.id)
    return
  }

  const jobs: Promise<unknown>[] = [
    sendAdminOrderNotification(delivery),
  ]

  if (delivery.senderEmail) {
    const greeting = `Hi ${firstName(delivery.senderName)},`
    const intro = `Your package to ${delivery.recipientName} is booked.`
    jobs.push(
      sendOne({
        to: delivery.senderEmail,
        trackingId: delivery.trackingId,
        subject: `[${delivery.trackingId}] Your Diatel delivery is booked`,
        text: buildText({ greeting, intro, delivery }),
        html: buildEmailHtml({
          title: "Your delivery is booked",
          greeting,
          intro,
          delivery,
        }),
      }),
    )
  }

  if (delivery.recipientEmail) {
    const greeting = `Hi ${firstName(delivery.recipientName)},`
    const intro = `${delivery.senderName} booked a Diatel delivery for you.`
    jobs.push(
      sendOne({
        to: delivery.recipientEmail,
        trackingId: delivery.trackingId,
        subject: `[${delivery.trackingId}] A Diatel delivery is coming`,
        text: buildText({ greeting, intro, delivery }),
        html: buildEmailHtml({
          title: "A package is on the way",
          greeting,
          intro,
          delivery,
        }),
      }),
    )
  }

  await Promise.allSettled(jobs)
}
