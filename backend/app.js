/******************************************************************
 * Central Express-app   (imported by server.js & unit-tests)      *
 ******************************************************************/
require('dotenv').config();                   // .env → process.env
const express        = require('express');
const path           = require('path');
const cookieParser   = require('cookie-parser');
const mongoSanitize  = require('express-mongo-sanitize');
const helmet         = require('helmet');
const xss            = require('xss-clean');
const rateLimit      = require('express-rate-limit');
const hpp            = require('hpp');
const cors           = require('cors');
const connectDB      = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

/* ─────────────────────  connect MongoDB ───────────────────── */
connectDB();

/* ────────────────────  build express app ──────────────────── */
const app = express();

/* --------- security / common middle-wares --------- */
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(rateLimit({ windowMs: 10 * 60 * 1000, max: 100 }));

/* --------- static uploads folder --------- */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ─────────────────────  API ROUTES  ──────────────────────── */
app.use('/api/sellers',  require('./routes/sellerRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders',   require('./routes/orderRoutes'));
app.use('/api/users',    require('./routes/userRoutes'));

/* health-check */
app.get('/api/health', (_req, res) =>
  res.status(200).json({ status: 'ok', message: 'Server running' })
);

/* error handler (keeps last) */
app.use(errorHandler);

module.exports = app;           // <-- exported for server.js & tests
