const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

(async () => {
  try {
    const dbPath = path.join(__dirname, '..', 'backend', 'data', 'credentials.db');
    console.log('DB path:', dbPath);
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    const id = 'CRED-9123450';
    const payload = {
      credential: {
        id: 'CRED-9123450',
        name: 'John Doe',
        role: 'Senior Developer',
        department: 'Engineering',
        issueDate: '2025-10-07T08:10:11.611Z'
      },
      worker: 'manual-insert',
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