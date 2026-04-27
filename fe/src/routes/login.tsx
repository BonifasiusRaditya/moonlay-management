import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { login } from '@/api/auth';
import { loginSchema, type LoginInput } from '@/schemas/auth';
import { useUserStore } from '@/Session/userSession';
import { useNotificationStore } from '@/Session/notificationSession';
import { ensureAuthenticatedUser } from '@/Session/userSession';

function LoginPage() {
  const navigate = useNavigate();
  const { user, setUser } = useUserStore();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginInput>({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const verifySession = async () => {
      const sessionUser = user ?? (await ensureAuthenticatedUser());
      if (!sessionUser) return;
      if (sessionUser.must_change_password) {
        navigate({ to: '/force-change-password', replace: true });
      } else {
        navigate({ to: '/dashboard', replace: true });
      }
    };
    verifySession();
  }, [user, navigate]);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      if (data.user) setUser(data.user);
      addNotification({
        type: 'success',
        title: 'Login successful',
        message: 'Welcome to FinIcore Labs.',
      });
      if (data.user?.must_change_password) {
        navigate({ to: '/force-change-password' });
      } else {
        navigate({ to: '/dashboard' });
      }
    },
    onError: (error: unknown) => {
      console.error('Login error details:', error);
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
      addNotification({ type: 'error', title: 'Login failed', message: errorMessage });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    loginMutation.mutate(result.data);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        .finicore-root * { box-sizing: border-box; }

        .finicore-root {
          font-family: 'Manrope', sans-serif;
          min-height: 100dvh;
          height: 100dvh;
          display: flex;
          background: #f8f9fb;
          color: #191c1e;
          overflow: hidden;
        }

        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          -webkit-font-smoothing: antialiased;
        }

        .fi-left {
          display: none;
          background-color: #002072;
          position: relative;
          flex-direction: column;
          justify-content: space-between;
          padding: clamp(24px, 3vw, 64px);
          overflow: hidden;
        }

        @media (min-width: 1024px) {
          .fi-left { display: flex; width: 48%; }
          .fi-right { width: 52% !important; padding: clamp(32px, 4vw, 96px) !important; }
          .fi-mobile-logo { display: none !important; }
        }

        @media (min-width: 768px) {
          .fi-right { padding: clamp(24px, 3vw, 64px) !important; }
        }

        .fi-grid-bg {
          background-image: radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px);
          background-size: 32px 32px;
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .fi-gradient-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top right, #002072, rgba(0,32,114,0.95), transparent);
          pointer-events: none;
        }

        .trust-bar-blur {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.1);
        }

        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes pulse {
          50% { opacity: .5; }
        }
        .fi-ping { animation: ping 1s cubic-bezier(0,0,0.2,1) infinite; }
        .fi-pulse { animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }

        .fi-input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          background-color: #f2f4f6;
          border: 1px solid transparent;
          border-radius: 12px;
          color: #191c1e;
          font-size: 16px;
          font-family: 'Manrope', sans-serif;
          outline: none;
          transition: all 0.3s;
        }
        .fi-input:focus {
          background-color: #ffffff;
          border-color: #002072;
          box-shadow: 0 0 0 4px rgba(0,32,114,0.1);
        }
        .fi-input.has-error {
          border-color: #ba1a1a;
          background-color: #fff8f7;
        }
        .fi-input-pr { padding-right: 48px; }

        .fi-btn-primary {
          width: 100%;
          padding: 16px;
          background-color: #002072;
          color: #ffffff;
          font-size: 18px;
          font-weight: 700;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(0,32,114,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: 'Manrope', sans-serif;
          transition: all 0.2s;
        }
        .fi-btn-primary:hover:not(:disabled) {
          background-color: rgba(0,32,114,0.9);
          box-shadow: 0 8px 32px rgba(0,32,114,0.3);
        }
        .fi-btn-primary:active:not(:disabled) { transform: scale(0.99); }
        .fi-btn-primary:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .fi-btn-google {
          width: 100%;
          padding: 16px;
          background-color: #ffffff;
          border: 1px solid rgba(197,197,212,0.4);
          border-radius: 12px;
          color: #191c1e;
          font-weight: 700;
          font-size: 16px;
          font-family: 'Manrope', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          transition: all 0.2s;
        }
        .fi-btn-google:hover {
          background-color: #f2f4f6;
          border-color: rgba(197,197,212,0.6);
        }

        .fi-chip {
          padding: 10px 20px;
          background-color: rgba(255,255,255,0.05);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          transition: background 0.3s;
        }
        .fi-chip:hover { background-color: rgba(255,255,255,0.1); }
      `}</style>

      <div className="finicore-root">
        {/* ── Left Panel ── */}
        <section className="fi-left">
          <div className="fi-grid-bg" />
          <div className="fi-gradient-overlay" />

          {/* Brand */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
              <div style={{ width: 44, height: 44, backgroundColor: '#ffffff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <span className="material-symbols-outlined" style={{ color: '#002072', fontSize: 24, fontVariationSettings: "'FILL' 1" }}>architecture</span>
              </div>
              <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', color: '#ffffff' }}>FinIcore Labs</span>
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', alignItems: 'center' }}>
            <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 9999, color: '#dde1ff', marginBottom: 10 }}>
                <span className="fi-pulse" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#66dd8b', display: 'inline-block' }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Next-Gen Accounting</span>
              </div>

              <h1 style={{ fontSize: 'clamp(36px, 3vw, 52px)', fontWeight: 800, color: '#ffffff', lineHeight: 1.05, letterSpacing: '-1px', marginBottom: 24 }}>
                Otomasi Jurnal Akuntansi dengan{' '}
                <span style={{ color: '#b8c4ff' }}>Presisi AI.</span>
              </h1>

              <p style={{ fontSize: 16, color: 'rgba(184,196,255,0.8)', fontWeight: 300, lineHeight: 1.55, marginBottom: 24 }}>
                Membangun standar baru dalam infrastruktur finansial dengan akurasi tanpa kompromi untuk perusahaan modern.
              </p>

              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 12 }}>Ecosystem Partners</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {['Accurate ERP', 'Xero', 'SAP', 'Jurnal.id'].map((p) => (
                    <div key={p} className="fi-chip">{p}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Trust Bar */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="trust-bar-blur" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', borderRadius: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(102,221,139,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: '#66dd8b', fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)' }}>Information Security</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>ISO 27001 Certified</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative', width: 10, height: 10 }}>
                  <span className="fi-ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: '#66dd8b', opacity: 0.75, display: 'block' }} />
                  <span style={{ position: 'relative', display: 'block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#66dd8b' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)' }}>System Status</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>Synchronized Active</span>
                </div>
              </div>
            </div>
            <p style={{ marginTop: 20, fontSize: 12, color: 'rgba(184,196,255,0.4)', fontWeight: 500 }}>
              © 2026 FinIcore Labs. High-Precision Financial Architecture. Seluruh hak cipta dilindungi.
            </p>
          </div>

          {/* Decorative blob */}
          <div style={{ position: 'absolute', right: -128, bottom: -128, width: '66%', height: '66%', opacity: 0.2, pointerEvents: 'none' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,40,142,1), transparent)', filter: 'blur(48px)' }} />
          </div>
        </section>

        {/* ── Right Panel ── */}
        <section
          className="fi-right"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: 24, overflowY: 'auto' }}
        >
          <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', paddingTop: 16, paddingBottom: 16 }}>
            {/* Mobile logo */}
            <div className="fi-mobile-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 64 }}>
              <div style={{ width: 40, height: 40, backgroundColor: '#002072', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: '#ffffff', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>architecture</span>
              </div>
              <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.6px', color: '#002072' }}>FinIcore Labs</span>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontSize: 'clamp(28px, 2.4vw, 36px)', fontWeight: 800, color: '#191c1e', letterSpacing: '-0.6px', marginBottom: 8 }}>Selamat Datang Kembali</h2>
              <p style={{ color: '#444652', fontWeight: 500, fontSize: 16, opacity: 0.7 }}>Masuk ke dashboard Financial Architect Anda.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label htmlFor="email" style={{ fontSize: 14, fontWeight: 700, color: '#191c1e', paddingLeft: 4 }}>
                  Alamat Email Bisnis
                </label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(117,118,132,0.6)', fontSize: 20 }}>mail</span>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      e.preventDefault();
                      passwordInputRef.current?.focus();
                    }}
                    placeholder="nama@perusahaan.com"
                    className={`fi-input${errors.email ? ' has-error' : ''}`}
                  />
                </div>
                {errors.email && <p style={{ fontSize: 13, color: '#ba1a1a', paddingLeft: 4 }}>{errors.email}</p>}
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 4 }}>
                  <label htmlFor="password" style={{ fontSize: 14, fontWeight: 700, color: '#191c1e' }}>Kata Sandi</label>
                  <a href="#" style={{ fontSize: 12, fontWeight: 700, color: '#002072', textDecoration: 'none' }}>Lupa sandi?</a>
                </div>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(117,118,132,0.6)', fontSize: 20 }}>lock</span>
                  <input
                    id="password"
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••••••"
                    className={`fi-input fi-input-pr${errors.password ? ' has-error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(117,118,132,0.6)', padding: 0 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {errors.password && <p style={{ fontSize: 13, color: '#ba1a1a', paddingLeft: 4 }}>{errors.password}</p>}
              </div>

              {/* Submit error */}
              {errors.submit && (
                <div style={{ padding: 12, backgroundColor: '#ffdad6', border: '1px solid #ba1a1a', borderRadius: 10 }}>
                  <p style={{ fontSize: 14, color: '#93000a' }}>{errors.submit}</p>
                </div>
              )}

              {/* Submit */}
              <div style={{ paddingTop: 0 }}>
                <button type="submit" className="fi-btn-primary" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? (
                    <span>Logging in...</span>
                  ) : (
                    <>
                      <span>Masuk</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 20, lineHeight: 1 }}>arrow_forward</span>
                    </>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1, borderTop: '1px solid rgba(197,197,212,0.3)' }} />
                <span style={{ margin: '0 16px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(117,118,132,0.6)' }}>Opsi Lain</span>
                <div style={{ flex: 1, borderTop: '1px solid rgba(197,197,212,0.3)' }} />
              </div>

              {/* Google */}
              <button type="button" className="fi-btn-google">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Lanjutkan Login dengan Google
              </button>
            </form>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#444652' }}>
                Belum memiliki akun?{' '}
                <a href="#" style={{ marginLeft: 4, color: '#002072', fontWeight: 800, textDecoration: 'underline', textUnderlineOffset: 4 }}>
                  Hubungi Tim Sales
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export const Route = createFileRoute('/login')({
  component: LoginPage,
});