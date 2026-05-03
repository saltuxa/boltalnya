import { and, desc, eq, isNull, like, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { ensureDatabase } from "@/db/init";
import { chatMembers, chats, messageReactions, messages, users } from "@/db/schema";
import type { ChatPreview } from "@/features/chats/types";
import type { MessageDto } from "@/features/messages/types";
import { createId } from "@/lib/ids";

ensureDatabase();

export async function isChatMember(chatId: string, userId: string) {
  const member = await db.query.chatMembers.findFirst({
    where: and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, userId))
  });
  return Boolean(member);
}

export async function listChats(userId: string, query = ""): Promise<ChatPreview[]> {
  const rows = await db
    .select({
      id: chats.id,
      type: chats.type,
      title: chats.title,
      avatar: chats.avatar,
      updatedAt: chats.updatedAt
    })
    .from(chats)
    .innerJoin(chatMembers, eq(chatMembers.chatId, chats.id))
    .where(
      query
        ? and(eq(chatMembers.userId, userId), like(chats.title, `%${query}%`))
        : eq(chatMembers.userId, userId)
    )
    .orderBy(desc(chats.updatedAt));

  const previews = await Promise.all(
    rows.map(async (chat) => {
      const lastMessage = await db
        .select({
          body: messages.body,
          createdAt: messages.createdAt,
          authorName: users.name
        })
        .from(messages)
        .innerJoin(users, eq(users.id, messages.authorId))
        .where(and(eq(messages.chatId, chat.id), isNull(messages.deletedAt)))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      const membersCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(chatMembers)
        .where(eq(chatMembers.chatId, chat.id));

      return {
        id: chat.id,
        type: chat.type,
        title: chat.title ?? "Без названия",
        avatar: chat.avatar,
        updatedAt: chat.updatedAt.toISOString(),
        membersCount: membersCount[0]?.count ?? 0,
        lastMessage: lastMessage[0]
          ? {
              body: lastMessage[0].body,
              createdAt: lastMessage[0].createdAt.toISOString(),
              authorName: lastMessage[0].authorName
            }
          : null
      };
    })
  );

  return previews;
}

export async function createChat(input: {
  title: string;
  type: "direct" | "group" | "channel";
  ownerId: string;
  memberIds: string[];
}) {
  const id = createId("cht");
  await db.insert(chats).values({
    id,
    title: input.title,
    type: input.type,
    ownerId: input.ownerId
  });

  const uniqueMembers = Array.from(new Set([input.ownerId, ...input.memberIds]));
  await db.insert(chatMembers).values(
    uniqueMembers.map((userId) => ({
      chatId: id,
      userId,
      role: userId === input.ownerId ? ("owner" as const) : ("member" as const)
    }))
  );

  return id;
}

export async function listMessages(chatId: string, viewerId: string, search = ""): Promise<MessageDto[]> {
  if (!(await isChatMember(chatId, viewerId))) return [];

  const rows = await db
    .select({
      id: messages.id,
      chatId: messages.chatId,
      body: messages.body,
      replyToId: messages.replyToId,
      createdAt: messages.createdAt,
      editedAt: messages.editedAt,
      deletedAt: messages.deletedAt,
      authorId: users.id,
      authorName: users.name,
      authorUsername: users.username,
      authorAvatar: users.avatar
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.authorId))
    .where(
      search
        ? and(eq(messages.chatId, chatId), like(messages.body, `%${search}%`))
        : eq(messages.chatId, chatId)
    )
    .orderBy(messages.createdAt);

  return Promise.all(rows.map((row) => hydrateMessage(row, viewerId)));
}

export async function createMessage(input: {
  chatId: string;
  authorId: string;
  body: string;
  replyToId?: string | null;
}) {
  if (!(await isChatMember(input.chatId, input.authorId))) {
    throw new Error("Нет доступа к чату");
  }

  const id = createId("msg");
  await db.insert(messages).values({
    id,
    chatId: input.chatId,
    authorId: input.authorId,
    body: input.body,
    replyToId: input.replyToId ?? null
  });
  await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, input.chatId));
  return getMessageById(id, input.authorId);
}

export async function getMessageById(id: string, viewerId: string) {
  const row = await db
    .select({
      id: messages.id,
      chatId: messages.chatId,
      body: messages.body,
      replyToId: messages.replyToId,
      createdAt: messages.createdAt,
      editedAt: messages.editedAt,
      deletedAt: messages.deletedAt,
      authorId: users.id,
      authorName: users.name,
      authorUsername: users.username,
      authorAvatar: users.avatar
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.authorId))
    .where(eq(messages.id, id))
    .limit(1);

  if (!row[0] || !(await isChatMember(row[0].chatId, viewerId))) return null;
  return hydrateMessage(row[0], viewerId);
}

export async function updateMessage(id: string, userId: string, body: string) {
  const existing = await db.query.messages.findFirst({ where: eq(messages.id, id) });
  if (!existing || existing.authorId !== userId || existing.deletedAt) return null;

  await db
    .update(messages)
    .set({ body, editedAt: new Date(), updatedAt: new Date() })
    .where(eq(messages.id, id));
  return getMessageById(id, userId);
}

export async function deleteMessage(id: string, userId: string) {
  const existing = await db.query.messages.findFirst({ where: eq(messages.id, id) });
  if (!existing || existing.authorId !== userId || existing.deletedAt) return null;

  const deletedAt = new Date();
  await db
    .update(messages)
    .set({ body: "", deletedAt, updatedAt: deletedAt })
    .where(eq(messages.id, id));
  return { id, chatId: existing.chatId, deletedAt: deletedAt.toISOString() };
}

export async function toggleReaction(messageId: string, userId: string, emoji: string) {
  const message = await db.query.messages.findFirst({ where: eq(messages.id, messageId) });
  if (!message || !(await isChatMember(message.chatId, userId))) return null;

  const existing = await db.query.messageReactions.findFirst({
    where: and(
      eq(messageReactions.messageId, messageId),
      eq(messageReactions.userId, userId),
      eq(messageReactions.emoji, emoji)
    )
  });

  if (existing) {
    await db
      .delete(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, userId),
          eq(messageReactions.emoji, emoji)
        )
      );
  } else {
    await db.insert(messageReactions).values({ messageId, userId, emoji });
  }

  return getMessageById(messageId, userId);
}

async function hydrateMessage(
  row: {
    id: string;
    chatId: string;
    body: string;
    replyToId: string | null;
    createdAt: Date;
    editedAt: Date | null;
    deletedAt: Date | null;
    authorId: string;
    authorName: string;
    authorUsername: string;
    authorAvatar: string | null;
  },
  viewerId: string
): Promise<MessageDto> {
  const reactions = await db
    .select({
      emoji: messageReactions.emoji,
      count: sql<number>`count(*)`,
      reactedByMe: sql<number>`sum(case when ${messageReactions.userId} = ${viewerId} then 1 else 0 end)`
    })
    .from(messageReactions)
    .where(eq(messageReactions.messageId, row.id))
    .groupBy(messageReactions.emoji);

  return {
    id: row.id,
    chatId: row.chatId,
    body: row.deletedAt ? "Сообщение удалено" : row.body,
    replyToId: row.replyToId,
    createdAt: row.createdAt.toISOString(),
    editedAt: row.editedAt?.toISOString() ?? null,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    author: {
      id: row.authorId,
      name: row.authorName,
      username: row.authorUsername,
      avatar: row.authorAvatar
    },
    reactions: reactions.map((reaction) => ({
      emoji: reaction.emoji,
      count: Number(reaction.count),
      reactedByMe: Number(reaction.reactedByMe) > 0
    }))
  };
}
