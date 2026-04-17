export interface Client {
  id: number;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  country?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

