import { db } from '../db';
import { messages, InsertMessage, insertMessageSchema, users } from '../db/schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

type CreateMessageInput = z.infer<typeof insertMessageSchema>;

export class MessageRepository {
  async create(data: CreateMessageInput) {
    const [message] = await db
      .insert(messages)
      .values({
        ...data as InsertMessage,
        id: uuidv4(),
        isRead: 0,
        createdAt: Date.now()
      })
      .returning();
    return message;
  }

  async getConversation(userId1: string, userId2: string, productId?: string) {
    let condition = and(
      or(
        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
      )
    );

    if (productId) {
      condition = and(condition, eq(messages.productId, productId)) as typeof condition;
    }

    return await db
      .select()
      .from(messages)
      .where(condition)
      .orderBy(desc(messages.createdAt)); // 按时间降序排序，最新消息在前
  }

  async getConversationList(userId: string) {
    // Get distinct conversations for a user with latest message
    const result = await db
      .select({
        message: messages,
        sender: {
          id: users.id,
          name: users.name,
          avatar: users.avatar,
        },
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));
    
    // Deduplicate by other user ID, keeping only the latest message per conversation
    const seen = new Set<string>();
    const uniqueConversations = [];
    
    for (const item of result) {
      const otherUserId = item.message.senderId === userId ? item.message.receiverId : item.message.senderId;
      if (!seen.has(otherUserId)) {
        seen.add(otherUserId);
        uniqueConversations.push(item);
      }
    }
    
    return uniqueConversations;
  }

  async markAsRead(senderId: string, receiverId: string) {
    await db
      .update(messages)
      .set({ isRead: 1 })
      .where(and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId)));
  }

  async countUnread(userId: string) {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(eq(messages.receiverId, userId), eq(messages.isRead, 0)));
    return result?.count ?? 0;
  }
}

export const messageRepository = new MessageRepository();
