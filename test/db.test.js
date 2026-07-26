const { after, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { initializeDatabase } = require('../src/db');

describe('SQLite initialization', () => {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'agentic-devops-lab-')
  );
  const databasePath = path.join(temporaryDirectory, 'nested', 'test.sqlite');

  after(() => {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  it('creates the database and app_metadata table', () => {
    const database = initializeDatabase(databasePath);

    try {
      const table = database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?"
        )
        .get('app_metadata');

      assert.equal(fs.existsSync(databasePath), true);
      assert.deepEqual(table, { name: 'app_metadata' });
    } finally {
      database.close();
    }
  });
});
