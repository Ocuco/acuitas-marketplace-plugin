import e, { Router, Request, Response } from 'express';
import axios from 'axios';
import https from 'https';
import { authMiddleware } from '../middleware/auth.js';

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

      console.log('Acuitas API response received', response.data);
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
        timestamp: new Date().toISOString(),
        details: error.message
      }
    });
  }
});

// create a private function to claim the marketplace session using the token
// this is to be used internally by other routes if needed
async function claimMarketplaceSession(ticket: string): Promise<boolean> {
  try {
    const acuitasApiUrl = process.env.ACUITAS_API_BASE_URL || 'https://euint.oh.ocuco.com';
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
        timeout: 5000 // 5 second timeout
      }
    );
    return response.status === 200;
  } catch (error) {
    if(error instanceof axios.AxiosError && error.response) {
      console.error('Acuitas API error during session claim:', error.response.status, error.response.data);
      console.log('request headers:', error.config?.headers);
      if(error.response?.data?.error === 'ticket.replayed') { 
        // If the ticket has already been used, we consider the session valid
        console.warn('Ticket has already been used, assuming valid session.');
        return true
      }
      return false;
    } else { 
      console.error('Error claiming marketplace session:', error);
    }
    return false;
  }
}


export { router as imageRouter };
