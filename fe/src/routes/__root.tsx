import { createRootRoute, Outlet, useRouterState, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { NotificationToast } from '@/components/notification_toast';
import { SidebarLayout } from '@/components/sidebar_layout';
import { useUserStore } from '@/Session/userSession';
import { useAutoLogoutOnIdle } from '@/hooks/userAutoLogoutIdle';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const router = useRouterState();
  const isAuthLightPage = router.location.pathname === '/login' || router.location.pathname === '/force-change-password' || router.location.pathname === '/register';
  const navigate = useNavigate();
  const { user } = useUserStore();
  useAutoLogoutOnIdle();
  
  useEffect(() => {
    if (user?.must_change_password && router.location.pathname !== '/force-change-password') {
      navigate({ to: '/force-change-password', replace: true });
    }
  }, [user?.must_change_password, navigate, router.location.pathname]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f0eb' }}>
      {isAuthLightPage ? <Outlet /> : <SidebarLayout><Outlet /></SidebarLayout>}
    </div>
  );
}

