import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ============================================// Users Table// ============================================
export const users = sqliteTable('Users', {
  id: text('id')
    .primaryKey()
    .notNull(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  avatar: text('avatar'),
  phone: text('phone'),
  studentId: text('student_id'),
  role: text('role').notNull().default('user'), // 'user' | 'admin'
  isVerified: integer('is_verified').notNull().default(0), // 0 = false, 1 = true
  verificationStatus: text('verification_status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  creditScore: integer('credit_score').notNull().default(50),
  isBanned: integer('is_banned').notNull().default(0), // 0 = false, 1 = true
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const insertUserSchema = createInsertSchema(users, {
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export const updateUserSchema = insertUserSchema.partial();

export const loginUserSchema = insertUserSchema.pick({
  email: true,
  password: true,
});

export const signupUserSchema = insertUserSchema
  .extend({
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type SignupUserInput = z.infer<typeof signupUserSchema>;

// ============================================// Products Table// ============================================
export const products = sqliteTable('Products', {
  id: text('id')
    .primaryKey()
    .notNull(),
  sellerId: text('seller_id').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  price: real('price').notNull(),
  originalPrice: real('original_price'),
  category: text('category').notNull(), // 'books' | 'electronics' | 'daily' | 'sports' | 'beauty' | 'other'
  condition: text('condition').notNull(), // 'new' | 'like-new' | 'used' | 'damaged'
  tradeMethod: text('trade_method').notNull().default('face'), // 'face' | 'delivery'
  tradeLocation: text('trade_location'),
  images: text('images').notNull().default('[]'), // JSON array of image URLs
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected' | 'sold' | 'removed'
  rejectReason: text('reject_reason'),
  viewCount: integer('view_count').notNull().default(0),
  isFeatured: integer('is_featured').notNull().default(0), // 0 = false, 1 = true
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const insertProductSchema = createInsertSchema(products, {
  id: z.string().optional(),
  title: z.string().min(1).max(50),
  description: z.string().min(1).max(500),
  price: z.number(),
  originalPrice: z.number().optional(),
  category: z.enum(['books', 'electronics', 'daily', 'sports', 'beauty', 'other']),
  condition: z.enum(['new', 'like-new', 'used', 'damaged']),
  tradeMethod: z.enum(['face', 'delivery']).optional(),
  images: z.string().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export const updateProductSchema = insertProductSchema.partial();

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ============================================// Messages Table// ============================================
export const messages = sqliteTable('Messages', {
  id: text('id')
    .primaryKey()
    .notNull(),
  senderId: text('sender_id').notNull(),
  receiverId: text('receiver_id').notNull(),
  productId: text('product_id'),
  content: text('content').notNull(),
  isRead: integer('is_read').notNull().default(0), // 0 = false, 1 = true
  createdAt: integer('created_at').notNull(),
});

export const insertMessageSchema = createInsertSchema(messages, {
  id: z.string().optional(),
  content: z.string().min(1),
  createdAt: z.number().optional(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ============================================// Reports Table// ============================================
export const reports = sqliteTable('Reports', {
  id: text('id')
    .primaryKey()
    .notNull(),
  reporterId: text('reporter_id').notNull(),
  productId: text('product_id'),
  reportedUserId: text('reported_user_id'),
  reason: text('reason').notNull(), // 'fake' | 'fraud' | 'prohibited' | 'other'
  description: text('description'),
  status: text('status').notNull().default('pending'), // 'pending' | 'resolved' | 'dismissed'
  adminNote: text('admin_note'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const insertReportSchema = createInsertSchema(reports, {
  id: z.string().optional(),
  reason: z.enum(['fake', 'fraud', 'prohibited', 'other']),
  description: z.string().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

// ============================================// Announcements Table// ============================================
export const announcements = sqliteTable('Announcements', {
  id: text('id')
    .primaryKey()
    .notNull(),
  authorId: text('author_id').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  isActive: integer('is_active').notNull().default(1), // 0 = false, 1 = true
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const insertAnnouncementSchema = createInsertSchema(announcements, {
  id: z.string().optional(),
  title: z.string().min(1),
  content: z.string().min(1),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

// ============================================// Favorites Table// ============================================
export const favorites = sqliteTable('Favorites', {
  id: text('id')
    .primaryKey()
    .notNull(),
  userId: text('user_id').notNull(),
  productId: text('product_id').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const insertFavoriteSchema = createInsertSchema(favorites, {
  createdAt: z.number().optional(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

// ============================================// Uploads Table// ============================================
export const uploads = sqliteTable('Uploads', {
  id: text('id')
    .primaryKey()
    .notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: text('file_type').notNull(),
  s3Key: text('s3_key').notNull(),
  s3Url: text('s3_url').notNull(),
  uploadId: text('upload_id'),
  status: text('status').notNull().default('pending'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const insertUploadSchema = createInsertSchema(uploads, {
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().int().positive('File size must be positive'),
  fileType: z.string().min(1, 'File type is required'),
  s3Key: z.string().min(1, 'S3 key is required'),
  s3Url: z.string().url('Invalid S3 URL'),
  uploadId: z.string().optional(),
  status: z.enum(['pending', 'uploading', 'completed', 'failed']).optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export const updateUploadSchema = insertUploadSchema.partial();

export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = typeof uploads.$inferInsert;
