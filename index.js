import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import {sequelize} from './config/db.js';
import db from './config/db.js';

// Route imports
import getOrCreateUser from './routes/createUserrouter.js';
import getAllUser from './routes/createUserrouter.js';
import addressRoutes from './routes/addressRoutes.js';
import getAddressRoutes from './routes/getAddressroute.js';
import apiRoutes from './routes/api_routers.js';
import getAllOrdersRoutes from './routes/getOrderrouters.js';
import adminDashbord from './routes/adminDashbord.js';
//import webhookRouter from './routes/webhookRouter.js';
import adminloginRoute from './routes/adminLoginRoute.js';
import feedbackRoutes from './routes/feedbackRoutes.js';

// Initialize environment variables
dotenv.config();

// Create Express app
const app = express();

const allowedOrigins = [
  'https://desitasty.com',
  'https://staging.desitasty.com', // Add staging
];

// ------------------ Middleware ------------------ //

// Body parsing middleware (must come first)
app.use(express.json());
app.use(bodyParser.json({ limit: '10kb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Security middleware
app.use(helmet());


// CORS middleware
app.use(cors({
origin: function (origin, callback) {
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    console.log('Blocked CORS request from:', origin); // Log malicious attempts
    callback(new Error('Not allowed by CORS'));
  }
},
// origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
//app.use(cors())
// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use(limiter);

// ------------------ Health Check ------------------ //

app.get('/db-health', async (req, res) => {
  try {
    await sequelize.authenticate();
    const [results] = await sequelize.query('SELECT 1+1 AS result');
    res.json({ 
      status: 'healthy',
      dbResult: results[0].result 
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ------------------ Routes ------------------ //

// Webhook
//app.use('/api', webhookRouter);

// Auth/User
app.use('/api/auth', getOrCreateUser);
app.use('/api/getuser', getAllUser);

// Address
app.use('/api/address', addressRoutes);
app.use('/get-address', getAddressRoutes);

// Orders
app.use('/get-orders', getAllOrdersRoutes);

// Admin
app.use('/admin/login', adminloginRoute);
app.use('/admin/dashboard', adminDashbord);

// Feedback
app.use('/api/feedback', feedbackRoutes);

// General API
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'API is running',
    documentation: process.env.API_DOCS_URL || '/api-docs',
    status: 'operational'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found'
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ------------------ Server ------------------ //
sequelize.authenticate()
  .then(() => console.log('✅ DB connected'))
  .catch(err => console.error('❌ DB connect error:', err));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

export default app;
