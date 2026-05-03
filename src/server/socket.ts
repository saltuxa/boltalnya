import type { Server } from "socket.io";
import { createMessage, deleteMessage, isChatMember, toggleReaction, updateMessage } from "@/db/queries";
import type { ClientToServerEvents, ServerToClientEvents } from "@/features/realtime/types";
import { messageCreateSchema, messageUpdateSchema, reactionToggleSchema } from "@/lib/validation";
import { clearTyping, markOffline, markOnline, setTypingTtl } from "@/server/presence";

type InterServerEvents = Record<string, never>;
type SocketData = {
  userId: string;
  name: string;
};

export function registerRealtimeHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) {
  io.on("connection", (socket) => {
    markOnline(socket.data.userId);
    io.emit("presence:update", { userId: socket.data.userId, online: true });

    socket.on("chat:join", async ({ chatId }) => {
      if (await isChatMember(chatId, socket.data.userId)) {
        socket.join(chatId);
      }
    });

    socket.on("chat:leave", ({ chatId }) => {
      socket.leave(chatId);
    });

    socket.on("message:create", async (payload, ack) => {
      try {
        const input = messageCreateSchema.parse(payload);
        const message = await createMessage({
          chatId: payload.chatId,
          authorId: socket.data.userId,
          body: input.body,
          replyToId: input.replyToId
        });
        if (!message) throw new Error("Сообщение не создано");
        io.to(payload.chatId).emit("message:created", message);
        socket.to(payload.chatId).emit("notification:new", {
          chatId: payload.chatId,
          title: socket.data.name,
          body: message.body
        });
        ack?.({ ok: true, message });
      } catch (error) {
        ack?.({ ok: false, error: error instanceof Error ? error.message : "Ошибка отправки" });
      }
    });

    socket.on("message:update", async (payload, ack) => {
      try {
        const input = messageUpdateSchema.parse({ body: payload.body });
        const message = await updateMessage(payload.messageId, socket.data.userId, input.body);
        if (!message) throw new Error("Сообщение не найдено или нет прав");
        io.to(message.chatId).emit("message:updated", message);
        ack?.({ ok: true, message });
      } catch (error) {
        ack?.({ ok: false, error: error instanceof Error ? error.message : "Ошибка редактирования" });
      }
    });

    socket.on("message:delete", async (payload, ack) => {
      try {
        const deleted = await deleteMessage(payload.messageId, socket.data.userId);
        if (!deleted) throw new Error("Сообщение не найдено или нет прав");
        io.to(deleted.chatId).emit("message:deleted", deleted);
        ack?.({ ok: true });
      } catch (error) {
        ack?.({ ok: false, error: error instanceof Error ? error.message : "Ошибка удаления" });
      }
    });

    socket.on("reaction:toggle", async (payload, ack) => {
      try {
        const input = reactionToggleSchema.parse({ emoji: payload.emoji });
        const message = await toggleReaction(payload.messageId, socket.data.userId, input.emoji);
        if (!message) throw new Error("Сообщение не найдено или нет прав");
        io.to(message.chatId).emit("reaction:toggled", message);
        ack?.({ ok: true, message });
      } catch (error) {
        ack?.({ ok: false, error: error instanceof Error ? error.message : "Ошибка реакции" });
      }
    });

    socket.on("typing:start", async ({ chatId }) => {
      if (!(await isChatMember(chatId, socket.data.userId))) return;
      const key = `${chatId}:${socket.data.userId}`;
      socket.to(chatId).emit("typing:update", {
        chatId,
        userId: socket.data.userId,
        name: socket.data.name,
        typing: true
      });
      setTypingTtl(key, () => {
        socket.to(chatId).emit("typing:update", {
          chatId,
          userId: socket.data.userId,
          name: socket.data.name,
          typing: false
        });
      });
    });

    socket.on("typing:stop", ({ chatId }) => {
      const key = `${chatId}:${socket.data.userId}`;
      clearTyping(key);
      socket.to(chatId).emit("typing:update", {
        chatId,
        userId: socket.data.userId,
        name: socket.data.name,
        typing: false
      });
    });

    socket.on("disconnect", () => {
      const wentOffline = markOffline(socket.data.userId);
      if (wentOffline) {
        io.emit("presence:update", { userId: socket.data.userId, online: false });
      }
    });
  });
}
