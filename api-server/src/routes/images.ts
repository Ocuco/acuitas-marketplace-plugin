import { Router, Request, Response } from 'express';
import axios from 'axios';
import https from 'https';
import { authMiddleware } from '../middleware/auth.js';
import { claimMarketplaceSession } from '../services/marketplaceSession.js';

const router = Router();

// Interface for image data
interface ImageData {
  id: string;
  fileMimeType: string;
  originalFile: string;
  type: string;
}

// Interface for Acuitas API response
interface AcuitasImageResponse {
  data: ImageData;
}

/**
 * GET /api/images/:identifier
 * Retrieves image information by identifier from Acuitas Marketplace API
 */
router.get('/images/:identifier', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    const token = (req as any).token;

    if (!identifier) {
      return res.status(400).json({
        error: {
          message: 'Image identifier is required',
          statusCode: 400,
          timestamp: new Date().toISOString()
        }
      });
    }

    const result = await claimMarketplaceSession(token);
    console.log('Marketplace session claim result:', result);
    if (!result) {
      return res.status(401).json({
        error: {
          message: 'Marketplace API status: Unauthorized access',
          statusCode: 401,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Call Acuitas Marketplace API to get image data
    const acuitasApiUrl = process.env.ACUITAS_API_BASE_URL || 'https://euint.oh.ocuco.com';
    
    console.log(`Fetching image data for identifier: ${identifier}`);
    
    try {
      const agent = new https.Agent({
          rejectUnauthorized: false
      });
      const response = await axios.get<AcuitasImageResponse>(
        `${acuitasApiUrl}/api/v1/imaging/medicalimages/${identifier}`,
        {
          httpsAgent: agent,
          headers: {
            'pst': `${token}`
          },
          timeout: 10000 // 10 second timeout
        }
      );

      const imageData: ImageData = response.data.data;

      console.log(`Successfully retrieved image data for: ${identifier}`);

      res.json({
        success: true,
        data: imageData,
        timestamp: new Date().toISOString()
      });

    } catch (apiError: any) {
      console.error('Acuitas API error:', apiError.message);
      
      if (apiError.response) {
        // The API responded with an error status
        const statusCode = apiError.response.status;
        const message = apiError.response.data?.message || 'Error fetching image from Acuitas API';
        
        return res.status(statusCode).json({
          error: {
            message,
            statusCode,
            timestamp: new Date().toISOString(),
            details: 'Failed to fetch image from Acuitas Marketplace API'
          }
        });
      } else if (apiError.request) {
        // Request was made but no response received
        return res.status(503).json({
          error: {
            message: 'Acuitas API is unavailable',
            statusCode: 503,
            timestamp: new Date().toISOString(),
            details: 'Unable to connect to Acuitas Marketplace API'
          }
        });
      } else {
        // Something else went wrong
        return res.status(500).json({
          error: {
            message: 'Internal server error',
            statusCode: 500,
            timestamp: new Date().toISOString(),
            details: 'Error processing request'
          }
        });
      }
    }

  } catch (error: any) {
    console.error('Route error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        statusCode: 500,
        timestamp: new Date().toISOString()
      }
    });
  }
});

export { router as imageRouter };
