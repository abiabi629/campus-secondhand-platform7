import { Router, Request, Response, NextFunction } from 'express';
import { ProductRepository } from '../repositories/products';
import { ReportRepository } from '../repositories/reports';
import { AnnouncementRepository } from '../repositories/announcements';
import { UserRepository } from '../repositories/users';
import { insertAnnouncementSchema } from '../db/schema';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { db } from '../db';
import { users } from '../db/schema';
import { sql } from 'drizzle-orm';

const router = Router();
const productRepo = new ProductRepository();
const reportRepo = new ReportRepository();
const announcementRepo = new AnnouncementRepository();
const userRepo = new UserRepository();

// Middleware: require admin role
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthRequest).user;
  if (!user || (user as any).role !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }
  next();
};

// GET /api/admin/stats - dashboard stats
router.get('/stats', authenticateJWT, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [todayProducts, pendingProducts, pendingReports, statusCounts] = await Promise.all([
      productRepo.countTodayNew(),
      productRepo.findAll({ status: 'pending', limit: 1 }),
      reportRepo.countPending(),
      productRepo.countByStatus(),
    ]);

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const [todayUsersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.createdAt} >= ${oneDayAgo}`);

    res.json({
      success: true,
      data: {
        todayNewUsers: todayUsersResult?.count ?? 0,
        todayNewProducts: todayProducts,
        pendingProducts: pendingProducts.length,
        pendingReports,
        statusCounts,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/products - get all products for review
router.get('/products', authenticateJWT, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const products = await productRepo.findAll({ status: (status as string) || 'pending' });
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/products/:id/review - approve or reject product
router.put('/products/:id/review', authenticateJWT, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action, rejectReason } = req.body;
    if (!['approve', 'reject'].includes(action)) throw new AppError('Invalid action', 400);
    const status = action === 'approve' ? 'approved' : 'rejected';
    const product = await productRepo.update(req.params.id as string, { status, rejectReason: rejectReason || null });
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/reports - get all reports
router.get('/reports', authenticateJWT, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const reports = await reportRepo.findAll(status as string);
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/reports/:id - resolve report
router.put('/reports/:id', authenticateJWT, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, adminNote } = req.body;
    const report = await reportRepo.update(req.params.id as string, { status, adminNote });
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users - get all users
router.get('/users', authenticateJWT, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allUsers = await userRepo.findAll();
    res.json({ success: true, data: allUsers });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/users/:id/ban - ban/unban user
router.put('/users/:id/ban', authenticateJWT, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isBanned } = req.body;
    const user = await userRepo.update(req.params.id as string, { isBanned });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/announcements - get all announcements
router.get('/announcements', authenticateJWT, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await announcementRepo.findAll();
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/announcements - create announcement
router.post('/announcements', authenticateJWT, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authorId = (req as AuthRequest).user!.id;
    const validated = insertAnnouncementSchema.parse({ ...req.body, authorId });
    const announcement = await announcementRepo.create(validated);
    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/announcements/:id - update announcement
router.put('/announcements/:id', authenticateJWT, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const announcement = await announcementRepo.update(req.params.id as string, req.body);
    res.json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/announcements/:id - delete announcement
router.delete('/announcements/:id', authenticateJWT, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await announcementRepo.delete(req.params.id as string);
    res.json({ success: true, data: { message: 'Deleted' } });
  } catch (error) {
    next(error);
  }
});

export default router;
