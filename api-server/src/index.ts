import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { imageRouter } from './routes/images.js';
import { patientRouter } from './routes/patients.js';
import { saleRouter } from './routes/sales.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandlers.js';

// Load environment variables. `.env.local` (developer-specific overrides) takes
// precedence, then `.env`. dotenv does NOT load `.env.local` by default — that is a
// Vite/CRA convention — so it is loaded explicitly here. Loaded first so its values
// win, because dotenv.config() does not override variables already set.
dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api', imageRouter);
app.use('/api', patientRouter);
app.use('/api', saleRouter);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🖼️  Images API: http://localhost:${PORT}/api/images`);
  console.log(`🧑  Patients API: http://localhost:${PORT}/api/patients`);
  console.log(`🧾  Sales API: http://localhost:${PORT}/api/sales/:id/lines`);
});
