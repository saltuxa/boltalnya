import { describe, expect, it } from "vitest";
import { loginSchema, messageCreateSchema, registerSchema } from "@/lib/validation";

describe("validation", () => {
  it("accepts valid registration", () => {
    expect(registerSchema.safeParse({ name: "Аня", username: "anya", password: "password123" }).success).toBe(true);
  });

  it("rejects short password", () => {
    expect(registerSchema.safeParse({ name: "Аня", username: "anya", password: "123" }).success).toBe(false);
  });

  it("rejects empty message", () => {
    expect(messageCreateSchema.safeParse({ body: "   " }).success).toBe(false);
  });

  it("accepts login payload", () => {
    expect(loginSchema.safeParse({ username: "anya", password: "password123" }).success).toBe(true);
  });
});
