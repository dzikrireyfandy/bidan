import createApp from './app';
import config from './config/env';
import db from './db/pool';
import { startJobs, stopJobs } from './jobs/cron';

const app = createApp();
const PORT = config.PORT;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${config.NODE_ENV} mode`);
  startJobs();
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  stopJobs();
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await db.close();
      console.log('Database connection pool closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error during database pool closure:', err);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
