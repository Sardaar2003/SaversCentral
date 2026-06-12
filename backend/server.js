import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import Project from './models/Project.js';
import Product from './models/Product.js';

// Route imports
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import productRoutes from './routes/products.js';
import userRoutes from './routes/users.js';
import orderRoutes from './routes/orders.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// [DEBUG] Global Request Logger Middleware
// Logs every incoming request with method, URL, body, and query
// ============================================================
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n${'='.repeat(70)}`);
  console.log(`[DEBUG][REQUEST] ${req.method} ${req.originalUrl}`);
  console.log(`[DEBUG][REQUEST] Timestamp: ${timestamp}`);
  console.log(`[DEBUG][REQUEST] IP: ${req.ip}`);
  console.log(`[DEBUG][REQUEST] User-Agent: ${req.headers['user-agent']}`);
  if (req.headers.authorization) {
    console.log(`[DEBUG][REQUEST] Auth Header: Bearer ${req.headers.authorization.split(' ')[1]?.substring(0, 20)}...`);
  }
  if (Object.keys(req.query).length > 0) {
    console.log(`[DEBUG][REQUEST] Query Params:`, JSON.stringify(req.query, null, 2));
  }
  if (req.body && Object.keys(req.body).length > 0) {
    // Mask sensitive fields in the log
    const safeCopy = { ...req.body };
    if (safeCopy.password) safeCopy.password = '****';
    if (safeCopy.newPassword) safeCopy.newPassword = '****';
    if (safeCopy.card_number) safeCopy.card_number = `****${safeCopy.card_number.slice(-4)}`;
    if (safeCopy.card_cvv) safeCopy.card_cvv = '***';
    console.log(`[DEBUG][REQUEST] Body:`, JSON.stringify(safeCopy, null, 2));
  }
  console.log(`${'='.repeat(70)}`);

  // Capture response details
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    console.log(`[DEBUG][RESPONSE] ${req.method} ${req.originalUrl} → Status: ${res.statusCode}`);
    if (body && typeof body === 'object') {
      const safeBody = { ...body };
      // Don't log full token or apiResponse in response logs
      if (safeBody.data?.token) safeBody.data = { ...safeBody.data, token: safeBody.data.token.substring(0, 20) + '...' };
      if (safeBody.data?.apiResponse) safeBody.data = { ...safeBody.data, apiResponse: '[TRUNCATED]' };
      if (safeBody.data?.apiPayload) safeBody.data = { ...safeBody.data, apiPayload: '[TRUNCATED]' };
      console.log(`[DEBUG][RESPONSE] Body:`, JSON.stringify(safeBody, null, 2));
    }
    console.log(`${'─'.repeat(70)}\n`);
    return originalJson(body);
  };

  next();
});

// Database Seeder for Projects and Products
const seedProjectsAndProducts = async () => {
  try {
    console.log('[DEBUG][SEEDER] Starting project and product seed validation...');
    // 1. Seed or find the parent Project: "SC Project"
    let scProject = await Project.findOne({ name: 'SC Project' });
    if (!scProject) {
      console.log('[DEBUG][SEEDER] SC Project container not found. Seeding SC Project...');
      scProject = await Project.create({
        name: 'SC Project',
        key: 'scproject',
        enabled: true
      });
      console.log(`[DEBUG][SEEDER] SC Project created with ID: ${scProject._id}`);
    } else {
      console.log(`[DEBUG][SEEDER] SC Project already exists. ID: ${scProject._id}`);
    }

    // Clean up old project documents (that are not SC Project) to ensure only SC Project is in the collection
    const deleteProjResult = await Project.deleteMany({ name: { $ne: 'SC Project' } });
    if (deleteProjResult.deletedCount > 0) {
      console.log(`[DEBUG][SEEDER] Cleaned up ${deleteProjResult.deletedCount} legacy project documents from projects collection.`);
    }

    // Clean up old products that are not linked to SC Project (i.e. project: null or undefined)
    const deleteProdResult = await Product.deleteMany({ 
      $or: [
        { project: { $exists: false } },
        { project: null }
      ]
    });
    if (deleteProdResult.deletedCount > 0) {
      console.log(`[DEBUG][SEEDER] Cleaned up ${deleteProdResult.deletedCount} legacy product campaigns.`);
    }

    // 2. Seed default Products under SC Project
    const defaultProducts = [
      {
        name: 'SaversCentralOnline',
        key: 'saverscentral',
        project: scProject._id,
        connectionId: 1,
        campaignId: 136,
        offerId: 4,
        trialPrice: '$2.93 14-day Trial',
        monthlyPrice: '$29.83 Monthly',
        enabled: true,
        serviceName: 'sublytics'
      },
      {
        name: 'HolidaySaversOnline',
        key: 'holidaysavers',
        project: scProject._id,
        connectionId: 1,
        campaignId: 137,
        offerId: 6,
        trialPrice: '$2.93 14-day Trial',
        monthlyPrice: '$29.83 Monthly',
        enabled: true,
        serviceName: 'sublytics'
      },
      {
        name: 'IDVaultUSA',
        key: 'idvault',
        project: scProject._id,
        connectionId: 1,
        campaignId: 138,
        offerId: 86,
        trialPrice: 'Free 30-day Trial',
        monthlyPrice: '$29.95 Monthly',
        enabled: true,
        serviceName: 'sublytics'
      }
    ];

    for (const prod of defaultProducts) {
      const exists = await Product.findOne({ key: prod.key });
      if (!exists) {
        console.log(`[DEBUG][SEEDER] Seeding missing product campaign: ${prod.name}`);
        await Product.create(prod);
      } else {
        console.log(`[DEBUG][SEEDER] Product "${prod.name}" already exists. ID: ${exists._id}`);
      }
    }
    console.log('[DEBUG][SEEDER] Projects and Products database validation complete.');
  } catch (error) {
    console.error('[DEBUG][SEEDER] Error seeding projects and products:', error);
  }
};

// Connect database and seed data
connectDB().then(() => {
  seedProjectsAndProducts();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

// Health check
app.get('/api/health', (req, res) => {
  console.log('[DEBUG][HEALTH] Health check endpoint hit');
  res.json({ success: true, message: 'Server is running', time: new Date() });
});

// Serve frontend in production
const frontendBuildPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendBuildPath));

// SPA Routing in production
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendBuildPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('API Server is up. Frontend bundle not built yet.');
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[DEBUG][ERROR] Unhandled server error on ${req.method} ${req.originalUrl}:`, err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'An unexpected error occurred on the server'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n[DEBUG][SERVER] ===== Server running in development mode on port ${PORT} =====`);
  console.log(`[DEBUG][SERVER] Endpoints registered:`);
  console.log(`[DEBUG][SERVER]   POST /api/auth/register`);
  console.log(`[DEBUG][SERVER]   POST /api/auth/login`);
  console.log(`[DEBUG][SERVER]   POST /api/auth/forgot-password`);
  console.log(`[DEBUG][SERVER]   GET  /api/projects`);
  console.log(`[DEBUG][SERVER]   GET  /api/products`);
  console.log(`[DEBUG][SERVER]   GET  /api/orders`);
  console.log(`[DEBUG][SERVER]   POST /api/orders`);
  console.log(`[DEBUG][SERVER]   GET  /api/orders/stats`);
  console.log(`[DEBUG][SERVER]   GET  /api/orders/export`);
  console.log(`[DEBUG][SERVER]   GET  /api/users`);
  console.log(`[DEBUG][SERVER]   GET  /api/health`);
  console.log(`[DEBUG][SERVER] ========================================\n`);
});
