import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import didRoutes from './routes/didRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/v1', didRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'DID API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      createDID: 'POST /api/v1/dids',
      getDID: 'GET /api/v1/dids/:did',
      getAllDIDs: 'GET /api/v1/dids',
      updateDID: 'PUT /api/v1/dids/:did',
      deleteDID: 'DELETE /api/v1/dids/:did',
      getPrivateKey: 'GET /api/v1/dids/:did/keys/:keyType'
    }
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DID API Server running on port ${PORT}`);
  console.log(`📖 API Documentation available at http://localhost:${PORT}`);
  console.log(`🏥 Health check available at http://localhost:${PORT}/api/v1/health`);
});

export default app;
