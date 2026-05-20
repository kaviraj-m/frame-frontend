export type AdminUserRow = {
  id: string;
  username: string;
  email?: string;
  role: string;
  isActive: boolean;
};

export type AdminUserCreateBody = {
  username: string;
  email: string;
  password: string;
  role: string;
};

export type AdminUserUpdateBody = {
  username: string;
  email: string;
  role: string;
  isActive: boolean;
};
