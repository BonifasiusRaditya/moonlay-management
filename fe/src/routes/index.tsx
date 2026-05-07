import { createFileRoute, redirect } from '@tanstack/react-router';
import { useUserStore } from '@/Session/userSession';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const user = useUserStore.getState().user;
    
    if (user) {
      throw redirect({
        to: '/dashboard',
        replace: true,
      });
    } else {
      throw redirect({
        to: '/login',
        replace: true,
      });
    }
  },
});