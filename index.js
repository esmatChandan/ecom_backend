
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import db from './config/db.js';

// Route imports
import getOrCreateUser from './routes/createUserrouter.js';
import addressRoutes from './routes/addressRoutes.js';
import getAddressRoutes from './routes/getAddressroute.js';
 import apiRoutes from './routes/api_routers.js';
 import getAllOrdersRoutes from './routes/getOrderrouters.js'
 import adminDashbord from './routes/adminDashbord.js'
 import webhookRouter from './routes/webhookRouter.js';
 import getAllUser from './routes/createUserrouter.js'
 import feedbackRoutes from './routes/feedbackRoutes.js';
  import viewfeedbackinAdminPanal from './routes/feedbackRoutes.js'
// import couponRouter from './routes/couponRoutes.js';

import  adminloginRoute  from './routes/adminLoginRoute.js';


// const plainPassword = '821022@DesiTasty';
// const hash = bcrypt.hashSync(plainPassword, 10);
// console.log('New hash:', hash);

// Initialize environment variables
dotenv.config();

// Create Express app
const app = express();

app.use('/api', webhookRouter);
app.use(express.json());  
// Security middleware
app.use(helmet());
app.use(cors({
  origin: 'https://desitasty.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(bodyParser.json({ limit: '10kb' }));
app.use(bodyParser.urlencoded({ extended: true }));

//Database connection test
app.get('/health', async (req, res) => {
    try {
      const rows = await db.query('SELECT NOW() AS time');
      res.json({ 
        status: 'healthy',
        serverTime: rows[0].time,
        database: 'connected'
      });
    } catch (err) {
      res.status(500).json({ 
        status: 'unhealthy',
        error: 'Database connection failed',
        details: err.message 
      });
    }
  });
  

// API routes



app.use('/api/auth', getOrCreateUser); 
app.use('/api/getuser', getAllUser) 
 app.use('/api/address', addressRoutes);    
 app.use('/get-address', getAddressRoutes); 
 app.use('/get-orders', getAllOrdersRoutes); 
 app.use('/api', apiRoutes);
 app.use('/admin/login', adminloginRoute); 
 app.use('/admin/dashboard', adminDashbord); 
 
 app.use('/api/feedback', viewfeedbackinAdminPanal); 
 app.use('/api/feedback', feedbackRoutes); 
// app.use('/api/coupon', couponRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'API is running',
    documentation: process.env.API_DOCS_URL || '/api-docs',
    status: 'operational'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: 'The requested resource was not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({ 
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Server startup
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