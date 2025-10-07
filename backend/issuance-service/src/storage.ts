import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { logger } from './logger';
import path from 'path';
import fs from 'fs';

class Storage {
  private db: Database | null = null;
  private dataDir: string | null = null;

  async init() {
    try {
      // Determine a robust data directory. Prefer explicit env var, then
      // __dirname relative path (for compiled code), then process.cwd()
      const envDir = process.env.DATA_DIR;
      // Default to a repo-level shared backend/data directory when DATA_DIR is not set.
      // __dirname is service/src or service/dist; '../../data' points to backend/data.
      let dataDir = envDir
        ? path.resolve(envDir)
        : path.join(__dirname, '../../data');

      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (err) {
        logger.warn(`Could not ensure data directory ${dataDir}: ${err}`);
        dataDir = path.join(process.cwd(), 'data');
        try {
          fs.mkdirSync(dataDir, { recursive: true });
        } catch (err2) {
          logger.warn(`Fallback data directory ${dataDir} could not be created: ${err2}`);
        }
      }

  this.dataDir = dataDir;
  logger.info(`Using data directory for DB: ${dataDir}`);

      this.db = await open({
        filename: path.join(dataDir, 'credentials.db'),
        driver: sqlite3.Database,
      });

      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS credentials (
          id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      logger.info('Storage initialized successfully');
    } catch (error: any) {
      logger.error(`Failed to initialize storage: ${error.message}`);
      throw error;
    }
  }

  async save(id: string, data: any): Promise<void> {
    if (!this.db) await this.init();

    try {
      await this.db!.run(
        'INSERT INTO credentials (id, data) VALUES (?, ?)',
        [id, JSON.stringify(data)]
      );
    } catch (error: any) {
      logger.error(`Failed to save credential ${id}: ${error.message}`);
      throw error;
    }
  }

  async list(): Promise<string[]> {
    if (!this.db) await this.init();

    try {
      const rows = await this.db!.all('SELECT id FROM credentials');
      return rows.map((r: any) => r.id);
    } catch (error: any) {
      logger.error(`Failed to list credentials: ${error.message}`);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    if (!this.db) await this.init();

    try {
      const result = await this.db!.get(
        'SELECT id FROM credentials WHERE id = ?',
        [id]
      );
      return !!result;
    } catch (error: any) {
      logger.error(`Failed to check credential ${id}: ${error.message}`);
      throw error;
    }
  }

  async get(id: string): Promise<any | null> {
    if (!this.db) await this.init();

    try {
      const result = await this.db!.get(
        'SELECT data FROM credentials WHERE id = ?',
        [id]
      );
      if (result) {
        logger.info(`Found credential ${id} in ${this.dataDir}`);
        return JSON.parse(result.data);
      }
      logger.info(`Credential ${id} not found in ${this.dataDir}`);
      return null;
    } catch (error: any) {
      logger.error(`Failed to get credential ${id}: ${error.message}`);
      throw error;
    }
  }
}

export const storage = new Storage();
