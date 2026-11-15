import { listOpsAgents } from "@/lib/deliveries/service"
import { isOpsAuthorized } from "@/lib/ops-auth"
import { jsonError, jsonOk, siteLockResponse } from "@/lib/api"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const locked = siteLockResponse()
  if (locked) return locked
  if (!isOpsAuthorized(request)) {
    return jsonError(
      process.env.DELIVERIES_ADMIN_SECRET?.trim()
        ? "Unauthorized"
        : "Ops secret not configured (set DELIVERIES_ADMIN_SECRET)",
      401,
    )
  }

  const agents = await listOpsAgents()
  return jsonOk({ agents })
}
