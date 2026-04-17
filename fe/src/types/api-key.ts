export interface ApiKey {
  id: number;
  client_id: number;
  key_prefix: string;
  name: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  expires_in_days: number | null;
  last_used_at?: string | null;
}

export interface ApiKeyWithToken extends ApiKey {
  key: string; // Only present when first created
}

export interface CreateApiKeyDTO {
  client_id: number;
  name?: string;
  expires_at?: string | null;
  last_used_at?: string | null;
}

export interface UpdateApiKeyDTO {
  name?: string;
  expires_at?: string | null;
  is_active?: boolean;
  last_used_at?: string | null;
}

