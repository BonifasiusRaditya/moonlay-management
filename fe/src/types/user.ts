export type UserRole = string;

export interface User {
  id: string;
  name: string;
  email: string;
  role?: UserRole | null;
  client_id?: number | null;
  branch_id?: number | null;
  client?: {
    id: number;
    name: string;
    code: string;
  } | null;
  branch?: {
    id: number;
    name: string;
    code: string;
  } | null;
  must_change_password?: boolean | null;
  createdAt: string;
  updatedAt: string;
}

