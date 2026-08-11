import axios from 'axios';
import https from 'https';

/**
 * Claims the marketplace session using the provided plugin session ticket (PST).
 *
 * Shared by all routes that need an authenticated Acuitas session so the
 * claim logic (including the "ticket.replayed" handling) lives in one place.
 */
// The claim triggers the Marketplace API's PST validation, which on a cold instance does a
// first-time OIDC/JWKS discovery against the STS plus a per-request tenant subscription lookup.
// That easily exceeds a few seconds, so keep the timeout generous (and overridable via env).
// A too-short timeout aborts the connection mid-validation, surfacing server-side as a cancelled
// "PST validation failed" rather than a real auth failure.
const CLAIM_TIMEOUT_MS = Number(process.env.MARKETPLACE_SESSION_CLAIM_TIMEOUT_MS) || 30000;

export async function claimMarketplaceSession(ticket: string): Promise<boolean> {
  try {
    const acuitasApiUrl = process.env.MARKETPLACE_API_BASE_URL || 'https://euint.oh.ocuco.com';
    console.info('acuitasApiUrl', acuitasApiUrl);
    const agent = new https.Agent({
      rejectUnauthorized: false
    });

    const pluginId = process.env.PLUGIN_ID || 'retinalyze';
    const response = await axios.post(
      `${acuitasApiUrl}/api/v1/marketplace/plugins/${pluginId}/session/claim`,
      {},
      {
        httpsAgent: agent,
        headers: {
          'pst': `${ticket}`
        },
        timeout: CLAIM_TIMEOUT_MS
      }
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
    } else {
      console.error('Error claiming marketplace session:', error);
    }
    return false;
  }
}
