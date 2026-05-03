import { describe, expect, it } from "vitest";
import { canDeleteMessage, canEditMessage, canReadChat, canWriteChat } from "@/lib/permissions";

describe("chat permissions", () => {
  const members = [
    { userId: "u1", role: "owner" as const },
    { userId: "u2", role: "member" as const }
  ];

  it("allows members to read and write", () => {
    expect(canReadChat("u1", members)).toBe(true);
    expect(canWriteChat("u2", members)).toBe(true);
  });

  it("rejects non-members", () => {
    expect(canReadChat("u3", members)).toBe(false);
    expect(canWriteChat("u3", members)).toBe(false);
  });
});

describe("message permissions", () => {
  it("allows author to edit and delete active message", () => {
    const message = { authorId: "u1", deletedAt: null };
    expect(canEditMessage("u1", message)).toBe(true);
    expect(canDeleteMessage("u1", message)).toBe(true);
  });

  it("rejects non-author and deleted messages", () => {
    expect(canEditMessage("u2", { authorId: "u1", deletedAt: null })).toBe(false);
    expect(canDeleteMessage("u1", { authorId: "u1", deletedAt: new Date() })).toBe(false);
  });
});
