/** Site is available unless SITE_LOCKED is explicitly "true". */
export function isSiteLocked() {
  return process.env.SITE_LOCKED === "true"
}
