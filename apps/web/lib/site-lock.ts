export function isSiteLocked() {
  return process.env.SITE_LOCKED !== "false"
}
