import { Link, useRouterState } from '@tanstack/react-router';
import { Navbar } from '@/components/navbar';
import {
  FilePlus2,
  Landmark,
  LayoutDashboard,
  Users,
} from 'lucide-react';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const isDashboard = currentPath === '/dashboard' || currentPath.startsWith('/dashboard/');
  const isBusinessTransactions = currentPath === '/business' || currentPath.startsWith('/business/');
  const isBankTransactions = currentPath === '/bank' || currentPath.startsWith('/bank/');

  const navItemBase = 'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="fixed top-0 left-0 z-50 flex h-20 w-full items-center justify-between px-6 md:left-64 md:w-[calc(100%-16rem)] bg-slate-100/50 backdrop-blur-sm">
        <Navbar currentPath={currentPath} navItems={[
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/business', label: 'Transaksi Bisnis' },
          { href: '/bank', label: 'Transaksi Bank' },
        ]} />
      </header>

      <aside className="fixed left-0 top-0 h-screen z-40 hidden h-[calc(100vh-4rem)] w-64 flex-col space-y-2 bg-slate-100 p-4 pt-5 md:flex" style={{ background: 'linear-gradient(180deg, #f2f4f6 0%, #f7f9fb 100%)', fontFamily: 'Manrope' }}>
        <div className="mb-2 px-3 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700">
              <Landmark className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900">FINICORE</div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">The Financial Architect</div>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col space-y-1 text-sm font-bold">
          <Link
            to="/dashboard"
            className={`${navItemBase} ${
              isDashboard
                ? 'scale-[0.98] bg-white font-bold text-blue-900 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard 
          </Link>

          <Link
            to="/business"
            className={`${navItemBase} ${
              isBusinessTransactions
                ? 'scale-[0.98] bg-white font-bold text-blue-900 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <Users className="h-4 w-4" />
            Transaksi Bisnis
          </Link>

          <Link
            to="/bank"
            className={`${navItemBase} ${
              isBankTransactions
                ? 'scale-[0.98] bg-white font-bold text-blue-900 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <Users className="h-4 w-4" />
            Transaksi Bank
          </Link>
        </nav>

        <div className="px-2 py-4">
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-blue-700 to-blue-800 px-4 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98]">
            <FilePlus2 className="h-4 w-4" />
            New Report
          </button>
        </div>
      </aside>

      <main className="min-h-screen overflow-y-auto bg-slate-100 pt-20 md:ml-64">{children}</main>
    </div>
  );
}
