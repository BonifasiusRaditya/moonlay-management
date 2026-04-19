import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { login } from '@/api/auth';
import { loginSchema, type LoginInput } from '@/schemas/auth';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useUserStore } from '@/Session/userSession';
import { useNotificationStore } from '@/Session/notificationSession';
import { ensureAuthenticatedUser } from '@/Session/userSession';
import xerbaLogo from '@/assets/xerba_seamly_logo.png';

function LoginPage() {
  const navigate = useNavigate();
  const { user, setUser } = useUserStore();
  const addNotification = useNotificationStore((state) => state.addNotification);
  
  // Redirect if already logged in
  useEffect(() => {
    const verifySession = async () => {
      const sessionUser = user ?? await ensureAuthenticatedUser();
      if (!sessionUser) {
        return;
      }

      if (sessionUser.must_change_password) {
        navigate({ to: '/force-change-password', replace: true });
      } else {
        navigate({ to: '/dashboard', replace: true });
      }
    };

    verifySession();
  }, [user, navigate]);

  const [formData, setFormData] = useState<LoginInput>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      if (data.user) {
        setUser(data.user);
      }
      addNotification({
        type: 'success',
        title: 'Login successful',
        message: 'Welcome to Xerba - Seamly.',
      });
      if (data.user?.must_change_password) {
        navigate({ to: '/force-change-password' });
      } else {
        navigate({ to: '/dashboard' });
      }
    },
    onError: (error: unknown) => {
      console.error('Login error details:', error);
      
      // Extract error message from various possible response formats
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        if (axiosError.response?.data) {
          const data = axiosError.response.data;
          if (typeof data === 'string') {
            errorMessage = data;
          } else if (data && typeof data === 'object') {
            if ('error' in data && typeof data.error === 'string') {
              errorMessage = data.error;
            } else if ('message' in data && typeof data.message === 'string') {
              errorMessage = data.message;
            } else if ('errors' in data && Array.isArray(data.errors)) {
              errorMessage = data.errors
                .map((e: unknown) => {
                  if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
                    return e.message;
                  }
                  return String(e);
                })
                .join(', ');
            }
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setErrors({ submit: errorMessage });
      addNotification({
        type: 'error',
        title: 'Login failed',
        message: errorMessage,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    loginMutation.mutate(result.data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <img 
            src={xerbaLogo} 
            alt="Xerba - Seamly Logo" 
            className="h-16 w-auto mb-4"
          />
          <p className="text-lg font-semibold text-gray-800">Xerba - Seamly</p>
          <p className="text-center text-gray-600">Orchestrating Corporate Automation with Confidence</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full bg-[#1a5a4d]"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/login')({
  component: LoginPage,
});
