import { Router, Request, Response, NextFunction } from 'express';
import { ProductRepository } from '../repositories/products';
import { insertProductSchema, updateProductSchema } from '../db/schema';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const productRepo = new ProductRepository();

// GET /api/products - list products (public)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search, sortBy, limit, offset } = req.query;
    const products = await productRepo.findAll({
      category: category as string,
      status: 'approved',
      search: search as string,
      sortBy: sortBy as string,
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0,
    });
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/my - get current user's products
router.get('/my', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user!.id;
    const products = await productRepo.findAll({ sellerId: userId });
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/favorites - get user's favorited products
router.get('/favorites', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user!.id;
    const favoriteIds = await productRepo.getUserFavorites(userId);
    res.json({ success: true, data: favoriteIds });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id - get product detail (public)
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productRepo.findById(req.params.id as string);
    if (!product) throw new AppError('Product not found', 404);
    await productRepo.incrementViewCount(req.params.id as string);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// POST /api/products - create product
router.post('/', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user!.id;
    const validated = insertProductSchema.parse({ ...req.body, sellerId: userId });
    const product = await productRepo.create(validated);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// PUT /api/products/:id - update product
router.put('/:id', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user!.id;
    const existing = await productRepo.findById(req.params.id as string);
    if (!existing) throw new AppError('Product not found', 404);
    if (existing.product.sellerId !== userId) throw new AppError('Forbidden', 403);
    const validated = updateProductSchema.parse(req.body);
    const product = await productRepo.update(req.params.id as string, validated as any);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// POST /api/products/:id/favorite - toggle favorite
router.post('/:id/favorite', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user!.id;
    const result = await productRepo.toggleFavorite(userId, req.params.id as string);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/products/:id - delete product
router.delete('/:id', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user!.id;
    const existing = await productRepo.findById(req.params.id as string);
    if (!existing) throw new AppError('Product not found', 404);
    if (existing.product.sellerId !== userId) throw new AppError('Forbidden', 403);
    await productRepo.delete(req.params.id as string);
    res.json({ success: true, data: { message: 'Deleted' } });
  } catch (error) {
    next(error);
  }
});

export default router;
