import { useEffect, useRef } from 'react';
import { logout } from '@/api/auth';
import { useUserStore } from '@/stores/userStore';
import { useNavigate } from '@tanstack/react-router';

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function useAutoLogoutOnIdle(timeout = DEFAULT_TIMEOUT_MS) {
  const navigate = useNavigate();
  const clearUser = useUserStore((s) => s.clearUser);
  const timerRef = useRef<number | null>(null);

  const resetTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      logout();
      clearUser();
      navigate({ to: '/login' });
    }, timeout);
  };

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') resetTimer();
    });

    resetTimer();

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
      document.removeEventListener('visibilitychange', () => {});
    };
  }, [timeout]);
}