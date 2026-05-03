export type ChatType = "direct" | "group" | "channel";

export type ChatPreview = {
  id: string;
  type: ChatType;
  title: string;
  avatar: string | null;
  subtitle?: string;
  updatedAt: string;
  membersCount: number;
  lastMessage: {
    body: string;
    createdAt: string;
    authorName: string;
  } | null;
};

export type UserSearchResult = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  status: string;
};

export type ChatMemberDto = UserSearchResult & {
  role: "owner" | "admin" | "member";
  joinedAt: string;
};
