import { db } from '../db';
import { products, InsertProduct, insertProductSchema, users, favorites } from '../db/schema';
import { eq, and, like, desc, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

type CreateProductInput = z.infer<typeof insertProductSchema>;

export class ProductRepository {
  async create(data: CreateProductInput) {
    const now = Date.now();
    const [product] = await db
      .insert(products)
      .values({
        ...data as InsertProduct,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return product;
  }

  async findById(id: string) {
    const [product] = await db
      .select({
        product: products,
        seller: {
          id: users.id,
          name: users.name,
          avatar: users.avatar,
          creditScore: users.creditScore,
          isVerified: users.isVerified,
          isBanned: sql`${users.isBanned}`,
        },
      })
      .from(products)
      .leftJoin(users, eq(products.sellerId, users.id))
      .where(eq(products.id, id));
    return product;
  }

  async findAll(filters?: {
    category?: string;
    status?: string;
    sellerId?: string;
    search?: string;
    sortBy?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = db
      .select({
        product: products,
        seller: {
          id: users.id,
          name: users.name,
          avatar: users.avatar,
          creditScore: users.creditScore,
          isVerified: users.isVerified,
          isBanned: sql`${users.isBanned}`,
        },
      })
      .from(products)
      .leftJoin(users, eq(products.sellerId, users.id));

    const conditions = [];

    if (filters?.category && filters.category !== 'all') {
      conditions.push(eq(products.category, filters.category));
    }
    if (filters?.status) {
      conditions.push(eq(products.status, filters.status));
    }
    if (filters?.sellerId) {
      conditions.push(eq(products.sellerId, filters.sellerId));
    }
    if (filters?.search) {
      conditions.push(
        sql`${like(products.title, `%${filters.search}%`)} OR ${like(products.description, `%${filters.search}%`)}`
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    // Sorting
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'price-asc':
          query = query.orderBy(products.price);
          break;
        case 'price-desc':
          query = query.orderBy(desc(products.price));
          break;
        case 'latest':
        default:
          query = query.orderBy(desc(products.createdAt));
          break;
      }
    } else {
      query = query.orderBy(desc(products.createdAt));
    }

    const result = await query.limit(filters?.limit ?? 50).offset(filters?.offset ?? 0);
    return result;
  }

  async update(id: string, data: Partial<InsertProduct>) {
    const [product] = await db
      .update(products)
      .set({ ...data, updatedAt: Date.now() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async incrementViewCount(id: string) {
    await db
      .update(products)
      .set({ viewCount: sql`${products.viewCount} + 1` })
      .where(eq(products.id, id));
  }

  async delete(id: string) {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  async countByStatus() {
    const result = await db
      .select({ status: products.status, count: sql<number>`count(*)` })
      .from(products)
      .groupBy(products.status);
    return result;
  }

  async countTodayNew() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(sql`${products.createdAt} >= ${todayTimestamp}`);
    return result?.count ?? 0;
  }

  async toggleFavorite(userId: string, productId: string) {
    const existing = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)));

    if (existing.length > 0) {
      await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)));
      return { favorited: false };
    } else {
      await db.insert(favorites).values({ 
        id: uuidv4(),
        userId, 
        productId,
        createdAt: Date.now()
      });
      return { favorited: true };
    }
  }

  async getUserFavorites(userId: string) {
    const result = await db
      .select({ productId: favorites.productId })
      .from(favorites)
      .where(eq(favorites.userId, userId));
    return result.map(r => r.productId);
  }
}

export const productRepository = new ProductRepository();
