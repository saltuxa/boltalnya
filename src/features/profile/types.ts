export type ProfileDto = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  status: string;
  theme: "dark" | "system";
};
