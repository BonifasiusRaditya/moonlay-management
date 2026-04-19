import { Link, createFileRoute } from '@tanstack/react-router';
import {
  CheckCircle2,
  ChevronRight,
  CirclePlus,
  Database,
  FileCheck2,
  GitBranch,
  Info,
  Send,
  Settings2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { PageTransition } from '@/components/page_transition';
import { requireAuthBeforeLoad } from '@/utils/route_guards';

const PROCESS_NAME_MAP: Record<string, string> = {
  'invoice-generation': 'Invoice Generation Configuration',
  'payment-due-reminder': 'Payment Due Reminder Configuration',
  'expense-approval': 'Expense Approval Configuration',
};

const WORKFLOW_STEPS = [
  {
    title: 'Data Fetch',
    tag: 'ERP SYNC',
    description:
      'Automated scan of the central ERP for all unbilled line items across enterprise client portfolios.',
    Icon: Database,
    active: true,
  },
  {
    title: 'PDF Generation',
    tag: 'TEMPLATE V4',
    description:
      'Maps fetched data into the standardized Xerba - Seamly corporate invoice template with dynamic logo placement.',
    Icon: FileCheck2,
    active: false,
  },
  {
    title: 'Compliance Check',
    tag: 'TAX VALIDATION',
    description:
      'Validates tax calculations against regional jurisdictional requirements and internal audit protocols.',
    Icon: ShieldCheck,
    active: false,
  },
  {
    title: 'Client Dispatch',
    tag: 'SECURE PORTAL',
    description:
      'Finalized invoices are encrypted and pushed directly to client-facing executive dashboards for approval.',
    Icon: Send,
    active: false,
  },
];

function FinanceProcessConfigPage() {
  const { processID } = Route.useParams();
  const processTitle = PROCESS_NAME_MAP[processID] ?? 'Finance Process Configuration';

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl space-y-8 p-8">
          <nav className="text-sm text-slate-500">
            <ol className="flex items-center gap-2">
              <li><Link to="/finance" className="font-medium text-slate-500 transition-colors hover: hover:text-black">Finance</Link></li>
              <li><ChevronRight className="h-4 w-4" /></li>
              <li><Link to="/finance/config/$processID" params={{ processID }} className="font-semibold text-blue-600 transition-colors hover:text-blue-900">{processID}</Link></li>
            </ol>
          </nav>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                {processTitle}
              </h1>
              <p className="mt-2 text-slate-600">
                Define parameters and logic for automated billing cycles.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button className="rounded-lg px-6 py-2.5 font-semibold text-slate-700 transition-colors hover:bg-slate-200">
                Discard Changes
              </button>
              <button className="rounded-lg bg-gradient-to-br from-blue-800 to-blue-600 px-8 py-2.5 font-semibold text-white shadow-lg transition-opacity hover:opacity-90">
                Save Configuration
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6 xl:gap-8">
            <section className="col-span-12 space-y-6 lg:col-span-5">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:p-8">
                <h2 className="mb-6 inline-flex items-center gap-2 text-xl font-bold text-slate-900">
                  <Settings2 className="h-5 w-5 text-blue-700" />
                  Automation Parameters
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Billing Cycle
                    </label>
                    <select className="w-full rounded-t-lg border-b-2 border-slate-300 bg-slate-100 py-3 font-medium text-slate-900 focus:border-blue-700 focus:outline-none">
                      <option>Monthly</option>
                      <option>Quarterly</option>
                      <option>Bi-Annual</option>
                      <option>Annually</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Trigger Client List
                    </label>
                    <div className="space-y-3 rounded-lg bg-slate-100 p-4">
                      <div className="flex items-center justify-between rounded bg-white p-2 shadow-sm">
                        <span className="text-sm font-medium">Global Enterprise Corp</span>
                        <CheckCircle2 className="h-4 w-4 text-blue-700" />
                      </div>
                      <div className="flex items-center justify-between rounded bg-white p-2 shadow-sm">
                        <span className="text-sm font-medium">TechNova Systems</span>
                        <CheckCircle2 className="h-4 w-4 text-blue-700" />
                      </div>
                      <button className="w-full rounded border-2 border-dashed border-slate-300 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-white">
                        + Select Additional Clients
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Notification Recipients
                    </label>
                    <div className="flex flex-wrap items-center gap-2 rounded-t-lg border-b-2 border-slate-300 bg-slate-100 p-3">
                      <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900">
                        finance-ops@company.com
                        <X className="h-3.5 w-3.5 cursor-pointer" />
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900">
                        cfo-desk@company.com
                        <X className="h-3.5 w-3.5 cursor-pointer" />
                      </span>
                      <input
                        className="min-w-36 flex-1 border-none bg-transparent text-sm outline-none"
                        placeholder="Add email..."
                        type="text"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-r from-slate-700 to-slate-500 p-6 text-white">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="font-bold">Finance Engine Status</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                    ACTIVE
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full w-[94%] bg-emerald-300" />
                  </div>
                  <span className="text-sm font-bold">94% Health</span>
                </div>

                <p className="mt-3 text-xs text-white/75">
                  Last compliance sync performed 12 minutes ago.
                </p>
              </div>
            </section>

            <section className="relative col-span-12 overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:p-8 lg:col-span-7">
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-100/60 blur-3xl" />

              <h2 className="relative mb-10 inline-flex items-center gap-2 text-xl font-bold text-slate-900">
                <GitBranch className="h-5 w-5 text-blue-700" />
                Workflow Logic Visualization
              </h2>

              <div className="relative space-y-8">
                <div className="absolute bottom-6 left-5 top-6 w-0.5 bg-slate-200" />

                {WORKFLOW_STEPS.map((step) => (
                  <article key={step.title} className="group relative flex gap-5">
                    <div
                      className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-white ring-8 ring-slate-50 ${
                        step.active ? 'border-blue-700 text-blue-700' : 'border-slate-300 text-slate-500'
                      }`}
                    >
                      <step.Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-5 transition-shadow group-hover:shadow-sm">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-900">{step.title}</h3>
                        <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                          {step.tag}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{step.description}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-8 rounded-lg border border-blue-100 bg-blue-50 p-4">
                <p className="inline-flex items-start gap-2 text-xs text-slate-600">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                  Any changes to workflow logic require a
                  <strong className="mx-1 text-blue-800">Tier 2 Managerial Approval</strong>
                  before going live in the next production cycle.
                </p>
              </div>

              <div className="mt-5 inline-flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
                <CirclePlus className="h-3.5 w-3.5" />
                Process ID: {processID}
              </div>
            </section>
          </div>
      </div>
    </PageTransition>
  );
}

export const Route = createFileRoute('/finance/config/$processID')({
  beforeLoad: async () => {
    await requireAuthBeforeLoad();
  },
  component: FinanceProcessConfigPage,
});
