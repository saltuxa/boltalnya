import { z } from "zod";

export const chatCreateSchema = z.object({
  title: z.string().trim().min(2).max(80),
  type: z.enum(["direct", "group", "channel"]).default("group"),
  memberIds: z.array(z.string()).default([])
});

export const messageCreateSchema = z.object({
  body: z.string().trim().min(1).max(4000),
  replyToId: z.string().nullable().optional()
});

export const messageUpdateSchema = z.object({
  body: z.string().trim().min(1).max(4000)
});

export const reactionToggleSchema = z.object({
  emoji: z.string().trim().min(1).max(16)
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(60),
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_а-яА-Я-]+$/),
  status: z.string().trim().max(120).default(""),
  theme: z.enum(["dark", "system"]).default("dark")
});

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_а-яА-Я-]+$/),
  password: z.string().min(4).max(128)
});

export const loginSchema = z.object({
  username: z.string().trim().min(3).max(64),
  password: z.string().min(1).max(128)
});
