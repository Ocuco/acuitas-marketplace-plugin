/*
 * Copyright 2026 Ocuco Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Opening a sale is the host's job, not the plugin's: in Acuitas the practice opens the sale at the
// till, and the checkout plugin is only ever handed the sale id to add its line to. This shell stands
// in for that by opening the sale itself, straight against the Marketplace API — it never goes
// through the partner backend.

import { pluginIdFromPst } from './pluginIdentity';

const MARKETPLACE_API_URL = import.meta.env.VITE_MARKETPLACE_API_BASE_URL || 'https://euint.oh.ocuco.com';

// A line to open the sale with. productId is omitted on purpose: the Marketplace API fills it from its
// configured default product for the line's productType.
export interface HostSaleLine {
  productType: 'Spectacle' | 'ContactLens';
  productName: string;
  unitPrice: number;
  quantity: number;
}

// Every PST call needs a claimed session. The partner backend claims the same PST later; a repeat
// claim answers 400 "ticket.replayed", which still means the session is active.
async function claimSession(pst: string): Promise<void> {
  const pluginId = encodeURIComponent(pluginIdFromPst(pst));
  const response = await fetch(`${MARKETPLACE_API_URL}/api/v1/marketplace/plugins/${pluginId}/session/claim`, {
    method: 'POST',
    headers: { pst },
  });

  if (response.ok) return;

  const body = await response.text();
  if (response.status === 400 && body.includes('ticket.replayed')) return;

  throw new Error(`Failed to claim the Marketplace session (HTTP ${response.status})`);
}

// Opens a sale for the Marketplace API's configured patient with the given lines, and returns its id.
export async function openHostSale(pst: string, lines: HostSaleLine[]): Promise<string> {
  if (!pst) throw new Error('VITE_PST is not set');

  await claimSession(pst);

  const response = await fetch(`${MARKETPLACE_API_URL}/api/v1/sales`, {
    method: 'POST',
    headers: { pst, 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: lines }),
  });

  if (!response.ok) throw new Error(`Failed to open sale (HTTP ${response.status})`);

  const result = await response.json();
  const saleId = result?.data?.saleId as string | undefined;
  if (!saleId) throw new Error('No saleId returned by the Marketplace API');

  return saleId;
}
