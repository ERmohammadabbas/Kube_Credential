const path = require('path');
let sqlite3;
let sqlite;
try {
  // try normal resolution first
  sqlite3 = require('sqlite3');
  sqlite = require('sqlite');
} catch (e) {
  // fallback: resolve from issuance-service node_modules
  try {
    const fallback = path.join(__dirname, '..', 'backend', 'issuance-service', 'node_modules');
    const resolvedSqlite3 = require.resolve('sqlite3', { paths: [fallback] });
    sqlite3 = require(resolvedSqlite3);
    const resolvedSqlite = require.resolve('sqlite', { paths: [fallback] });
    sqlite = require(resolvedSqlite);
    console.log('Loaded sqlite3 and sqlite from issuance-service node_modules');
  } catch (e2) {
    console.error('Failed to load sqlite/sqlite3 from both default and issuance-service node_modules');
    throw e; // rethrow original
  }
}
const { open } = sqlite;

(async () => {
  try {
    const dbPath = path.join(__dirname, '..', 'backend', 'data', 'credentials.db');
    console.log('DB path:', dbPath);
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    // allow passing id as first arg: node insert-cred.cjs CRED-1000
    const id = process.argv[2] || 'CRED-9123450';
    const worker = process.argv[3] || process.env.WORKER || 'manual-insert';
    const credential = {
      id,
      name: 'John Doe',
      role: 'Senior Developer',
      department: 'Engineering',
      issueDate: '2025-10-07T08:10:11.611Z'
    };

    const payload = {
      credential,
      worker,
      timestamp: new Date().toISOString()
    };

    await db.run('CREATE TABLE IF NOT EXISTS credentials (id TEXT PRIMARY KEY, data TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
    await db.run('INSERT OR REPLACE INTO credentials (id, data) VALUES (?, ?)', [id, JSON.stringify(payload)]);
    console.log('Inserted', id);
    await db.close();
  } catch (err) {
    console.error('Insert failed:', err);
    process.exit(1);
  }
})();
