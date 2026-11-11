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

import { Request, Response, NextFunction } from 'express';

// A request that has passed authMiddleware: token holds the caller's Plugin Session Token (PST).
// P types the route parameters, as in Request<{ id: string }>.
export interface AuthenticatedRequest<P = Request['params']> extends Request<P> {
  token: string;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        message: 'Authorization token required',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      },
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (!token) {
    return res.status(401).json({
      error: {
        message: 'Invalid authorization token',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Store the token in the request for use in route handlers
  (req as AuthenticatedRequest).token = token;
  next();
};
