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

// Database Seeder for Projects and Products
const seedProjectsAndProducts = async () => {
  try {
    // 1. Seed or find the parent Project: "SC Project"
    let scProject = await Project.findOne({ name: 'SC Project' });
    if (!scProject) {
      console.log('SC Project container not found. Seeding SC Project...');
      scProject = await Project.create({
        name: 'SC Project',
        key: 'scproject',
        enabled: true
      });
    }

    // Clean up old project documents (that are not SC Project) to ensure only SC Project is in the collection
    const deleteProjResult = await Project.deleteMany({ name: { $ne: 'SC Project' } });
    if (deleteProjResult.deletedCount > 0) {
      console.log(`Cleaned up ${deleteProjResult.deletedCount} legacy project documents from projects collection.`);
    }

    // Clean up old products that are not linked to SC Project (i.e. project: null or undefined)
    const deleteProdResult = await Product.deleteMany({ 
      $or: [
        { project: { $exists: false } },
        { project: null }
      ]
    });
    if (deleteProdResult.deletedCount > 0) {
      console.log(`Cleaned up ${deleteProdResult.deletedCount} legacy product campaigns.`);
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
        console.log(`Seeding missing product campaign: ${prod.name}`);
        await Product.create(prod);
      }
    }
    console.log('Projects and Products database validation complete.');
  } catch (error) {
    console.error('Error seeding projects and products:', error);
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
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'An unexpected error occurred on the server'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});
