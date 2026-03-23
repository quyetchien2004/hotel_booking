import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function useSocket() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketClient = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      autoConnect: false,
    });

    setSocket(socketClient);

    return () => {
      socketClient.close();
    };
  }, []);

  return socket;
}
