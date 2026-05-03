import { describe, expect, it } from "vitest";
import {
  chatMembersAddSchema,
  directChatSchema,
  loginSchema,
  messageCreateSchema,
  registerSchema,
  userSearchSchema
} from "@/lib/validation";

describe("validation", () => {
  it("accepts valid registration", () => {
    expect(registerSchema.safeParse({ name: "Аня", username: "anya", password: "password123" }).success).toBe(true);
  });

  it("accepts four-character password for MVP connector", () => {
    expect(registerSchema.safeParse({ name: "Аня", username: "anya", password: "1234" }).success).toBe(true);
  });

  it("accepts direct chat payload", () => {
    expect(directChatSchema.safeParse({ userId: "usr_1" }).success).toBe(true);
  });

  it("accepts group member payload", () => {
    expect(chatMembersAddSchema.safeParse({ userIds: ["usr_2"] }).success).toBe(true);
  });

  it("requires at least two characters for user search", () => {
    expect(userSearchSchema.safeParse({ q: "a" }).success).toBe(false);
    expect(userSearchSchema.safeParse({ q: "an" }).success).toBe(true);
  });

  it("rejects empty message", () => {
    expect(messageCreateSchema.safeParse({ body: "   " }).success).toBe(false);
  });

  it("accepts login payload", () => {
    expect(loginSchema.safeParse({ username: "anya", password: "password123" }).success).toBe(true);
  });
});
