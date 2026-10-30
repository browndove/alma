import { getAppUrl, getLogoUrl, getResend, getResendFrom } from "./resend"

export const CONTACT_INBOX =
  process.env.CONTACT_TO_EMAIL?.trim() || "hrdiateldelivery@gmail.com"

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

const TOPIC_LABELS: Record<string, string> = {
  support: "Delivery support",
  business: "Business",
  riders: "Riders",
  press: "Press",
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

export type ContactEnquiry = {
  topic: string
  name: string
  email: string
  phone?: string
  message: string
}

function buildContactHtml(enquiry: ContactEnquiry, topicLabel: string) {
  const logo = getLogoUrl()
  const home = getAppUrl()
  const phone = enquiry.phone?.trim()
  const safeMessage = escapeHtml(enquiry.message).replaceAll("\n", "<br />")
  const mailto = `mailto:${encodeURIComponent(enquiry.email)}?subject=${encodeURIComponent(`Re: ${topicLabel} enquiry`)}`

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <title>${escapeHtml(topicLabel)} enquiry</title>
</head>
<body style="margin:0;padding:0;background:#eef2f6;${FONT};color:#0a2540;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(topicLabel)} from ${escapeHtml(enquiry.name)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f6;">
    <tr>
      <td align="center" style="padding:32px 14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <tr>
            <td align="left" style="padding:0 4px 18px;">
              <a href="${escapeHtml(home)}" style="text-decoration:none;">
                <img
                  src="${escapeHtml(logo)}"
                  width="88"
                  height="auto"
                  alt="Diatel"
                  style="display:block;width:88px;height:auto;border:0;"
                />
              </a>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;border-radius:18px;overflow:hidden;">

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 28px 0;${FONT}">
                    <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#8792a2;">
                      ${escapeHtml(topicLabel)}
                    </p>
                    <h1 style="margin:10px 0 0;font-size:24px;line-height:1.2;font-weight:600;letter-spacing:-0.02em;color:#0a2540;">
                      New message from ${escapeHtml(enquiry.name)}
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
                          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#8792a2;">
                            Contact
                          </p>
                          <p style="margin:10px 0 0;font-size:16px;font-weight:600;color:#0a2540;">
                            ${escapeHtml(enquiry.name)}
                          </p>
                          <p style="margin:6px 0 0;font-size:14px;line-height:1.5;color:#5a6a7e;">
                            <a href="mailto:${escapeHtml(enquiry.email)}" style="color:#fe5200;text-decoration:none;">
                              ${escapeHtml(enquiry.email)}
                            </a>
                          </p>
                          ${
                            phone
                              ? `<p style="margin:4px 0 0;font-size:14px;color:#5a6a7e;">${escapeHtml(phone)}</p>`
                              : ""
                          }
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:22px 28px 0;${FONT}">
                    <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#8792a2;">
                      Message
                    </p>
                    <p style="margin:12px 0 0;font-size:15px;line-height:1.65;color:#0a2540;">
                      ${safeMessage}
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px;${FONT}">
                    <a href="${escapeHtml(mailto)}" style="display:block;padding:14px 18px;background:#fe5200;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;text-align:center;border-radius:10px;">
                      Reply to ${escapeHtml(enquiry.name.split(/\s+/)[0] || enquiry.name)}
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="padding:22px 8px 0;${FONT}">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#8792a2;text-align:center;">
                Diatel Delivery · Accra
              </p>
              <p style="margin:6px 0 0;font-size:11px;line-height:1.5;color:#a3acb9;text-align:center;">
                Sent from the website contact form
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

export async function sendContactEnquiry(enquiry: ContactEnquiry) {
  const resend = getResend()
  const from = getResendFrom()
  if (!resend) {
    return { ok: false as const, reason: "Email is not configured." }
  }

  const topicLabel = TOPIC_LABELS[enquiry.topic] || enquiry.topic
  const phone = enquiry.phone?.trim() || "—"

  const text = [
    `Topic: ${topicLabel}`,
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    `Phone: ${phone}`,
    "",
    enquiry.message,
    "",
    "— Diatel Delivery contact form",
  ].join("\n")

  const { data, error } = await resend.emails.send({
    from,
    to: CONTACT_INBOX,
    replyTo: enquiry.email,
    subject: `[${topicLabel}] ${enquiry.name}`,
    text,
    html: buildContactHtml(enquiry, topicLabel),
  })

  if (error) {
    console.error("[email] contact failed", error)
    return { ok: false as const, reason: error.message }
  }

  console.log("[email] contact sent", { id: data?.id, topic: enquiry.topic })
  return { ok: true as const, id: data?.id }
}
