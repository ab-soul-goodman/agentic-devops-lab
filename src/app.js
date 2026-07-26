const path = require('node:path');
const express = require('express');
const { DEFAULT_DATABASE_PATH, initializeDatabase } = require('./db');

function createApp(options = {}) {
  const databasePath = options.databasePath ?? DEFAULT_DATABASE_PATH;
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.locals.database = initializeDatabase(databasePath);

  app.get('/', (request, response) => {
    response.render('index');
  });

  app.get('/health', (request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  return app;
}

module.exports = { createApp };
