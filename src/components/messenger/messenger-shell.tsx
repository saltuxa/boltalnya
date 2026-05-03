"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Edit3,
  LogOut,
  MessageSquarePlus,
  MoreHorizontal,
  Reply,
  Search,
  Send,
  Settings,
  Smile,
  Trash2,
  UserPlus
} from "lucide-react";
import { io, type Socket } from "socket.io-client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import type { ChatMemberDto, ChatPreview, UserSearchResult } from "@/features/chats/types";
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
  const [members, setMembers] = useState<ChatMemberDto[]>([]);
  const [chatQuery, setChatQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [memberResults, setMemberResults] = useState<UserSearchResult[]>([]);
  const [messageQuery, setMessageQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<MessageDto | null>(null);
  const [editing, setEditing] = useState<MessageDto | null>(null);
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;
  const groupedTyping = useMemo(() => typingNames.slice(0, 2).join(", "), [typingNames]);

  const refreshChats = useCallback(async (query = "") => {
    const response = await fetch(`/api/chats${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    const data = await response.json();
    setChats(data.chats ?? []);
  }, []);

  const refreshMembers = useCallback(async (chatId: string) => {
    const response = await fetch(`/api/chats/${chatId}/members`);
    const data = await response.json();
    setMembers(data.members ?? []);
  }, []);

  useEffect(() => {
    searchUsers(userQuery, "sidebar");
  }, [userQuery]);

  useEffect(() => {
    searchUsers(memberQuery, "members");
  }, [memberQuery]);

  async function searchUsers(query: string, target: "sidebar" | "members") {
    if (query.trim().length < 2) {
      if (target === "sidebar") {
        setUserResults([]);
      } else {
        setMemberResults([]);
      }
      return;
    }

    const response = await fetch(`/api/users?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    const results = (data.users ?? []) as UserSearchResult[];
    if (target === "sidebar") {
      setUserResults(results);
    } else {
      setMemberResults(results);
    }
  }

  useEffect(() => {
    setHydrated(true);
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
    refreshMembers(activeChatId);

    return () => {
      socket?.emit("chat:leave", { chatId: activeChatId });
    };
  }, [activeChatId, messageQuery, refreshMembers, socket]);

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

  async function openDirectChat(peerId: string) {
    const response = await fetch("/api/chats/direct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: peerId })
    });
    const data = await response.json();
    if (!response.ok) return;
    setChats(data.chats ?? []);
    setActiveChatId(data.id);
    setUserQuery("");
    setUserResults([]);
  }

  async function addMember(userId: string) {
    if (!activeChatId) return;
    const response = await fetch(`/api/chats/${activeChatId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [userId] })
    });
    const data = await response.json();
    if (!response.ok) return;
    setMembers(data.members ?? []);
    setMemberQuery("");
    setMemberResults([]);
    refreshChats(chatQuery);
  }

  async function submitMessage() {
    if (!activeChatId || !draft.trim()) return;
    const body = draft;
    setDraft("");

    if (editing) {
      const response = await fetch(`/api/messages/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body })
      });
      const data = await response.json();
      if (response.ok && data.message) {
        setMessages((items) => items.map((item) => (item.id === data.message.id ? data.message : item)));
      } else {
        setDraft(body);
      }
      setEditing(null);
      return;
    }

    const response = await fetch(`/api/chats/${activeChatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, replyToId: replyTo?.id })
    });
    const data = await response.json();
    if (response.ok && data.message) {
      setMessages((items) => (items.some((item) => item.id === data.message.id) ? items : [...items, data.message]));
      refreshChats(chatQuery);
    } else {
      setDraft(body);
    }
    setReplyTo(null);
  }

  function startTyping(value: string) {
    setDraft(value);
    if (!activeChatId) return;
    socket?.emit(value ? "typing:start" : "typing:stop", { chatId: activeChatId });
  }

  return (
    <main
      className="grid h-screen grid-cols-[320px_minmax(0,1fr)_300px] bg-[#0F0F0F] text-neutral-100 max-xl:grid-cols-[300px_minmax(0,1fr)] max-md:grid-cols-1"
      data-ready={hydrated ? "true" : "false"}
    >
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
              <Button size="icon" variant="ghost" title="Выйти" onClick={() => void signOutToHome()}>
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

          <div className="mt-2">
            <Input
              value={userQuery}
              onChange={(event) => setUserQuery(event.target.value)}
              placeholder="Найти пользователя"
            />
            {userResults.length > 0 && (
              <div className="mt-2 max-h-44 overflow-y-auto rounded-md border border-neutral-800 bg-neutral-950 p-1">
                {userResults.map((user) => (
                  <div key={user.id} className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-neutral-900">
                    <Avatar src={user.avatar} name={user.name} className="h-7 w-7" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{user.name}</div>
                      <div className="truncate text-xs text-neutral-500">@{user.username}</div>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => openDirectChat(user.id)}>
                      Написать
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
                {chat.lastMessage
                  ? `${chat.lastMessage.authorName}: ${chat.lastMessage.body}`
                  : chat.subtitle ?? `${chat.membersCount} участников`}
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
                  {groupedTyping ? `${groupedTyping} печатает...` : activeChat.subtitle ?? `${activeChat.membersCount} участников`}
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
                      void submitMessage();
                    }
                  }}
                  placeholder="Написать сообщение"
                />
                <Button size="icon" variant="primary" onClick={() => void submitMessage()} title="Отправить">
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
        <h2 className="text-sm font-semibold">{activeChat?.type === "direct" ? "Профиль" : "Участники"}</h2>
        {activeChat ? (
          <>
            <div className="mt-4 space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2">
                  <Avatar src={member.avatar} name={member.name} className="h-8 w-8" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{member.name}</div>
                    <div className="truncate text-xs text-neutral-500">@{member.username}</div>
                  </div>
                  <span className="text-xs text-neutral-500">{member.role}</span>
                </div>
              ))}
            </div>

            {activeChat.type === "group" && (
              <div className="mt-5">
                <label className="mb-2 block text-xs font-medium text-neutral-500">Добавить участника</label>
                <Input
                  value={memberQuery}
                  onChange={(event) => setMemberQuery(event.target.value)}
                  placeholder="Найти пользователя"
                />
                {memberResults.length > 0 && (
                  <div className="mt-2 max-h-52 overflow-y-auto rounded-md border border-neutral-800 bg-neutral-950 p-1">
                    {memberResults
                      .filter((user) => !members.some((member) => member.id === user.id))
                      .map((user) => (
                        <div key={user.id} className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-neutral-900">
                          <Avatar src={user.avatar} name={user.name} className="h-7 w-7" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm">{user.name}</div>
                            <div className="truncate text-xs text-neutral-500">@{user.username}</div>
                          </div>
                          <Button size="icon" variant="secondary" onClick={() => addMember(user.id)} title="Добавить участника">
                            <UserPlus size={15} />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm leading-6 text-neutral-500">Чат не выбран.</p>
        )}
      </aside>
    </main>
  );
}

async function signOutToHome() {
  const csrfResponse = await fetch("/api/auth/csrf");
  const csrf = await csrfResponse.json();
  await fetch("/api/auth/signout", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken: csrf.csrfToken,
      json: "true"
    })
  });
  window.location.href = "/";
}
