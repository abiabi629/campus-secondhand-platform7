-- Campus Marketplace Migration
-- Adds Products, Messages, Reports, Announcements, Favorites tables
-- Also extends Users table with new fields

-- Extend Users table
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "avatar" TEXT;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "student_id" TEXT;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user';
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "is_verified" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "verification_status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "credit_score" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "is_banned" BOOLEAN NOT NULL DEFAULT FALSE;

-- Products Table
CREATE TABLE IF NOT EXISTS "Products" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "seller_id" TEXT NOT NULL REFERENCES "Users"("id"),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "original_price" DECIMAL(10,2),
    "category" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "trade_method" TEXT NOT NULL DEFAULT 'face',
    "trade_location" TEXT,
    "images" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reject_reason" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "is_featured" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "products_seller_id_idx" ON "Products"("seller_id");
CREATE INDEX IF NOT EXISTS "products_status_idx" ON "Products"("status");
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "Products"("category");

-- Messages Table
CREATE TABLE IF NOT EXISTS "Messages" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "sender_id" TEXT NOT NULL REFERENCES "Users"("id"),
    "receiver_id" TEXT NOT NULL REFERENCES "Users"("id"),
    "product_id" TEXT REFERENCES "Products"("id"),
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "messages_sender_id_idx" ON "Messages"("sender_id");
CREATE INDEX IF NOT EXISTS "messages_receiver_id_idx" ON "Messages"("receiver_id");
CREATE INDEX IF NOT EXISTS "messages_product_id_idx" ON "Messages"("product_id");

-- Reports Table
CREATE TABLE IF NOT EXISTS "Reports" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "reporter_id" TEXT NOT NULL REFERENCES "Users"("id"),
    "product_id" TEXT REFERENCES "Products"("id"),
    "reported_user_id" TEXT REFERENCES "Users"("id"),
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "admin_note" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "reports_status_idx" ON "Reports"("status");

-- Announcements Table
CREATE TABLE IF NOT EXISTS "Announcements" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "author_id" TEXT NOT NULL REFERENCES "Users"("id"),
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Favorites Table
CREATE TABLE IF NOT EXISTS "Favorites" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL REFERENCES "Users"("id"),
    "product_id" TEXT NOT NULL REFERENCES "Products"("id"),
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "favorites_user_product_unique" ON "Favorites"("user_id", "product_id");
