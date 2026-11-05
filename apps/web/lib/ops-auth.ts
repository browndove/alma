export function getDeliveriesAdminSecret() {
  return process.env.DELIVERIES_ADMIN_SECRET?.trim() || ""
}

export function isOpsAuthorized(request: Request) {
  const secret = getDeliveriesAdminSecret()
  if (!secret) {
    // Misconfigured env — never treat an empty secret as “open”.
    console.error(
      "[ops] DELIVERIES_ADMIN_SECRET is empty; refusing all ops requests",
    )
    return false
  }
  const header = request.headers.get("x-admin-secret")?.trim()
  return Boolean(header && header === secret)
}
