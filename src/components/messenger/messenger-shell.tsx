"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, Edit3, LogOut, MessageSquarePlus, MoreHorizontal, Reply, Search, Send, Settings, Smile, Trash2 } from "lucide-react";
import { io, type Socket } from "socket.io-client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import type { ChatPreview } from "@/features/chats/types";
import type { MessageDto } from "@/features/messages/types";
import type { ClientToServerEvents, ServerToClientEvents } from "@/features/realtime/types";
import { cn, shortTime } from "@/lib/utils";

type User = {
  id: string;
  name?: string | null;
  image?: string | null;
  username?: string;
};

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function MessengerShell({ currentUser, initialChats }: { currentUser: User; initialChats: ChatPreview[] }) {
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [chats, setChats] = useState(initialChats);
  const [activeChatId, setActiveChatId] = useState(initialChats[0]?.id ?? "");
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [chatQuery, setChatQuery] = useState("");
  const [messageQuery, setMessageQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<MessageDto | null>(null);
  const [editing, setEditing] = useState<MessageDto | null>(null);
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState("");

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;

  const refreshChats = useCallback(async (query = "") => {
    const response = await fetch(`/api/chats${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    const data = await response.json();
    setChats(data.chats ?? []);
  }, []);

  useEffect(() => {
    const nextSocket: TypedSocket = io({ path: "/api/socket" });
    setSocket(nextSocket);

    nextSocket.on("message:created", (message) => {
      setMessages((items) => (items.some((item) => item.id === message.id) ? items : [...items, message]));
      refreshChats(chatQuery);
    });
    nextSocket.on("message:updated", (message) => {
      setMessages((items) => items.map((item) => (item.id === message.id ? message : item)));
    });
    nextSocket.on("message:deleted", (payload) => {
      setMessages((items) =>
        items.map((item) =>
          item.id === payload.id ? { ...item, body: "Сообщение удалено", deletedAt: payload.deletedAt } : item
        )
      );
    });
    nextSocket.on("reaction:toggled", (message) => {
      setMessages((items) => items.map((item) => (item.id === message.id ? message : item)));
    });
    nextSocket.on("typing:update", (payload) => {
      if (payload.userId === currentUser.id) return;
      setTypingNames((items) => {
        const without = items.filter((name) => name !== payload.name);
        return payload.typing ? [...without, payload.name] : without;
      });
    });
    nextSocket.on("notification:new", (payload) => {
      if (document.visibilityState === "visible" || Notification.permission !== "granted") return;
      new Notification(payload.title, { body: payload.body, tag: payload.chatId });
    });

    return () => {
      nextSocket.disconnect();
    };
  }, [chatQuery, currentUser.id, refreshChats]);

  useEffect(() => {
    if (!activeChatId) return;
    socket?.emit("chat:join", { chatId: activeChatId });
    setLoadingMessages(true);
    fetch(`/api/chats/${activeChatId}/messages${messageQuery ? `?q=${encodeURIComponent(messageQuery)}` : ""}`)
      .then((response) => response.json())
      .then((data) => setMessages(data.messages ?? []))
      .finally(() => setLoadingMessages(false));

    return () => {
      socket?.emit("chat:leave", { chatId: activeChatId });
    };
  }, [activeChatId, messageQuery, socket]);

  const groupedTyping = useMemo(() => typingNames.slice(0, 2).join(", "), [typingNames]);

  async function createChat() {
    if (!newChatTitle.trim()) return;
    const response = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newChatTitle, type: "group", memberIds: [] })
    });
    const data = await response.json();
    setNewChatTitle("");
    setChats(data.chats ?? []);
    setActiveChatId(data.id);
  }

  function submitMessage() {
    if (!activeChatId || !draft.trim()) return;
    const body = draft;
    setDraft("");

    if (editing) {
      socket?.emit("message:update", { messageId: editing.id, body }, (result) => {
        if (!result.ok) setDraft(body);
      });
      setEditing(null);
      return;
    }

    socket?.emit(
      "message:create",
      { chatId: activeChatId, body, replyToId: replyTo?.id },
      (result) => {
        if (!result.ok) setDraft(body);
      }
    );
    setReplyTo(null);
  }

  function startTyping(value: string) {
    setDraft(value);
    if (!activeChatId) return;
    socket?.emit(value ? "typing:start" : "typing:stop", { chatId: activeChatId });
  }

  return (
    <main className="grid h-screen grid-cols-[320px_minmax(0,1fr)_300px] bg-[#0F0F0F] text-neutral-100 max-xl:grid-cols-[300px_minmax(0,1fr)] max-md:grid-cols-1">
      <aside className={cn("flex min-h-0 flex-col border-r border-neutral-800 bg-[#111111]", activeChatId && "max-md:hidden")}>
        <div className="border-b border-neutral-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={currentUser.image} name={currentUser.name} className="h-9 w-9" />
              <div>
                <div className="text-sm font-semibold">{currentUser.name}</div>
                <div className="text-xs text-neutral-500">@{currentUser.username}</div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" title="Настройки">
                <Link href="/settings">
                  <Settings size={17} />
                </Link>
              </Button>
              <Button size="icon" variant="ghost" title="Выйти" onClick={() => signOut({ callbackUrl: "/" })}>
                <LogOut size={17} />
              </Button>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Input
              value={chatQuery}
              onChange={(event) => {
                setChatQuery(event.target.value);
                refreshChats(event.target.value);
              }}
              placeholder="Поиск чатов"
            />
            <Button size="icon" title="Поиск">
              <Search size={17} />
            </Button>
          </div>
          <div className="mt-2 flex gap-2">
            <Input value={newChatTitle} onChange={(event) => setNewChatTitle(event.target.value)} placeholder="Новая группа" />
            <Button size="icon" variant="primary" onClick={createChat} title="Создать чат">
              <MessageSquarePlus size={17} />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {chats.length === 0 && <p className="px-3 py-8 text-center text-sm text-neutral-500">Пока нет чатов</p>}
          {chats.map((chat) => (
            <button
              key={chat.id}
              className={cn(
                "focus-ring mb-1 w-full rounded-md border px-3 py-3 text-left transition-colors",
                activeChatId === chat.id
                  ? "border-blue-500/35 bg-blue-500/10"
                  : "border-transparent hover:bg-neutral-900"
              )}
              onClick={() => setActiveChatId(chat.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium">{chat.title}</span>
                <span className="text-xs text-neutral-500">{shortTime(chat.updatedAt)}</span>
              </div>
              <p className="mt-1 truncate text-xs text-neutral-500">
                {chat.lastMessage ? `${chat.lastMessage.authorName}: ${chat.lastMessage.body}` : `${chat.membersCount} участников`}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-h-0 flex-col bg-[#0F0F0F]">
        {activeChat ? (
          <>
            <header className="flex h-16 items-center justify-between border-b border-neutral-800 px-4">
              <div>
                <h1 className="text-base font-semibold">{activeChat.title}</h1>
                <p className="text-xs text-neutral-500">
                  {groupedTyping ? `${groupedTyping} печатает...` : `${activeChat.membersCount} участников`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={messageQuery}
                  onChange={(event) => setMessageQuery(event.target.value)}
                  placeholder="Поиск сообщений"
                  className="w-52 max-sm:hidden"
                />
                <Button size="icon" variant="ghost" onClick={() => Notification.requestPermission()} title="Уведомления">
                  <Bell size={17} />
                </Button>
                <Button size="icon" variant="ghost" title="Ещё">
                  <MoreHorizontal size={17} />
                </Button>
              </div>
            </header>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {loadingMessages && <p className="text-center text-sm text-neutral-500">Загружаем сообщения...</p>}
              {!loadingMessages && messages.length === 0 && (
                <p className="py-12 text-center text-sm text-neutral-500">Здесь пока тихо. Напишите первым.</p>
              )}
              {messages.map((message) => {
                const mine = message.author.id === currentUser.id;
                return (
                  <article key={message.id} className={cn("group flex gap-3", mine && "justify-end")}>
                    {!mine && <Avatar src={message.author.avatar} name={message.author.name} className="mt-1 h-8 w-8" />}
                    <div className={cn("max-w-[74%] max-sm:max-w-[88%]", mine && "items-end")}>
                      <div className={cn("mb-1 flex items-center gap-2 text-xs text-neutral-500", mine && "justify-end")}>
                        <span>{message.author.name}</span>
                        <span>{shortTime(message.createdAt)}</span>
                        {message.editedAt && <span>изменено</span>}
                      </div>
                      <div
                        className={cn(
                          "rounded-lg px-4 py-3 text-sm leading-6",
                          mine ? "bg-blue-500 text-white" : "border border-neutral-800 bg-neutral-900 text-neutral-100",
                          message.deletedAt && "italic opacity-60"
                        )}
                      >
                        {message.replyToId && <div className="mb-2 border-l border-current/30 pl-2 text-xs opacity-70">Ответ</div>}
                        {message.body}
                      </div>
                      <div className={cn("mt-1 flex flex-wrap gap-1 opacity-0 transition-opacity group-hover:opacity-100", mine && "justify-end")}>
                        {["👍", "❤️", "😂"].map((emoji) => (
                          <button
                            key={emoji}
                            className="rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs"
                            onClick={() => socket?.emit("reaction:toggle", { messageId: message.id, emoji })}
                          >
                            {emoji}
                          </button>
                        ))}
                        <button className="rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs" onClick={() => setReplyTo(message)}>
                          <Reply size={13} />
                        </button>
                        {mine && !message.deletedAt && (
                          <>
                            <button
                              className="rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs"
                              onClick={() => {
                                setEditing(message);
                                setDraft(message.body);
                              }}
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-200"
                              onClick={() => socket?.emit("message:delete", { messageId: message.id })}
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                      {message.reactions.length > 0 && (
                        <div className={cn("mt-1 flex gap-1", mine && "justify-end")}>
                          {message.reactions.map((reaction) => (
                            <span key={reaction.emoji} className="rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs">
                              {reaction.emoji} {reaction.count}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <footer className="border-t border-neutral-800 p-4">
              {(replyTo || editing) && (
                <div className="mb-2 flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-400">
                  <span>{editing ? "Редактирование сообщения" : `Ответ: ${replyTo?.body}`}</span>
                  <button onClick={() => { setReplyTo(null); setEditing(null); setDraft(""); }}>Сбросить</button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <Button size="icon" variant="ghost" title="Эмодзи">
                  <Smile size={17} />
                </Button>
                <Textarea
                  value={draft}
                  onChange={(event) => startTyping(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      submitMessage();
                    }
                  }}
                  placeholder="Написать сообщение"
                />
                <Button size="icon" variant="primary" onClick={submitMessage} title="Отправить">
                  <Send size={17} />
                </Button>
              </div>
            </footer>
          </>
        ) : (
          <div className="grid flex-1 place-items-center px-5 text-center">
            <div>
              <h1 className="text-xl font-semibold">Выберите чат</h1>
              <p className="mt-2 text-sm text-neutral-500">Или создайте новую группу слева.</p>
            </div>
          </div>
        )}
      </section>

      <aside className="border-l border-neutral-800 bg-[#111111] p-4 max-xl:hidden">
        <h2 className="text-sm font-semibold">Информация</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          {activeChat ? "Групповой чат, реакции, ответы, редактирование и удаление сообщений уже доступны." : "Чат не выбран."}
        </p>
      </aside>
    </main>
  );
}
