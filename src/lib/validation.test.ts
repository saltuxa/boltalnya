import { describe, expect, it } from "vitest";
import { loginSchema, messageCreateSchema, registerSchema } from "@/lib/validation";

describe("validation", () => {
  it("accepts valid registration", () => {
    expect(registerSchema.safeParse({ name: "Аня", username: "anya", password: "password123" }).success).toBe(true);
  });

  it("accepts four-character password for MVP connector", () => {
    expect(registerSchema.safeParse({ name: "Аня", username: "anya", password: "1234" }).success).toBe(true);
  });

  it("rejects empty message", () => {
    expect(messageCreateSchema.safeParse({ body: "   " }).success).toBe(false);
  });

  it("accepts login payload", () => {
    expect(loginSchema.safeParse({ username: "anya", password: "password123" }).success).toBe(true);
  });
});
