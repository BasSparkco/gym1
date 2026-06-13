export type UserRole = "owner" | "manager" | "front-desk";

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  tenant: {
    id: string;
    name: string;
  };
  branch: {
    id: string;
    name: string;
  };
};

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3002/api";