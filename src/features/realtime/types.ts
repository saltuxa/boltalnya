import type { MessageDto } from "@/features/messages/types";

export type ServerToClientEvents = {
  "message:created": (message: MessageDto) => void;
  "message:updated": (message: MessageDto) => void;
  "message:deleted": (payload: { id: string; chatId: string; deletedAt: string }) => void;
  "reaction:toggled": (message: MessageDto) => void;
  "typing:update": (payload: { chatId: string; userId: string; name: string; typing: boolean }) => void;
  "presence:update": (payload: { userId: string; online: boolean }) => void;
  "notification:new": (payload: { chatId: string; title: string; body: string }) => void;
};

export type ClientToServerEvents = {
  "chat:join": (payload: { chatId: string }) => void;
  "chat:leave": (payload: { chatId: string }) => void;
  "message:create": (
    payload: { chatId: string; body: string; replyToId?: string | null },
    ack?: (result: { ok: boolean; error?: string; message?: MessageDto }) => void
  ) => void;
  "message:update": (
    payload: { messageId: string; body: string },
    ack?: (result: { ok: boolean; error?: string; message?: MessageDto }) => void
  ) => void;
  "message:delete": (
    payload: { messageId: string },
    ack?: (result: { ok: boolean; error?: string }) => void
  ) => void;
  "reaction:toggle": (
    payload: { messageId: string; emoji: string },
    ack?: (result: { ok: boolean; error?: string; message?: MessageDto }) => void
  ) => void;
  "typing:start": (payload: { chatId: string }) => void;
  "typing:stop": (payload: { chatId: string }) => void;
};
