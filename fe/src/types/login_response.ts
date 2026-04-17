import type { AuthUser } from './auth_user';

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface ApiLoginResponse {
  data: {
    token: string;
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
      client_id?: number;
      branch_id?: number;
      must_change_password?: boolean;
      permissions?: string[];
    };
  };
  message?: string;
}

