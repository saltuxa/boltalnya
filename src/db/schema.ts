import { relations, sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  twitchId: text("twitch_id").unique(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email"),
  passwordHash: text("password_hash"),
  avatar: text("avatar"),
  status: text("status").notNull().default("Просто болтаю."),
  theme: text("theme", { enum: ["dark", "system"] }).notNull().default("dark"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state")
  },
  (account) => ({
    compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] })
  })
);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull()
});

export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull()
  },
  (token) => ({
    compoundKey: primaryKey({ columns: [token.identifier, token.token] })
  })
);

export const chats = sqliteTable("chats", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["direct", "group", "channel"] }).notNull().default("group"),
  title: text("title"),
  avatar: text("avatar"),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const chatMembers = sqliteTable(
  "chat_members",
  {
    chatId: text("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "admin", "member"] }).notNull().default("member"),
    muted: integer("muted", { mode: "boolean" }).notNull().default(false),
    lastReadMessageId: text("last_read_message_id"),
    joinedAt: integer("joined_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (member) => ({
    pk: primaryKey({ columns: [member.chatId, member.userId] })
  })
);

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  chatId: text("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  replyToId: text("reply_to_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  editedAt: integer("edited_at", { mode: "timestamp" }),
  deletedAt: integer("deleted_at", { mode: "timestamp" })
});

export const messageReactions = sqliteTable(
  "message_reactions",
  {
    messageId: text("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (reaction) => ({
    pk: primaryKey({ columns: [reaction.messageId, reaction.userId, reaction.emoji] })
  })
);

export const attachments = sqliteTable("attachments", {
  id: text("id").primaryKey(),
  messageId: text("message_id").references(() => messages.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["image", "file", "voice"] }).notNull(),
  url: text("url").notNull(),
  mime: text("mime"),
  size: integer("size"),
  metadata: text("metadata", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const pinnedMessages = sqliteTable(
  "pinned_messages",
  {
    chatId: text("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
    messageId: text("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
    pinnedById: text("pinned_by_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (pin) => ({
    pk: primaryKey({ columns: [pin.chatId, pin.messageId] })
  })
);

export const blockedUsers = sqliteTable(
  "blocked_users",
  {
    blockerId: text("blocker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    blockedId: text("blocked_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (block) => ({
    pk: primaryKey({ columns: [block.blockerId, block.blockedId] })
  })
);

export const browserSubscriptions = sqliteTable("browser_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  keys: text("keys", { mode: "json" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`)
}, (subscription) => ({
  endpointIdx: uniqueIndex("browser_subscriptions_endpoint_idx").on(subscription.endpoint)
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(chatMembers),
  messages: many(messages)
}));

export const chatsRelations = relations(chats, ({ many }) => ({
  members: many(chatMembers),
  messages: many(messages)
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] }),
  author: one(users, { fields: [messages.authorId], references: [users.id] }),
  reactions: many(messageReactions)
}));
