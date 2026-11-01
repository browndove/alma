import { listOpsAgents } from "@/lib/deliveries/service"
import { isOpsAuthorized } from "@/lib/ops-auth"
import { jsonError, jsonOk } from "@/lib/api"

export const runtime = "nodejs"

export async function GET(request: Request) {
  if (!isOpsAuthorized(request)) {
    return jsonError("Unauthorized", 401)
  }

  const agents = await listOpsAgents()
  return jsonOk({ agents })
}
