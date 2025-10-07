import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { storage } from './storage';
import { logger } from './logger';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3002;
// const PORT = process.env.PORT || 3003;
const WORKER_ID = process.env.WORKER_ID || `verifier-${uuidv4().substring(0, 8)}`;

// Middleware
// Allow disabling Content-Security-Policy in development so frontend fetches to
// local backend ports are not blocked by strict CSP policies.
app.use(helmet({ contentSecurityPolicy: false } as any));
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/verify', limiter);

// Swagger documentation
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', worker: WORKER_ID, timestamp: new Date().toISOString() });
});

// Debug: echo request body and headers so frontend connectivity can be tested
app.post('/debug/echo', (req: Request, res: Response) => {
  try {
    logger.info(`Debug echo received from ${req.ip}: ${JSON.stringify(req.body)}`);
    res.json({ received: true, body: req.body, headers: req.headers });
  } catch (err: any) {
    logger.error(`Debug echo failed: ${err && err.stack ? err.stack : err}`);
    res.status(500).json({ message: 'Echo failed' });
  }
});

// Debug: list credential IDs
app.get('/debug/credentials', async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const ids = await storage.list();
    res.json({ count: ids.length, ids });
  } catch (err: any) {
    logger.error(`Failed to list credentials: ${err && err.stack ? err.stack : err}`);
    res.status(500).json({ message: 'Failed to list credentials' });
  }
});

// Verify credential endpoint
app.post('/verify', async (req: Request, res: Response) => {
  try {
    const credential = req.body;

    if (!credential || typeof credential !== 'object') {
      logger.warn('Invalid credential format received for verification');
      return res.status(400).json({ message: 'Invalid credential format' });
    }

    const credentialId = credential.id;
    if (!credentialId) {
      logger.warn('Credential ID missing in verification request');
      return res.status(400).json({ message: 'Credential ID is required' });
    }

    // Check if credential exists
    const credentialData = await storage.get(credentialId);

    if (!credentialData) {
      logger.info(`Credential ${credentialId} not found`);
      return res.status(404).json({
        status: 'invalid',
        message: 'Credential not found',
      });
    }

    logger.info(`Credential ${credentialId} verified successfully`);

    res.json({
      status: 'valid',
      worker: credentialData.worker,
      timestamp: credentialData.timestamp,
      credential: credentialData.credential,
    });
  } catch (error: any) {
    logger.error(`Error verifying credential: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start server after initializing storage so DB errors surface at startup
// Try listening on PORT, or PORT+1..PORT+9 if in use
async function startWithPortFallback(basePort: number) {
  await storage.init();

  for (let i = 0; i < 10; i++) {
    const tryPort = basePort + i;
    try {
      const server = app.listen(tryPort);

      // Wait for either listening or error
      await new Promise<void>((resolve, reject) => {
        const onListening = () => {
          server.removeListener('error', onError);
          resolve();
        };
        const onError = (err: any) => {
          server.removeListener('listening', onListening);
          // Ensure server is closed if needed
          try { server.close(); } catch (_) {}
          reject(err);
        };
        server.once('listening', onListening);
        server.once('error', onError);
      });

      logger.info(`Verification Service (${WORKER_ID}) running on port ${tryPort}`);
      logger.info(`API Documentation available at http://localhost:${tryPort}/api-docs`);
      return; // started successfully
    } catch (err: any) {
      if (err && err.code === 'EADDRINUSE') {
        logger.warn(`Port ${tryPort} is in use, trying next port`);
        continue;
      }
      logger.error(`Failed to start server on port ${tryPort}: ${err && err.stack ? err.stack : err}`);
      process.exit(1);
    }
  }

  logger.error(`No available ports found in range ${basePort}-${basePort + 9}`);
  process.exit(1);
}

(async () => {
  try {
    const base = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;
    await startWithPortFallback(base);
  } catch (err: any) {
    logger.error(`Startup failed: ${err && err.stack ? err.stack : err}`);
    process.exit(1);
  }
})();

export default app;
