import { useEffect, useRef } from 'react';
import { logout } from '@/api/auth';
import { useUserStore } from '@/Session/userSession';
import { useNavigate } from '@tanstack/react-router';

const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes

export function useAutoLogoutOnIdle(timeout = DEFAULT_TIMEOUT_MS) {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const clearUser = useUserStore((s) => s.clearUser);
  const timerRef = useRef<number | null>(null);
  const visibilityHandlerRef = useRef<(() => void) | null>(null);

  const resetTimer = () => {
    if (!user) {
      return;
    }

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
    if (!user) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      return;
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') resetTimer();
    };
    visibilityHandlerRef.current = handleVisibilityChange;
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resetTimer();

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
      if (visibilityHandlerRef.current) {
        document.removeEventListener('visibilitychange', visibilityHandlerRef.current);
      }
    };
  }, [timeout, user]);
}