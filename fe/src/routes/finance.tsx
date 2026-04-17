import { Link, Outlet, createFileRoute, redirect, useRouterState } from '@tanstack/react-router';
import {
  BellRing,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  EllipsisVertical,
  FileText,
  Landmark,
  ReceiptText,
  Settings2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageTransition } from '@/components/page_transition';
import { useUserStore } from '@/stores/userStore';

const PROCESS_CARDS = [
  {
    processId: 'invoice-generation',
    title: 'Invoice Generation',
    description:
      'Automated monthly billing for recurring client accounts with dynamic tax calculation.',
    status: 'ACTIVE',
    active: true,
    Icon: ReceiptText,
  },
  {
    processId: 'payment-due-reminder',
    title: 'Payment Due Date Reminder',
    description:
      'Multi-stage email sequence triggered 5, 2, and 0 days before invoice maturation.',
    status: 'ACTIVE',
    active: true,
    Icon: BellRing,
  },
  {
    processId: 'expense-approval',
    title: 'Expense Approval',
    description:
      'Hierarchical routing of corporate expense claims based on department and amount thresholds.',
    status: 'INACTIVE',
    active: false,
    Icon: Settings2,
  },
];

const TRANSACTION_ROWS = [
  {
    invoiceId: '#INV-99021',
    name: 'Nova Labs Inc.',
    category: 'Technology Services',
    dueDate: 'Oct 24, 2023',
    amount: '$12,450.00',
    status: 'Final Reminder Sent',
    statusClass: 'bg-blue-100 text-blue-800',
    initials: 'NL',
    initialsClass: 'bg-blue-100 text-blue-700',
  },
  {
    invoiceId: '#INV-98845',
    name: 'Global Freight',
    category: 'Logistics Partner',
    dueDate: 'Oct 28, 2023',
    amount: '$4,200.00',
    status: 'Pending 5-Day',
    statusClass: 'bg-slate-100 text-slate-700',
    initials: 'GF',
    initialsClass: 'bg-slate-100 text-slate-700',
  },
  {
    invoiceId: '#INV-98512',
    name: 'Arcane Solutions',
    category: 'Software Licensing',
    dueDate: 'Oct 19, 2023',
    amount: '$8,120.00',
    status: 'Overdue (Escalated)',
    statusClass: 'bg-red-100 text-red-700',
    initials: 'AS',
    initialsClass: 'bg-red-100 text-red-700',
  },
  {
    invoiceId: '#INV-97420',
    name: 'Vertex Capital',
    category: 'Asset Management',
    dueDate: 'Nov 02, 2023',
    amount: '$25,000.00',
    status: 'Queued',
    statusClass: 'bg-slate-100 text-slate-700',
    initials: 'VC',
    initialsClass: 'bg-blue-100 text-blue-700',
  },
];

function FinancePage() {
  const router = useRouterState();
  const [processCards, setProcessCards] = useState(PROCESS_CARDS);

  const totalActiveProcesses = useMemo(
    () => processCards.filter((card) => card.active).length,
    [processCards],
  );

  const toggleProcess = (processId: string) => {
    setProcessCards((prevCards) =>
      prevCards.map((card) =>
        card.processId === processId
          ? {
              ...card,
              active: !card.active,
            }
          : card,
      ),
    );
  };

  // /finance/config/$processID is nested under /finance in the generated route tree.
  // Render child routes here so the configuration page can mount correctly.
  if (router.location.pathname.startsWith('/finance/config/')) {
    return <Outlet />;
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl space-y-8 p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                Finance Process Module
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Orchestrate your automated financial workflows.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Total Active
              </p>
              <p className="text-xl font-bold text-blue-700">{totalActiveProcesses} Processes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {processCards.map((card) => (
              <article
                key={card.title}
                className={`flex min-h-64 flex-col justify-between rounded-xl border bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  card.active ? 'border-blue-100' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className={`rounded-lg p-3 ${card.active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                      <card.Icon className="h-5 w-5" />
                    </div>

                    <button
                      type="button"
                      aria-pressed={card.active}
                      aria-label={`${card.active ? 'Disable' : 'Enable'} ${card.title}`}
                      onClick={() => toggleProcess(card.processId)}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                        card.active
                          ? 'border-blue-500 bg-gradient-to-r from-blue-600 to-blue-700'
                          : 'border-slate-300 bg-slate-200 hover:bg-slate-300'
                      }`}>
                      
                      <span
                        className={`absolute left-1 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow transition-transform duration-300 ${
                          card.active ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900">{card.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.description}</p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <CircleDot className={`h-3.5 w-3.5 ${card.active ? 'text-blue-700' : 'text-slate-400'}`} />
                    {card.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>

                  <Link
                    to="/finance/config/$processID"
                    params={{ processID: card.processId }}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline"
                  >
                    Configure
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Transaction Hub</h2>
                <p className="text-sm text-slate-600">
                  Monitor and manage all financial triggers in one place.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200">
                  Export CSV
                </button>
                <button className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800">
                  Process Selection
                </button>
              </div>
            </div>

            <div className="border-b border-slate-100 px-6">
              <div className="flex gap-6 overflow-x-auto">
                <button className="border-b-2 border-blue-700 py-4 text-sm font-semibold text-blue-700">
                  Incoming Invoices
                </button>
                <button className="border-b-2 border-transparent py-4 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700">
                  Payment Due Dates
                </button>
                <button className="border-b-2 border-transparent py-4 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700">
                  Recent Transactions
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full border-collapse text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Invoice ID
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Vendor/Client
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Due Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {TRANSACTION_ROWS.map((row) => (
                    <tr key={row.invoiceId} className="transition-colors hover:bg-slate-50">
                      <td className="px-6 py-5 text-sm font-semibold text-blue-700">{row.invoiceId}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded text-xs font-bold ${row.initialsClass}`}
                          >
                            {row.initials}
                          </div>

                          <div>
                            <p className="text-sm font-bold text-slate-900">{row.name}</p>
                            <p className="text-xs text-slate-500">{row.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-700">{row.dueDate}</td>
                      <td className="px-6 py-5 text-right text-sm font-bold text-slate-900">{row.amount}</td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${row.statusClass}`}
                        >
                          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-slate-500">
                        <button className="rounded p-1 transition-colors hover:bg-slate-100 hover:text-slate-800">
                          <EllipsisVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
              <span>Showing 4 of 28 records for active view</span>
              <div className="inline-flex items-center gap-3">
                <button className="rounded p-1 transition-colors hover:bg-slate-200 hover:text-slate-700">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-semibold text-slate-700">Page 1 of 7</span>
                <button className="rounded p-1 transition-colors hover:bg-slate-200 hover:text-slate-700">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/70 px-4 py-3 text-xs text-slate-500">
            <div className="inline-flex items-center gap-2">
              <Landmark className="h-3.5 w-3.5" />
              Finance module synchronized with process automation stack.
            </div>
            <div className="inline-flex items-center gap-4">
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" />
                Updated 2m ago
              </span>
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                28 invoices tracked
              </span>
            </div>
          </footer>
      </div>
    </PageTransition>
  );
}

export const Route = createFileRoute('/finance')({
  beforeLoad: () => {
    const { token, user } = useUserStore.getState();
    if (!token || !user) {
      throw redirect({
        to: '/login',
        replace: true,
      });
    }
  },
  component: FinancePage,
});
