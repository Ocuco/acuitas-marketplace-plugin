import { Router, Request, Response } from 'express';
import axios from 'axios';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Interface for image data
interface ImageData {
  id: string;
  fileName: string;
  url?: string;
  metadata?: any;
}

// Interface for Acuitas API response
interface AcuitasImageResponse {
  id: string;
  fileName: string;
  downloadUrl: string;
  metadata: any;
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

    // Call Acuitas Marketplace API to get image data
    const acuitasApiUrl = process.env.ACUITAS_API_BASE_URL || 'https://api.acuitas.com';
    
    console.log(`Fetching image data for identifier: ${identifier}`);
    
    try {
      const response = await axios.get<AcuitasImageResponse>(
        `${acuitasApiUrl}/medical-images/${identifier}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      const imageData: ImageData = {
        id: response.data.id,
        fileName: response.data.fileName,
        url: response.data.downloadUrl,
        metadata: response.data.metadata
      };

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

/**
 * GET /api/images
 * Lists available images (optional endpoint for testing)
 */
router.get('/images', authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = (req as any).token;
    const acuitasApiUrl = process.env.ACUITAS_API_BASE_URL || 'https://api.acuitas.com';
    
    console.log('Fetching image list');
    
    try {
      const response = await axios.get(
        `${acuitasApiUrl}/medical-images`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (apiError: any) {
      console.error('Acuitas API error:', apiError.message);
      
      if (apiError.response) {
        const statusCode = apiError.response.status;
        const message = apiError.response.data?.message || 'Error fetching images from Acuitas API';
        
        return res.status(statusCode).json({
          error: {
            message,
            statusCode,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        return res.status(503).json({
          error: {
            message: 'Acuitas API is unavailable',
            statusCode: 503,
            timestamp: new Date().toISOString()
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
