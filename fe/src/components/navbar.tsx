import { useNavigate } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/button';
import { useUserStore } from '@/stores/userStore';
import { logout } from '@/api/auth';

interface NavbarProps {
  currentPath: string;
  navItems: Array<{ href: string; label: string }>;
}

export function Navbar({ currentPath, navItems }: NavbarProps) {
  const navigate = useNavigate();
  const { user, clearUser } = useUserStore();

  const handleLogout = () => {
    logout();
    clearUser();
    navigate({ to: '/login' });
  };

  // Get current page title from nav items
  const currentPage = navItems.find(item => item.href === currentPath);
  const pageTitle = currentPage?.label || 'Dashboard';

  return (
    <nav className="border-b border-gray-300 px-4 py-4 backdrop-blur-sm" style={{ backgroundColor: '#f0f0eb' }}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          {pageTitle}
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">
            {user?.name} {user?.role && `(${user.role})`}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}

