import { createRootRoute, Outlet, useRouterState, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { NotificationToast } from '@/components/notification_toast';
import { SidebarLayout } from '@/components/sidebar_layout';
import { useUserStore } from '@/stores/userStore';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const router = useRouterState();
  const isAuthLightPage = router.location.pathname === '/login' || router.location.pathname === '/force-change-password';
  const navigate = useNavigate();
  const { user, token } = useUserStore();

  useEffect(() => {
    if (token && user?.must_change_password && router.location.pathname !== '/force-change-password') {
      navigate({ to: '/force-change-password', replace: true });
    }
  }, [token, user?.must_change_password, navigate, router.location.pathname]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f0eb' }}>
      <NotificationToast />
      {isAuthLightPage ? <Outlet /> : <SidebarLayout><Outlet /></SidebarLayout>}
    </div>
  );
}

