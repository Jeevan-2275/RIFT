import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
// Rate limiters will be imported where needed
import authRoutes from './routes/authRoutes.js';
import passportRoutes from './routes/passportRoutes.js';
import permissionRoutes from './routes/permissionRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import errorHandler from './middleware/errorMiddleware.js';
import ApiError from './utils/apiError.js';

const app = express();

// Security Middlewares
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/passports', passportRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/activity', activityRoutes);
// Duplicate notification route removed

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    message: 'AI Passport Backend is healthy and running',
    timestamp: new Date().toISOString()
  });
});

// Route not found fallback
app.all('*', (req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found on this server`));
});

// Error handling middleware
app.use(errorHandler);

export default app;
