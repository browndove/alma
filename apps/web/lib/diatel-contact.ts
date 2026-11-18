/** Official Diatel phone & WhatsApp (Ghana). */
export const DIATEL_PHONE_DISPLAY = "+233 59 592 9037"
export const DIATEL_PHONE_E164 = "+233595929037"
export const DIATEL_PHONE_DIGITS = "233595929037"

export const DIATEL_TEL_HREF = `tel:${DIATEL_PHONE_E164}`
export const DIATEL_WHATSAPP_HREF = `https://wa.me/${DIATEL_PHONE_DIGITS}`

export function diatelWhatsAppHref(message?: string) {
  if (!message?.trim()) return DIATEL_WHATSAPP_HREF
  return `${DIATEL_WHATSAPP_HREF}?text=${encodeURIComponent(message.trim())}`
}
