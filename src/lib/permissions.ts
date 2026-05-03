export type Membership = { userId: string; role: "owner" | "admin" | "member" };
export type MessageOwner = { authorId: string; deletedAt?: Date | null };

export function canReadChat(userId: string, members: Membership[]) {
  return members.some((member) => member.userId === userId);
}

export function canWriteChat(userId: string, members: Membership[]) {
  return canReadChat(userId, members);
}

export function canEditMessage(userId: string, message: MessageOwner) {
  return message.authorId === userId && !message.deletedAt;
}

export function canDeleteMessage(userId: string, message: MessageOwner) {
  return message.authorId === userId && !message.deletedAt;
}
