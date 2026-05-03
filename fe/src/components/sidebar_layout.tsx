import { Link, useRouterState } from '@tanstack/react-router';
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
  UserCircle,
  Users,
} from 'lucide-react';
import { useState } from 'react';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const isDashboard = currentPath === '/dashboard' || currentPath.startsWith('/dashboard/');
  const isFinance = currentPath === '/finance' || currentPath.startsWith('/finance/');
  const [adminExpanded, setAdminExpanded] = useState(true);

  const navItemBase = 'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="fixed top-0 left-0 z-50 flex h-20 w-full items-center justify-between  px-6 md:left-64 md:w-[calc(100%-16rem)] bg-slate-100/50 backdrop-blur-sm">
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
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP28U-Vgxc13H--Hnr5KcAtxE94RoyLMi0ccHZxInuYtHDeQ3Mj2ED3mE-S6PfpMPP03BmyEEAVw6906tCT6KzUVhr4rEbcB2VARDgB43J2h8tDOuTHQADt-o2wStsyrFkU1n0b_iOWq9i-B4aAikCehgd3pps4lnQRd09Qpslwi8BdpgXAbsGexR1QoBZFOAD4fkDoztqp2tq65sFsmAejXQ5Kw4bltEUndjB5_N2oW-m4N2B8jlMGaS9Eez0la1xjhe_b7vic5Fa"
            alt="Executive User Profile"
            className="h-8 w-8 rounded-full border border-slate-200"
          />
        </div>
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
            to="/finance"
            className={`${navItemBase} ${
              isFinance
                ? 'scale-[0.98] bg-white font-bold text-blue-900 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <Users className="h-4 w-4" />
            Jurnal Otomatis
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
