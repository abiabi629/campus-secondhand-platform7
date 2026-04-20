import { Router, Request, Response, NextFunction } from 'express';
import { MessageRepository } from '../repositories/messages';
import { insertMessageSchema } from '../db/schema';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = Router();
const messageRepo = new MessageRepository();

// GET /api/messages/conversations - get conversation list
router.get('/conversations', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user!.id;
    const conversations = await messageRepo.getConversationList(userId);
    res.json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
});

// GET /api/messages/unread - get unread count
router.get('/unread', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user!.id;
    const count = await messageRepo.countUnread(userId);
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
});

// GET /api/messages/:userId - get conversation with a user
router.get('/:userId', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = (req as AuthRequest).user!.id;
    const otherUserId = req.params.userId as string;
    const productId = req.query.productId as string | undefined;
    const msgs = await messageRepo.getConversation(currentUserId, otherUserId, productId);
    await messageRepo.markAsRead(otherUserId, currentUserId);
    res.json({ success: true, data: msgs });
  } catch (error) {
    next(error);
  }
});

// POST /api/messages - send message
router.post('/', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const senderId = (req as AuthRequest).user!.id;
    const validated = insertMessageSchema.parse({ ...req.body, senderId });
    const message = await messageRepo.create(validated);
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
});

export default router;
