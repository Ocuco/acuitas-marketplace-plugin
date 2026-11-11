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

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { authMiddleware } from '../middleware/auth.js';
import { claimMarketplaceSession } from '../services/marketplaceSession.js';

const router = Router();

// A lookup value (id + display text) as used throughout the patient details payload
interface LookupValue {
  id: string;
  text: string;
}

// Subset of the Acuitas patient details response. Additional fields are passed
// through untouched via the index signature.
interface PatientDetails {
  id: string;
  type: string;
  title?: LookupValue;
  firstName?: string;
  middleName?: string;
  surname?: string;
  maidenName?: string;
  infixName?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: LookupValue;
  maritalStatus?: LookupValue;
  occupation?: LookupValue;
  spokenLanguage?: LookupValue;
  patientStatus?: string;
  [key: string]: unknown;
}

// The Acuitas API wraps the patient object in a `data` envelope.
interface AcuitasPatientResponse {
  data: PatientDetails;
}

/**
 * GET /api/patients/:id/details
 * Retrieves patient details by identifier from the Acuitas Marketplace API.
 */
router.get('/patients/:id/details', authMiddleware, async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const token = (req as any).token;

    // Validate the identifier to prevent upstream path injection / SSRF.
    // Patient ids are GUIDs or A3-style ids (alphanumerics, hyphens, underscores).
    if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) {
      return res.status(400).json({
        error: {
          message: 'A valid patient identifier is required',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const result = await claimMarketplaceSession(token);
    console.log('Marketplace session claim result:', result);
    if (!result) {
      return res.status(401).json({
        error: {
          message: 'Marketplace API status: Unauthorized access',
          statusCode: 401,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const acuitasApiUrl = process.env.MARKETPLACE_API_BASE_URL || 'https://euint.oh.ocuco.com';

    console.log(`Fetching patient details for identifier: ${id}`);

    try {
      const response = await axios.get<AcuitasPatientResponse>(`${acuitasApiUrl}/api/v1/patients/${encodeURIComponent(id)}/details`, {
        headers: {
          pst: `${token}`,
        },
        timeout: 10000, // 10 second timeout
      });

      // Unwrap the patient object from the Acuitas `data` envelope.
      const patientDetails: PatientDetails = response.data.data;

      console.log('Successfully retrieved patient details for:', id);

      res.json({
        success: true,
        data: patientDetails,
        timestamp: new Date().toISOString(),
      });
    } catch (apiError: any) {
      console.error('Acuitas API error:', apiError.message);

      if (apiError.response) {
        // The API responded with an error status
        const statusCode = apiError.response.status;
        const message = apiError.response.data?.message || 'Error fetching patient details from Acuitas API';

        return res.status(statusCode).json({
          error: {
            message,
            statusCode,
            timestamp: new Date().toISOString(),
            details: 'Failed to fetch patient details from Acuitas Marketplace API',
          },
        });
      } else if (apiError.request) {
        // Request was made but no response received
        return res.status(503).json({
          error: {
            message: 'Acuitas API is unavailable',
            statusCode: 503,
            timestamp: new Date().toISOString(),
            details: 'Unable to connect to Acuitas Marketplace API',
          },
        });
      } else {
        // Something else went wrong
        return res.status(500).json({
          error: {
            message: 'Internal server error',
            statusCode: 500,
            timestamp: new Date().toISOString(),
            details: 'Error processing request',
          },
        });
      }
    }
  } catch (error: any) {
    console.error('Route error:', error);
    // claimMarketplaceSession throws when the claim got no response from the Marketplace API.
    if (axios.isAxiosError(error) && !error.response) {
      return res.status(502).json({
        error: { message: 'Could not reach the Marketplace API', statusCode: 502, timestamp: new Date().toISOString() },
      });
    }
    res.status(500).json({
      error: {
        message: 'Internal server error',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export { router as patientRouter };
