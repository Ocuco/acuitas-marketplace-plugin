import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        message: 'Authorization token required',
        statusCode: 401,
        timestamp: new Date().toISOString()
      }
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (!token) {
    return res.status(401).json({
      error: {
        message: 'Invalid authorization token',
        statusCode: 401,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Store the token in the request for use in route handlers
  (req as any).token = token;
  next();
};
