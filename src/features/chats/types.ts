export type ChatType = "direct" | "group" | "channel";

export type ChatPreview = {
  id: string;
  type: ChatType;
  title: string;
  avatar: string | null;
  updatedAt: string;
  membersCount: number;
  lastMessage: {
    body: string;
    createdAt: string;
    authorName: string;
  } | null;
};
