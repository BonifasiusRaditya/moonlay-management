import { useNavigate } from '@tanstack/react-router';
import { LogOut, Settings, User } from 'lucide-react';
import { Button } from '@/components/button';
import { useUserStore } from '@/Session/userSession';
import { logout } from '@/api/auth';
import {
  BadgeHelp,
  Bell,
  Building2,
  ChartNoAxesColumn,
  FilePlus2,
  FileText,
  Key,
  Landmark,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavbarProps {
  currentPath: string;
  navItems: Array<{ href: string; label: string }>;
}

export function Navbar({ currentPath, navItems }: NavbarProps) {
  const navigate = useNavigate();
  const { user, clearUser } = useUserStore();
  const isDashboard = currentPath === '/dashboard' || currentPath.startsWith('/dashboard/');

  const handleLogout = () => {
    logout();
    clearUser();
    navigate({ to: '/login' });
  };

  // Get current page title from nav items
  const currentPage = navItems.find(item => item.href === currentPath);
  const pageTitle = currentPage?.label || 'Dashboard';

  return (
    <nav className="flex h-20 w-full items-center justify-between px-6 bg-slate-100/50 backdrop-blur-s m"> 
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="hidden items-center md:flex">
            { isDashboard && (
            <div className="relative mr-4 w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search"
                className="w-full rounded-lg border-none bg-slate-100/50 py-1.5 pl-9 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-700/20"
              />
            </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100">
            <Bell className="h-5 w-5" />
          </button>
          <button className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100">
            <BadgeHelp className="h-5 w-5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200">
              <img
                src={user?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuBP28U-Vgxc13H--Hnr5KcAtxE94RoyLMi0ccHZxInuYtHDeQ3Mj2ED3mE-S6PfpMPP03BmyEEAVw6906tCT6KzUVhr4rEbcB2VARDgB43J2h8tDOuTHQADt-o2wStsyrFkU1n0b_iOWq9i-B4aAikCehgd3pps4lnQRd09Qpslwi8BdpgXAbsGexR1QoBZFOAD4fkDoztqp2tq65sFsmAejXQ5Kw4bltEUndjB5_N2oW-m4N2B8jlMGaS9Eez0la1xjhe_b7vic5Fa"}
                alt="User Profile"
                className="h-8 w-8 rounded-full border border-slate-200"
              />
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium leading-none">{user?.name}</span>
                <span className="text-xs text-slate-500">{user?.role}</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" sideOffset={8}>
              <DropdownMenuLabel className="flex flex-col px-2 py-2">
                <span className="text-sm font-semibold">{user?.name}</span>
                <span className="text-xs text-slate-500">{user?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: '/' })}>
                <User className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: '/' })}>
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}

