const onlineUsers = new Map<string, number>();
const typingTimers = new Map<string, NodeJS.Timeout>();

export function markOnline(userId: string) {
  onlineUsers.set(userId, (onlineUsers.get(userId) ?? 0) + 1);
  return true;
}

export function markOffline(userId: string) {
  const current = onlineUsers.get(userId) ?? 0;
  if (current <= 1) {
    onlineUsers.delete(userId);
    return true;
  }
  onlineUsers.set(userId, current - 1);
  return false;
}

export function isOnline(userId: string) {
  return onlineUsers.has(userId);
}

export function setTypingTtl(key: string, stop: () => void) {
  const existing = typingTimers.get(key);
  if (existing) clearTimeout(existing);
  typingTimers.set(
    key,
    setTimeout(() => {
      typingTimers.delete(key);
      stop();
    }, 3500)
  );
}

export function clearTyping(key: string) {
  const existing = typingTimers.get(key);
  if (existing) clearTimeout(existing);
  typingTimers.delete(key);
}
