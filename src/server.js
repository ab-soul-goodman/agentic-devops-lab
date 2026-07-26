const { createApp } = require('./app');

function getPort(value = process.env.PORT) {
  const port = Number(value ?? 3000);

  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('PORT must be an integer between 0 and 65535');
  }

  return port;
}

function startServer() {
  const app = createApp();
  const port = getPort();

  return app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { getPort, startServer };
