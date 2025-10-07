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
// const PORT = process.env.PORT || 3001;
const PORT = process.env.PORT || 3004;

const WORKER_ID = process.env.WORKER_ID || `worker-${uuidv4().substring(0, 8)}`;

// Middleware
// Disable CSP via Helmet in dev so frontend can communicate with backend without CSP blocking.
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
app.use('/issue', limiter);

// Swagger documentation
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', worker: WORKER_ID, timestamp: new Date().toISOString() });
});

// Debug: list credential IDs
app.get('/debug/credentials', async (req: Request, res: Response) => {
  try {
    // storage.list() may throw if DB not initialized
    // @ts-ignore
    const ids = await storage.list();
    res.json({ count: ids.length, ids });
  } catch (err: any) {
    logger.error(`Failed to list credentials: ${err && err.stack ? err.stack : err}`);
    res.status(500).json({ message: 'Failed to list credentials' });
  }
});

// Issue credential endpoint
app.post('/issue', async (req: Request, res: Response) => {
  try {
    const credential = req.body;

    if (!credential || typeof credential !== 'object') {
      logger.warn('Invalid credential format received');
      return res.status(400).json({ message: 'Invalid credential format' });
    }

    // Generate a unique credential ID if not provided
    const credentialId = credential.id || uuidv4();
    const credentialWithId = { ...credential, id: credentialId };

    // Check if credential already exists
    const exists = await storage.exists(credentialId);
    if (exists) {
      logger.info(`Credential ${credentialId} already issued`);
      return res.status(409).json({ message: 'Credential already issued' });
    }

    // Store the credential
    await storage.save(credentialId, {
      credential: credentialWithId,
      worker: WORKER_ID,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Credential ${credentialId} issued by ${WORKER_ID}`);

    res.status(201).json({
      message: `Credential issued by ${WORKER_ID}`,
      worker: WORKER_ID,
      credentialId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error(`Error issuing credential: ${error.message}`);
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

      await new Promise<void>((resolve, reject) => {
        const onListening = () => {
          server.removeListener('error', onError);
          resolve();
        };
        const onError = (err: any) => {
          server.removeListener('listening', onListening);
          try { server.close(); } catch (_) {}
          reject(err);
        };
        server.once('listening', onListening);
        server.once('error', onError);
      });

      logger.info(`Issuance Service (${WORKER_ID}) running on port ${tryPort}`);
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
