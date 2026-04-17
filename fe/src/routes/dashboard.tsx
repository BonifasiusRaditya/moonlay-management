import { createFileRoute, redirect } from '@tanstack/react-router';
import { PageTransition } from '@/components/page_transition';
import { useUserStore } from '@/stores/userStore';
import {
  ArrowDown,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  FolderTree,
  Plus,
  ReceiptText,
  Timer,
  TrendingUp,
  UserPlus,
} from 'lucide-react';

const KPI_ITEMS = [
  {
    label: 'Total Active Workflows',
    value: '1,284',
    subtext: '+12% from last month',
    positive: true,
    Icon: FolderTree,
  },
  {
    label: 'Avg Processing Time',
    value: '4.2 hrs',
    subtext: '15% faster',
    positive: true,
    Icon: Timer,
  },
  {
    label: 'Success Rate',
    value: '99.8%',
    subtext: 'Stability: Optimal',
    positive: null,
    Icon: CheckCircle2,
  },
];

const PROCESS_ITEMS = [
  {
    title: 'Recruitment Pipeline',
    subtitle: '42 Active Requisitions',
    badge: 'On Track',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    iconClass: 'bg-blue-50 text-blue-700',
    Icon: UserPlus,
  },
  {
    title: 'Accounts Payable',
    subtitle: '2 Urgent Escalations',
    badge: 'Attention',
    badgeClass: 'bg-red-100 text-red-700',
    iconClass: 'bg-violet-50 text-violet-700',
    Icon: ReceiptText,
  },
  {
    title: 'Employee Onboarding',
    subtitle: '12 Current Workflows',
    badge: 'Optimal',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    iconClass: 'bg-green-50 text-green-700',
    Icon: CheckCircle2,
  },
  {
    title: 'Expense Audits',
    subtitle: 'Automated Cycle 98%',
    badge: 'Automating',
    badgeClass: 'bg-sky-100 text-sky-700',
    iconClass: 'bg-orange-50 text-orange-700',
    Icon: CreditCard,
  },
];

const TRIGGER_ITEMS = [
  {
    title: 'New CV Uploaded',
    time: '2m ago',
    subtitle: 'Module: HR - Senior Dev Role',
    iconClass: 'bg-blue-50 text-blue-700',
    Icon: FileText,
  },
  {
    title: 'Invoice Received',
    time: '14m ago',
    subtitle: 'From: TechSupplies Inc ($1,240)',
    iconClass: 'bg-orange-50 text-orange-700',
    Icon: ReceiptText,
  },
  {
    title: 'Workflow Completed',
    time: '45m ago',
    subtitle: 'Employee Onboarding: Jane Doe',
    iconClass: 'bg-green-50 text-green-700',
    Icon: CheckCircle2,
  },
];

function DashboardPage() {
  return (
    <PageTransition>
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-90">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-200/35 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">Enterprise Overview</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">Executive Overview</h1>
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 bg-white/85 p-1 shadow-sm backdrop-blur-sm">
              <button className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">Real-time</button>
              <button className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">Historical</button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {KPI_ITEMS.map((kpi) => (
              <article
                key={kpi.label}
                className="flex h-44 flex-col justify-between rounded-xl border border-blue-100/70 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{kpi.label}</p>
                  <kpi.Icon className="h-5 w-5 text-blue-700" />
                </div>

                <div>
                  <p className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">{kpi.value}</p>
                  <p
                    className={`mt-2 flex items-center gap-1 text-xs font-bold ${
                      kpi.positive === false
                        ? 'text-red-600'
                        : kpi.positive === true
                          ? 'text-emerald-600'
                          : 'text-blue-700'
                    }`}
                  >
                    {kpi.positive === false ? <ArrowDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                    <span>{kpi.subtext}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <section className="space-y-4 xl:col-span-8">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Current Active Processes</h2>
                <button className="text-sm font-semibold text-blue-700 hover:underline">View All Processes</button>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="divide-y divide-slate-100">
                  {PROCESS_ITEMS.map((item) => (
                    <div key={item.title} className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.iconClass}`}>
                          <item.Icon className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="text-xs text-slate-500">{item.subtitle}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${item.badgeClass}`}>
                          {item.badge}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside className="xl:col-span-4">
              <div className="sticky top-24 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-6">
                  <h2 className="text-lg font-bold text-slate-900">Recent Trigger Events</h2>
                  <p className="mt-1 text-xs text-slate-500">Live updates from all modules</p>
                </div>

                <div className="space-y-3 p-4">
                  {TRIGGER_ITEMS.map((item) => (
                    <article key={item.title} className="flex gap-4 rounded-lg p-3 transition-colors hover:bg-slate-50">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.iconClass}`}>
                        <item.Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-bold text-slate-900">{item.title}</p>
                          <span className="whitespace-nowrap text-[10px] font-medium text-slate-400">{item.time}</span>
                        </div>
                        <p className="truncate text-xs text-slate-500">{item.subtitle}</p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="bg-slate-100/70 p-4 text-center">
                  <button className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700 hover:underline">View All Activities</button>
                </div>
              </div>
            </aside>
          </div>

          <footer className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 md:flex-row">
            <p>© 2026 Xerba - Seamly. Corporate automation systems operational.</p>
            <div className="flex items-center gap-5">
              <button className="transition-colors hover:text-blue-700">Privacy Policy</button>
              <button className="transition-colors hover:text-blue-700">Audit Logs</button>
              <button className="transition-colors hover:text-blue-700">Support</button>
            </div>
          </footer>
        </div>

        <button
          type="button"
          className="fixed bottom-8 right-8 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-800 to-blue-600 text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
          aria-label="Launch New Process"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </PageTransition>
  );
}

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    const { token, user } = useUserStore.getState();
    if (!token || !user) {
      throw redirect({
        to: '/login',
        replace: true,
      });
    }
  },
  component: DashboardPage,
});
