export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  client_id?: number;
  branch_id?: number;
  must_change_password?: boolean;
  permissions?: string[];
}

