const socketIO = require('socket.io');

let io = null;

module.exports = {
  init: (httpServer) => {
    if (!io) {
      io = socketIO(httpServer, {
        cors: {
          origin: process.env.CLIENT_URL || "http://localhost:3000",
          methods: ["GET", "POST"],
          credentials: true
        }
      });
    }
    return io;
  },
  getIO: () => {
    if (!io) {
      // Instead of throwing an error, create a dummy io object
      console.warn('Socket.io not initialized yet, using dummy object');
      return {
        to: () => ({
          emit: () => console.warn('Socket.io not initialized, message not sent')
        })
      };
    }
    return io;
  }
}; 