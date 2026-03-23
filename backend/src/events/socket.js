import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';

export function registerSocketHandlers(server, { clientUrl }) {
  const io = new Server(server, {
    cors: {
      origin: clientUrl,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('ping:client', () => {
      socket.emit('pong:server', { at: new Date().toISOString() });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}
