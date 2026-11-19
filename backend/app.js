import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import executionRoutes from './routes/executionRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import workflowRoutes from './routes/workflowRoutes.js';

const app = express();
const configuredClientOrigin = new URL(
  process.env.CLIENT_ORIGIN || 'http://localhost:5173',
);
const allowedOrigins = new Set([configuredClientOrigin.origin]);

if (configuredClientOrigin.hostname === 'localhost') {
  const loopbackOrigin = new URL(configuredClientOrigin);
  loopbackOrigin.hostname = '127.0.0.1';
  allowedOrigins.add(loopbackOrigin.origin);
} else if (configuredClientOrigin.hostname === '127.0.0.1') {
  const localhostOrigin = new URL(configuredClientOrigin);
  localhostOrigin.hostname = 'localhost';
  allowedOrigins.add(localhostOrigin.origin);
}

app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || allowedOrigins.has(origin));
    },
  }),
);
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? 'ok' : 'unavailable',
    database: databaseConnected ? 'connected' : 'disconnected',
  });
});

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

app.use((error, req, res, next) => {
  console.error('Request failed:', error.message);
  const status = error.status || (error.name === 'ValidationError' || error.name === 'CastError' ? 400 : error.code === 11000 ? 409 : 500);
  res.status(status).json({
    message: status < 500 ? error.message : 'An unexpected server error occurred.',
  });
});

export default app;
