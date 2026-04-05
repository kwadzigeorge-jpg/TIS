require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const poiRoutes = require('./routes/pois');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const articleRoutes = require('./routes/articles');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 4000;

// Security & middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/v1/auth', authRoutes);
app.use('/v1/pois', poiRoutes);
app.use('/v1/reviews', reviewRoutes);
app.use('/v1/users', userRoutes);
app.use('/v1/notifications', notificationRoutes);
app.use('/v1/articles', articleRoutes);
app.use('/v1/admin', adminRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`TIS API running on http://localhost:${PORT}`);
});

module.exports = app;
