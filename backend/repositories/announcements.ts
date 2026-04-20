import { db } from '../db';
import { announcements, InsertAnnouncement, insertAnnouncementSchema } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

type CreateAnnouncementInput = z.infer<typeof insertAnnouncementSchema>;

export class AnnouncementRepository {
  async create(data: CreateAnnouncementInput) {
    const now = Date.now();
    const [announcement] = await db
      .insert(announcements)
      .values({
        ...data as InsertAnnouncement,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return announcement;
  }

  async findActive() {
    return await db
      .select()
      .from(announcements)
      .where(eq(announcements.isActive, 1))
      .orderBy(desc(announcements.createdAt));
  }

  async findAll() {
    return await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt));
  }

  async update(id: string, data: Partial<InsertAnnouncement>) {
    const updatedData = { ...data, updatedAt: Date.now() };
    if (updatedData.isActive !== undefined) {
      updatedData.isActive = updatedData.isActive ? 1 : 0;
    }
    const [announcement] = await db
      .update(announcements)
      .set(updatedData)
      .where(eq(announcements.id, id))
      .returning();
    return announcement;
  }

  async delete(id: string) {
    const result = await db.delete(announcements).where(eq(announcements.id, id)).returning();
    return result.length > 0;
  }
}

export const announcementRepository = new AnnouncementRepository();
