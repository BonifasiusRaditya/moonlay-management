export interface Branch {
  id: number;
  client_id: number;
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

