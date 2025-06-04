/******************************************************************
 * HTTP / Socket.IO bootstrap -- “npm start” lands here           *
 ******************************************************************/
const http    = require('http');
const socket  = require('socket.io');
const app     = require('./app');            // ← central Express app
const path    = require('path');

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT     = process.env.PORT     || 5000;

/* ─────────────  spin HTTP server + Socket.IO  ───────────── */
const httpServer = http.createServer(app);
const io         = socket(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET','POST']
  }
});

/* (optional) socket handlers */
// require('./socket/socketHandlers')(io);

httpServer.listen(PORT, () =>
  console.log(`⚡  Server running in ${NODE_ENV} mode on port ${PORT}`)
);

/* ─────────────  graceful-shutdown helpers  ───────────── */
const shutdown = (msg, code = 0) => {
  console.log(msg);
  httpServer.close(() => process.exit(code));
};

process.on('unhandledRejection', (err) =>
  shutdown(`❌  Unhandled Rejection: ${err.message}`, 1)
);
process.on('uncaughtException',  (err) =>
  shutdown(`❌  Uncaught Exception: ${err.message}`, 1)
);
process.on('SIGTERM', () => shutdown('🛑  SIGTERM – shutting down'));
process.on('SIGINT',  () => shutdown('🛑  SIGINT  – shutting down'));

/* ─────────────  prod-static setup (React build)  ───────────── */
if (NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'frontend', 'build');
  app.use(express.static(buildPath));
  app.get('*', (_req, res) => res.sendFile(path.join(buildPath, 'index.html')));
}
