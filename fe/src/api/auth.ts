import { apiClient } from './client';
import { loginSchema, type LoginInput } from '@/schemas/auth';
import type { LoginResponse, ApiLoginResponse } from '@/types/login_response';
import type { AuthUser } from '@/types/auth_user';

export type { LoginResponse };

export async function login(credentials: LoginInput): Promise<LoginResponse> {
  const validated = loginSchema.parse(credentials);
  
  try {
    const response = await apiClient.post<ApiLoginResponse | LoginResponse>('/auth/login', validated);
    
    // Handle both wrapped and unwrapped response structures
    let responseData: LoginResponse;
    
    if ('data' in response.data && typeof response.data.data === 'object' && response.data.data !== null) {
      // Wrapped response: { data: { token, user }, message }
      const wrapped = response.data as ApiLoginResponse;
      const user: AuthUser = {
        id: wrapped.data.user.id,
        name: wrapped.data.user.name,
        email: wrapped.data.user.email,
        role: wrapped.data.user.role,
        client_id: wrapped.data.user.client_id,
        branch_id: wrapped.data.user.branch_id,
        must_change_password: wrapped.data.user.must_change_password,
        permissions: wrapped.data.user.permissions || [],
      };
      responseData = {
        token: wrapped.data.token,
        user,
      };
    } else {
      // Unwrapped response: { token, user }
      const unwrapped = response.data as LoginResponse;
      responseData = {
        token: unwrapped.token,
        user: {
          ...unwrapped.user,
          must_change_password: (unwrapped.user as any).must_change_password ?? unwrapped.user.must_change_password,
          permissions: unwrapped.user.permissions || [],
        },
      };
    }
    
    return responseData;
  } catch (error: any) {
    // Log the error for debugging
    console.error('Login error:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
}

export async function logout() {
  try {
    await apiClient.post('/auth/logout');
  } catch (e) {
  }
}

