import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { changeUserPassword } from '@/api/users';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { PageTransition } from '@/components/page_transition';
import { useUserStore } from '@/stores/userStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { requireAuthBeforeLoad } from '@/utils/route_guards';

function ForceChangePasswordPage() {
  const navigate = useNavigate();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const { user, setUser } = useUserStore();

  useEffect(() => {
    if (!user) {
      navigate({ to: '/login', replace: true });
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () => changeUserPassword(user!.id, formData),
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Password changed',
        message: 'Please log in with your new password if prompted.',
      });
      if (user) {
        setUser({ ...user, must_change_password: false });
      }
      navigate({ to: '/dashboard', replace: true });
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to change password. Please try again.';
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      addNotification({
        type: 'error',
        title: 'Change failed',
        message: errorMessage,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: Record<string, string> = {};
    if (!formData.current_password) {
      validationErrors.current_password = 'Current password is required';
    }
    if (!formData.new_password || formData.new_password.length < 6) {
      validationErrors.new_password = 'New password must be at least 6 characters';
    }
    if (formData.new_password !== formData.password_confirmation) {
      validationErrors.password_confirmation = 'Passwords do not match';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    mutation.mutate();
  };

  if (!user) {
    return null;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Change Your Password</h1>
          <p className="text-gray-600 mb-6">
            You must change your password before continuing.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                value={formData.current_password}
                onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                  errors.current_password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                }`}
              />
              {errors.current_password && (
                <p className="mt-1 text-sm text-red-600">{errors.current_password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={formData.new_password}
                onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                  errors.new_password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                }`}
              />
              {errors.new_password && (
                <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={formData.password_confirmation}
                onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                  errors.password_confirmation ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                }`}
              />
              {errors.password_confirmation && (
                <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Saving...' : 'Update Password'}
            </Button>
          </form>
        </Card>
      </div>
    </PageTransition>
  );
}

export const Route = createFileRoute('/force-change-password')({
  beforeLoad: async () => {
    const user = await requireAuthBeforeLoad();
    if (!user.must_change_password) {
      throw redirect({ to: '/dashboard', replace: true });
    }
  },
  component: ForceChangePasswordPage,
});
