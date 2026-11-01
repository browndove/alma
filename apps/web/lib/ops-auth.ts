export function getDeliveriesAdminSecret() {
  return process.env.DELIVERIES_ADMIN_SECRET?.trim() || ""
}

export function isOpsAuthorized(request: Request) {
  const secret = getDeliveriesAdminSecret()
  if (!secret) return false
  const header = request.headers.get("x-admin-secret")?.trim()
  return Boolean(header && header === secret)
}
