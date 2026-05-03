export type MessageDto = {
  id: string;
  chatId: string;
  body: string;
  replyToId: string | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  reactions: Array<{
    emoji: string;
    count: number;
    reactedByMe: boolean;
  }>;
};
