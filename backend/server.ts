import uploadRoutes from './routes/upload';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import messageRoutes from './routes/messages';
import reportRoutes from './routes/reports';
import adminRoutes from './routes/admin';
import 'dotenv/config';
import express, { ErrorRequestHandler } from 'express';
import path from 'path';
import fs from 'fs';
import passport from './config/passport';
import cors from 'cors';

import { SERVER_CONFIG } from './config/constants';
import { errorHandler } from './middleware/errorHandler';

const DB_FILE = 'campus_marketplace.db';
const BACKUP_DIR = path.join(__dirname, '..', 'backup');

function autoBackup(): void {
  const dbPath = path.join(__dirname, '..', DB_FILE);

  if (!fs.existsSync(dbPath)) {
    console.log('Database file not found, skipping backup.');
    return;
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFilename = `campus_marketplace_${timestamp}.db`;
  const backupPath = path.join(BACKUP_DIR, backupFilename);

  fs.copyFileSync(dbPath, backupPath);
  console.log(`Auto backup created: ${backupFilename}`);

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('campus_marketplace_') && f.endsWith('.db'))
    .sort()
    .reverse();

  if (files.length > 10) {
    const toDelete = files.slice(10);
    toDelete.forEach(file => {
      fs.unlinkSync(path.join(BACKUP_DIR, file));
    });
    console.log(`Cleaned up ${toDelete.length} old backup(s).`);
  }
}

const app = express();

autoBackup();

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