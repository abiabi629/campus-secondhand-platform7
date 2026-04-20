import { db } from '../db';
import { reports, InsertReport, insertReportSchema, users, products } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

type CreateReportInput = z.infer<typeof insertReportSchema>;

export class ReportRepository {
  async create(data: CreateReportInput) {
    const now = Date.now();
    const [report] = await db
      .insert(reports)
      .values({
        ...data as InsertReport,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return report;
  }

  async findAll(status?: string) {
    let query = db
      .select({
        report: reports,
        reporter: {
          id: users.id,
          name: users.name,
        },
      })
      .from(reports)
      .leftJoin(users, eq(reports.reporterId, users.id));

    if (status) {
      query = query.where(eq(reports.status, status)) as typeof query;
    }

    return await query.orderBy(desc(reports.createdAt));
  }

  async update(id: string, data: Partial<InsertReport>) {
    const [report] = await db
      .update(reports)
      .set({ ...data, updatedAt: Date.now() })
      .where(eq(reports.id, id))
      .returning();
    return report;
  }

  async countPending() {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reports)
      .where(eq(reports.status, 'pending'));
    return result?.count ?? 0;
  }
}

export const reportRepository = new ReportRepository();
