// backend/src/server.ts - FIXED WITH FUNDING APPLICATION ROUTES
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
// FIX: Import the missing funding application routes
import fundingApplicationRoutes from './routes/funding-applications';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP' }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  return res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
// FIX: Add the funding application routes to the users path
// This will make routes like: /api/users/:id/funding-application/* work
app.use('/api/users', fundingApplicationRoutes);

// Test route to verify routing
app.get('/api/test', (req, res) => {
  return res.json({ message: 'API is working!' });
});

// Debug route to list all registered routes
app.get('/api/debug/routes', (req, res) => {
  const routes: string[] = [];
  
  function printRoutes(stack: any[], prefix = '') {
    stack.forEach((middleware: any) => {
      if (middleware.route) {
        // Regular route
        const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
        routes.push(`${methods} ${prefix}${middleware.route.path}`);
      } else if (middleware.name === 'router') {
        // Router middleware
        const routerPrefix = middleware.regexp.source
          .replace(/\\\//g, '/')
          .replace(/\$/, '')
          .replace(/\^/, '')
          .replace(/\?\(\?\=/, '')
          .replace(/\)/, '');
        
        if (middleware.handle.stack) {
          printRoutes(middleware.handle.stack, prefix + routerPrefix);
        }
      }
    });
  }
  
  printRoutes(app._router.stack, '/api');
  
  return res.json({ 
    message: 'All registered API routes',
    routes: routes.sort()
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  if (err.code === 'P2002') {
    // Prisma unique constraint violation
    return res.status(400).json({ 
      error: 'A record with this information already exists' 
    });
  }
  
  return res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  return res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    hint: 'Check /api/debug/routes to see all available routes'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🔍 Debug routes: http://localhost:${PORT}/api/debug/routes`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`👤 User endpoints: http://localhost:${PORT}/api/users/*`);
  console.log(`💰 Funding endpoints: http://localhost:${PORT}/api/users/*/funding-application*`);
  console.log(`🗄️  Database: SQLite (${process.env.DATABASE_URL})`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Server terminated');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;