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

import axios from 'axios';

/**
 * Claims the marketplace session using the provided plugin session ticket (PST).
 *
 * Shared by all routes that need an authenticated Acuitas session so the
 * claim logic (including the "ticket.replayed" handling) lives in one place.
 *
 * Returns false when the Marketplace API refuses the claim. When no response arrives
 * (DNS, refused connection, TLS failure, timeout) it throws the AxiosError, so the
 * caller can answer 502 rather than report a connection problem as an auth failure.
 */
// The claim triggers the Marketplace API's PST validation, which on a cold instance does a
// first-time OIDC/JWKS discovery against the STS plus a per-request tenant subscription lookup.
// That easily exceeds a few seconds, so keep the timeout generous (and overridable via env).
// A too-short timeout aborts the connection mid-validation, surfacing server-side as a cancelled
// "PST validation failed" rather than a real auth failure.
const CLAIM_TIMEOUT_MS = Number(process.env.MARKETPLACE_SESSION_CLAIM_TIMEOUT_MS) || 30000;

// The claim must name the plugin the PST was issued for, or the Marketplace API answers
// 400 "ticket.plugin_id_mismatch". PLUGIN_ID says which plugin this backend is; when it is unset we
// read the ticket's own plugin_id rather than guessing a name.
function pluginIdForTicket(ticket: string): string {
  const configured = process.env.PLUGIN_ID?.trim();
  if (configured) return configured;

  const payload = ticket.split('.')[1];
  if (!payload) throw new Error('The PST is not a JWT, and PLUGIN_ID is not set');

  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { plugin_id?: string };
  if (!claims.plugin_id) throw new Error('The PST has no plugin_id claim, and PLUGIN_ID is not set');

  return claims.plugin_id;
}

export async function claimMarketplaceSession(ticket: string): Promise<boolean> {
  try {
    const acuitasApiUrl = process.env.MARKETPLACE_API_BASE_URL || 'https://euint.oh.ocuco.com';
    console.info('acuitasApiUrl', acuitasApiUrl);

    const pluginId = encodeURIComponent(pluginIdForTicket(ticket));
    const response = await axios.post(
      `${acuitasApiUrl}/api/v1/marketplace/plugins/${pluginId}/session/claim`,
      {},
      {
        headers: {
          pst: `${ticket}`,
        },
        timeout: CLAIM_TIMEOUT_MS,
      },
    );
    return response.status === 200;
  } catch (error) {
    if (error instanceof axios.AxiosError && error.response) {
      // A replayed ticket is returned by the server as a 400 with the plain string
      // body "ticket.replayed" (not a JSON error object). This is expected when a PST
      // is claimed more than once, so treat it as a valid session rather than an error.
      const responseData = error.response.data;
      const errorCode = typeof responseData === 'string' ? responseData : responseData?.error;
      if (errorCode === 'ticket.replayed') {
        console.info('Ticket has already been claimed (ticket.replayed); continuing with valid session.');
        return true;
      }

      console.error('Acuitas API error during session claim:', error.response.status, responseData);
      return false;
    } else if (axios.isAxiosError(error)) {
      // No response: the claim never reached the Marketplace API. A TLS error such as
      // SELF_SIGNED_CERT_IN_CHAIN usually means Node does not trust the system CA store
      // (start it with NODE_OPTIONS=--use-system-ca).
      console.error('Could not reach the Marketplace API to claim the session:', error.code, error.message);
      throw error;
    } else {
      console.error('Error claiming marketplace session:', error);
    }
    return false;
  }
}
