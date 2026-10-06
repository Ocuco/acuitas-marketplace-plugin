// Opening a sale is the host's job, not the plugin's: in Acuitas the practice opens the sale at the
// till, and the checkout plugin is only ever handed the sale id to add its line to. This shell stands
// in for that by opening the sale itself, straight against the Marketplace API — it never goes
// through the partner backend.

const MARKETPLACE_API_URL = import.meta.env.VITE_MARKETPLACE_API_BASE_URL || 'https://euint.oh.ocuco.com'

// A line to open the sale with. productId is omitted on purpose: the Marketplace API fills it from its
// configured default product for the line's productType.
export interface HostSaleLine {
  productType: 'Spectacle' | 'ContactLens'
  productName: string
  unitPrice: number
  quantity: number
}

// The PST names the plugin it was issued for; the session claim must be made for that plugin.
function pluginIdFromPst(pst: string): string {
  const payload = pst.split('.')[1]
  if (!payload) throw new Error('VITE_PST is not a JWT')

  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
  const pluginId = (JSON.parse(json) as { plugin_id?: string }).plugin_id
  if (!pluginId) throw new Error('VITE_PST has no plugin_id claim')

  return pluginId
}

// Every PST call needs a claimed session. The partner backend claims the same PST later; a repeat
// claim answers 400 "ticket.replayed", which still means the session is active.
async function claimSession(pst: string): Promise<void> {
  const pluginId = encodeURIComponent(pluginIdFromPst(pst))
  const response = await fetch(`${MARKETPLACE_API_URL}/api/v1/marketplace/plugins/${pluginId}/session/claim`, {
    method: 'POST',
    headers: { pst },
  })

  if (response.ok) return

  const body = await response.text()
  if (response.status === 400 && body.includes('ticket.replayed')) return

  throw new Error(`Failed to claim the Marketplace session (HTTP ${response.status})`)
}

// Opens a sale for the Marketplace API's configured patient with the given lines, and returns its id.
export async function openHostSale(pst: string, lines: HostSaleLine[]): Promise<string> {
  if (!pst) throw new Error('VITE_PST is not set')

  await claimSession(pst)

  const response = await fetch(`${MARKETPLACE_API_URL}/api/v1/sales`, {
    method: 'POST',
    headers: { pst, 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: lines }),
  })

  if (!response.ok) throw new Error(`Failed to open sale (HTTP ${response.status})`)

  const result = await response.json()
  const saleId = result?.data?.saleId as string | undefined
  if (!saleId) throw new Error('No saleId returned by the Marketplace API')

  return saleId
}
