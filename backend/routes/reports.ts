import { Router, Request, Response, NextFunction } from 'express';
import { ReportRepository } from '../repositories/reports';
import { insertReportSchema } from '../db/schema';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = Router();
const reportRepo = new ReportRepository();

// POST /api/reports - create report
router.post('/', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reporterId = (req as AuthRequest).user!.id;
    const validated = insertReportSchema.parse({ ...req.body, reporterId });
    const report = await reportRepo.create(validated);
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

export default router;
