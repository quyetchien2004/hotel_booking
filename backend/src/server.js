import http from 'http';
import app from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { registerSocketHandlers } from './events/socket.js';
import { logger } from './utils/logger.js';

const server = http.createServer(app);

registerSocketHandlers(server, {
  clientUrl: env.clientUrl,
});

async function bootstrap() {
  await connectDatabase();

  server.listen(env.port, () => {
    logger.info(`Server listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
