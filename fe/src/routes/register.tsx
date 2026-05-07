import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { register } from '@/api/auth';
import { registerSchema, type RegisterInput } from '@/schemas/auth';
import { useUserStore } from '@/Session/userSession';
import { useNotificationStore } from '@/Session/notificationSession';

function RegisterPage() {
  const navigate = useNavigate();
  const { user, setUser } = useUserStore();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<Record<keyof RegisterInput, string>>({
    client_id: '1',
    branch_id: '',
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'staff',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});



  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      if (data.user) setUser(data.user);
      addNotification({
        type: 'success',
        title: 'Register successful',
        message: 'Account has been created successfully.',
      });

      if (data.user?.must_change_password) {
        navigate({ to: '/force-change-password' });
      } else {
        navigate({ to: '/dashboard' });
      }
    },
    onError: (error: unknown) => {
      console.error('Register error details:', error);
      let errorMessage = 'Registration failed. Please check the form data.';

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
                  if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') return e.message;
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
      addNotification({ type: 'error', title: 'Registration failed', message: errorMessage });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    registerMutation.mutate(result.data);
  };

  return (
    <div className="min-h-screen bg-[#f0f0eb] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-[#d8dbe6] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="hidden lg:flex flex-col justify-between bg-[#002072] text-white p-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/60">Create Account</p>
              <h1 className="mt-4 text-4xl font-black leading-tight">Buat akun baru untuk mengakses sistem keuangan.</h1>
              <p className="mt-4 text-sm text-white/75">Isi data client, branch, dan role sesuai struktur organisasi Anda.</p>
            </div>
            <div className="text-xs text-white/45">FinIcore Labs</div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-6 text-center lg:text-left">
              <h2 className="text-2xl font-extrabold text-[#191c1e]">Daftar Akun</h2>
              <p className="mt-1 text-sm text-[#444652]">Lengkapi form di bawah untuk membuat akun baru.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#191c1e] mb-1" htmlFor="client_id">Client ID</label>
                <input id="client_id" type="number" value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#002072] focus:ring-4 focus:ring-[#002072]/10" />
                {errors.client_id && <p className="mt-1 text-sm text-[#ba1a1a]">{errors.client_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#191c1e] mb-1" htmlFor="branch_id">Branch ID (opsional)</label>
                <input id="branch_id" type="number" value={formData.branch_id} onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#002072] focus:ring-4 focus:ring-[#002072]/10" />
                {errors.branch_id && <p className="mt-1 text-sm text-[#ba1a1a]">{errors.branch_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#191c1e] mb-1" htmlFor="name">Nama Lengkap</label>
                <input id="name" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#002072] focus:ring-4 focus:ring-[#002072]/10" />
                {errors.name && <p className="mt-1 text-sm text-[#ba1a1a]">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#191c1e] mb-1" htmlFor="email">Email</label>
                <input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#002072] focus:ring-4 focus:ring-[#002072]/10" />
                {errors.email && <p className="mt-1 text-sm text-[#ba1a1a]">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#191c1e] mb-1" htmlFor="role">Role</label>
                <select id="role" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#002072] focus:ring-4 focus:ring-[#002072]/10 bg-white">
                  <option value="superadmin">superadmin</option>
                  <option value="admin">admin</option>
                  <option value="staff">staff</option>
                  <option value="viewer">viewer</option>
                </select>
                {errors.role && <p className="mt-1 text-sm text-[#ba1a1a]">{errors.role}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#191c1e] mb-1" htmlFor="password">Password</label>
                <div className="flex gap-2">
                  <input id="password" ref={passwordInputRef} type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#002072] focus:ring-4 focus:ring-[#002072]/10" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-[#191c1e] hover:bg-slate-50">{showPassword ? 'Hide' : 'Show'}</button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-[#ba1a1a]">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#191c1e] mb-1" htmlFor="password_confirmation">Konfirmasi Password</label>
                <input id="password_confirmation" ref={confirmPasswordInputRef} type="password" value={formData.password_confirmation} onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#002072] focus:ring-4 focus:ring-[#002072]/10" />
                {errors.password_confirmation && <p className="mt-1 text-sm text-[#ba1a1a]">{errors.password_confirmation}</p>}
              </div>

              {errors.submit && <div className="rounded-xl border border-[#ba1a1a] bg-[#ffdad6] p-3 text-sm text-[#93000a]">{errors.submit}</div>}

              <button type="submit" disabled={registerMutation.isPending} className="w-full rounded-xl bg-[#002072] px-4 py-3 font-bold text-white shadow-lg transition hover:bg-[#00184d] disabled:cursor-not-allowed disabled:opacity-70">
                {registerMutation.isPending ? 'Membuat akun...' : 'Daftar'}
              </button>

              <p className="pt-2 text-center text-sm text-[#444652]">
                Sudah punya akun?{' '}
                <Link to="/login" className="font-bold text-[#002072] underline underline-offset-4">Kembali ke login</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/register')({
  component: RegisterPage,
});

