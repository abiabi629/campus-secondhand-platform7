import uploadRoutes from './routes/upload';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import messageRoutes from './routes/messages';
import reportRoutes from './routes/reports';
import adminRoutes from './routes/admin';
import 'dotenv/config';
import express, { ErrorRequestHandler } from 'express';
import path from 'path';
import passport from './config/passport';
import cors from 'cors';

import { SERVER_CONFIG } from './config/constants';
import { errorHandler } from './middleware/errorHandler';

const app = express();

/**
 * Static Files
 */
const REACT_BUILD_FOLDER = path.join(__dirname, '..', 'frontend', 'dist');
app.use(
  express.static(REACT_BUILD_FOLDER, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    },
  })
);

app.use(
  '/assets',
  express.static(path.join(REACT_BUILD_FOLDER, 'assets'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    },
  })
);

/**
 * CORS Middleware
 */
app.use(cors());

/**
 * Body Parsing Middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Passport Middleware
 */
app.use(passport.initialize());

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/products', productRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

/**
 * Public announcements route
 */
import { AnnouncementRepository } from './repositories/announcements';
const announcementRepo = new AnnouncementRepository();
app.get('/api/announcements', async (_req, res, next) => {
  try {
    const list = await announcementRepo.findActive();
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
});

/**
 * SPA Fallback Route
 */
app.get('*', (_req, res) => {
  res.sendFile(path.join(REACT_BUILD_FOLDER, 'index.html'));
});

/**
 * Error Handler
 */
app.use(errorHandler as ErrorRequestHandler);

/**
 * Start Server
 */
app.listen(3010, () => {
  console.log('Server ready on port 3010');
});

export default app;
