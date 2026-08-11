import { Router, Request, Response } from 'express';
import axios from 'axios';
import https from 'https';
import { authMiddleware } from '../middleware/auth.js';
import { claimMarketplaceSession } from '../services/marketplaceSession.js';

const router = Router();

// The body the partner plugin sends: the product + VAT-inclusive price to charge.
interface AddSaleLineBody {
  productId?: string;     // catalogue product the line is priced against (from plugin settings)
  productName: string;
  unitPrice: number;      // gross, VAT inclusive
  currencyCode?: string;
  quantity?: number;
  externalRef?: string;
  taxAmount?: number;
  taxRate?: number;
  taxTypeId?: string;     // optional A3 tax type the VAT is recorded against (from plugin settings)
}

// The Marketplace API open-sale projection (a subset — see A3 OpenSaleDto).
interface MarketplaceOpenSale {
  id: string;
  items: unknown[];
  outOfPocket?: { amount: number; currency: string } | null;
}

// The Marketplace API partner-line result.
interface MarketplacePartnerLineResult {
  saleId?: string;
}

// The body the shell sends to open a new sale: the picked products (all details optional —
// the Marketplace API fills them from its configured dev defaults).
interface CreateSaleBody {
  patientId?: string;
  items?: Array<{
    productType?: string;   // "Spectacle" | "ContactLens"
    productId?: string;
    productName?: string;
    unitPrice?: number;
    quantity?: number;
  }>;
}

// The Marketplace API create-open-sale result.
interface MarketplaceCreateSaleResult {
  saleId?: string;
}

const isValidSaleId = (id: string) => !!id && /^[A-Za-z0-9_-]+$/.test(id);

const acuitasApiUrl = () => process.env.MARKETPLACE_API_BASE_URL || 'https://euint.oh.ocuco.com';

// The Marketplace API runs behind a self-signed cert in the int environment, matching
// the pattern used by the patients route.
const acuitasAgent = () => new https.Agent({ rejectUnauthorized: false });

/**
 * POST /api/sales
 * Opens a new sale from the picked products and returns its identifier.
 *
 * Claims the Marketplace session with the caller's PST, then opens a sale via the Marketplace
 * API (POST api/v1/sales, which proxies A3 POST api/sales?transact=false — ACP-4135). Product
 * details are optional; the Marketplace API fills them from its configured dev defaults.
 */
router.post('/sales', authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = (req as any).token;
    const body = req.body as CreateSaleBody;

    const claimed = await claimMarketplaceSession(token);
    if (!claimed) {
      return res.status(401).json({
        error: { message: 'Marketplace API status: Unauthorized access', statusCode: 401, timestamp: new Date().toISOString() },
      });
    }

    try {
      const response = await axios.post<{ data: MarketplaceCreateSaleResult }>(
        `${acuitasApiUrl()}/api/v1/sales`,
        { patientId: body.patientId, items: body.items ?? [] },
        {
          httpsAgent: acuitasAgent(),
          headers: { pst: `${token}`, 'Content-Type': 'application/json' },
          timeout: 15000,
        }
      );

      const saleId = response.data.data?.saleId;

      res.json({ success: true, data: { saleId }, timestamp: new Date().toISOString() });
    } catch (apiError: any) {
      return respondUpstreamError(res, apiError, 'Failed to open a sale via the Marketplace API');
    }
  } catch (error: any) {
    console.error('Route error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', statusCode: 500, timestamp: new Date().toISOString() },
    });
  }
});

/**
 * GET /api/sales/:id
 * Returns the current cart/order for a sale.
 *
 * Claims the Marketplace session with the caller's PST, then reads A3's open sale
 * via the Marketplace API (GET api/v1/sales/{id}/open, which proxies A3
 * GET api/sales/open/{id}) and maps it to the cart shape the plugin expects.
 */
router.get('/sales/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const token = (req as any).token;

    if (!isValidSaleId(id)) {
      return res.status(400).json({
        error: { message: 'A valid sale identifier is required', statusCode: 400, timestamp: new Date().toISOString() },
      });
    }

    const claimed = await claimMarketplaceSession(token);
    if (!claimed) {
      return res.status(401).json({
        error: { message: 'Marketplace API status: Unauthorized access', statusCode: 401, timestamp: new Date().toISOString() },
      });
    }

    try {
      const response = await axios.get<{ data: MarketplaceOpenSale }>(
        `${acuitasApiUrl()}/api/v1/sales/${encodeURIComponent(id)}/open`,
        {
          httpsAgent: acuitasAgent(),
          headers: { pst: `${token}` },
          timeout: 10000,
        }
      );

      const sale = response.data.data;
      const cart = {
        saleId: sale.id ?? id,
        items: sale.items ?? [],
        totalValue: sale.outOfPocket?.amount ?? 0,
        currencyCode: sale.outOfPocket?.currency ?? 'EUR',
      };

      res.json({ success: true, data: cart, timestamp: new Date().toISOString() });
    } catch (apiError: any) {
      return respondUpstreamError(res, apiError, 'Failed to fetch the open sale from the Marketplace API');
    }
  } catch (error: any) {
    console.error('Route error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', statusCode: 500, timestamp: new Date().toISOString() },
    });
  }
});

/**
 * POST /api/sales/:id/lines
 * Adds a partner, dynamically-priced line to an open sale.
 *
 * Claims the Marketplace session with the caller's PST, then calls A3's partner-line
 * endpoint via the Marketplace API (POST api/v1/sales/{id}/partnerLine, which proxies
 * A3 POST api/sales/{saleId}/partnerLine — ACP-4135).
 */
router.post('/sales/:id/lines', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const token = (req as any).token;
    const body = req.body as AddSaleLineBody;

    if (!isValidSaleId(id)) {
      return res.status(400).json({
        error: { message: 'A valid sale identifier is required', statusCode: 400, timestamp: new Date().toISOString() },
      });
    }

    if (!body || !body.productName || typeof body.unitPrice !== 'number') {
      return res.status(400).json({
        error: { message: 'productName and a numeric unitPrice are required', statusCode: 400, timestamp: new Date().toISOString() },
      });
    }

    const claimed = await claimMarketplaceSession(token);
    if (!claimed) {
      return res.status(401).json({
        error: { message: 'Marketplace API status: Unauthorized access', statusCode: 401, timestamp: new Date().toISOString() },
      });
    }

    const currencyCode = body.currencyCode ?? 'EUR';
    const externalRef = body.externalRef ?? `partner-${Date.now()}`;
    const quantity = body.quantity ?? 1;

    try {
      const response = await axios.post<{ data: MarketplacePartnerLineResult }>(
        `${acuitasApiUrl()}/api/v1/sales/${encodeURIComponent(id)}/partnerLine`,
        {
          productId: body.productId,
          productName: body.productName,
          unitPrice: body.unitPrice,
          currencyCode,
          quantity,
          externalRef,
          taxAmount: body.taxAmount,
          taxRate: body.taxRate,
          taxTypeId: body.taxTypeId,
        },
        {
          httpsAgent: acuitasAgent(),
          headers: { pst: `${token}`, 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      // The Marketplace API returns only the saleId; echo a full line built from the
      // values submitted plus the returned saleId.
      const addedLine = {
        saleId: response.data.data?.saleId ?? id,
        externalRef,
        productName: body.productName,
        unitPrice: body.unitPrice,
        currencyCode,
        quantity,
      };

      console.log('Added partner sale line:', JSON.stringify(addedLine));

      res.json({ success: true, data: addedLine, timestamp: new Date().toISOString() });
    } catch (apiError: any) {
      return respondUpstreamError(res, apiError, 'Failed to add the partner line via the Marketplace API');
    }
  } catch (error: any) {
    console.error('Route error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', statusCode: 500, timestamp: new Date().toISOString() },
    });
  }
});

// Maps an axios error from the Marketplace API onto a client response, mirroring the
// patients route's upstream error handling.
function respondUpstreamError(res: Response, apiError: any, details: string) {
  console.error('Marketplace API error:', apiError.message);

  if (apiError.response) {
    const statusCode = apiError.response.status;
    const message = apiError.response.data?.message || 'Error calling the Marketplace API';
    return res.status(statusCode).json({
      error: { message, statusCode, timestamp: new Date().toISOString(), details },
    });
  }

  if (apiError.request) {
    return res.status(503).json({
      error: { message: 'Marketplace API is unavailable', statusCode: 503, timestamp: new Date().toISOString(), details },
    });
  }

  return res.status(500).json({
    error: { message: 'Internal server error', statusCode: 500, timestamp: new Date().toISOString(), details },
  });
}

export { router as saleRouter };
