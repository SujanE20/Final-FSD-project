import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';

const port = Number(process.env.PORT) || 5000;
let server;

async function startServer() {
  try {
    if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32) {
      throw new Error('JWT_SECRET must be configured with at least 32 bytes.');
    }

    await connectDatabase();
    server = app.listen(port, () => {
      console.info(`API listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exitCode = 1;
  }
}

async function shutdown(signal) {
  console.info(`${signal} received; shutting down.`);

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  const mongoose = await import('mongoose');
  await mongoose.default.disconnect();
}

process.once('SIGINT', () => {
  shutdown('SIGINT').catch((error) => {
    console.error('Shutdown failed:', error.message);
    process.exitCode = 1;
  });
});

process.once('SIGTERM', () => {
  shutdown('SIGTERM').catch((error) => {
    console.error('Shutdown failed:', error.message);
    process.exitCode = 1;
  });
});

startServer();
