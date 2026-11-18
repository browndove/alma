import { afterEach, describe, expect, it, vi } from "vitest"

import { GET } from "./route"

function search(q: string) {
  return GET(new Request(`http://test/api/geocode/search?q=${encodeURIComponent(q)}`))
}

describe("GET /api/geocode/search", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns 502 when every Nominatim lookup fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("rate limited", { status: 429 })),
    )
    const response = await search("Adenta")
    expect(response.status).toBe(502)
  })

  it("returns an empty list when Nominatim answers with no matches", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json([])))
    const response = await search("Nowhere place")
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.results).toEqual([])
  })
})
