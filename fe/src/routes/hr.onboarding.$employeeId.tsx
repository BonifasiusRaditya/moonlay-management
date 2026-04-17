import { Link, createFileRoute, redirect } from '@tanstack/react-router';
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  CircleDashed,
  Clock3,
  Mail,
  MapPin,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmationDialog } from '@/components/confirmation_dialog';
import { PageTransition } from '@/components/page_transition';
import { useNotificationStore } from '@/stores/notificationStore';
import { useUserStore } from '@/stores/userStore';

interface EmployeeDetail {
  name: string;
  department: string;
  email: string;
  location: string;
  role: string;
  onboardingProgress: number;
  activeAutomations: number;
}

const EMPLOYEE_DATA: Record<string, EmployeeDetail> = {
  'elena-rodriguez': {
    name: 'Elena Rodriguez',
    department: 'Engineering',
    email: 'elena.r@corporate.com',
    location: 'London, UK',
    role: 'Senior Product Architect',
    onboardingProgress: 75,
    activeAutomations: 14,
  },
  'marcus-chen': {
    name: 'Marcus Chen',
    department: 'Operations',
    email: 'm.chen@corporate.com',
    location: 'Singapore, SG',
    role: 'Head of Global Sales',
    onboardingProgress: 61,
    activeAutomations: 11,
  },
  'sarah-jenkins': {
    name: 'Sarah Jenkins',
    department: 'Design',
    email: 's.jenkins@corporate.com',
    location: 'New York, US',
    role: 'UX Research Lead',
    onboardingProgress: 82,
    activeAutomations: 9,
  },
};

const ONBOARDING_STEPS = [
  {
    title: 'Greeting Sent',
    status: 'Done',
    detail: 'Automated welcome package dispatched via email and Slack.',
    timestamp: 'Oct 12, 2023 • 09:15 AM',
    kind: 'done' as const,
  },
  {
    title: 'Email Setup',
    status: 'Done',
    detail: 'Provisioned Google Workspace and Outlook alias accounts.',
    timestamp: 'Oct 12, 2023 • 11:40 AM',
    kind: 'done' as const,
  },
  {
    title: 'Hardware Ordered',
    status: 'In Progress',
    detail: 'MacBook Pro 16in and peripherals pending courier pickup.',
    progress: 45,
    kind: 'progress' as const,
  },
  {
    title: 'Access Granted',
    status: 'Pending',
    detail: 'VPN, GitHub, and cloud environment keys generation.',
    kind: 'pending' as const,
  },
];

const OFFBOARDING_ITEMS = [
  { title: 'Asset Return', status: 'Done', kind: 'done' as const },
  { title: 'Exit Interview', status: 'In Progress', kind: 'progress' as const },
  { title: 'Access Revoked', status: 'Pending', kind: 'pending' as const },
  { title: 'Payroll Finalized', status: 'Pending', kind: 'pending' as const },
];

export const Route = createFileRoute('/hr/onboarding/$employeeId')({
  beforeLoad: () => {
    const { token, user } = useUserStore.getState();
    if (!token || !user) {
      throw redirect({
        to: '/login',
        replace: true,
      });
    }
  },
  component: EmployeeProcessDetailPage,
});

function EmployeeProcessDetailPage() {
  const { employeeId } = Route.useParams();
  const addNotification = useNotificationStore((state) => state.addNotification);

  const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const employee = useMemo(() => {
    const fallbackName = employeeId
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return (
      EMPLOYEE_DATA[employeeId] ?? {
        name: fallbackName,
        department: 'Engineering',
        email: `${employeeId}@corporate.com`,
        location: 'London, UK',
        role: 'Employee',
        onboardingProgress: 60,
        activeAutomations: 8,
      }
    );
  }, [employeeId]);

  const handleApplyAutomation = async () => {
    setIsApplying(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      addNotification({
        type: 'success',
        title: 'Automation updated',
        message: `Workflow changes were applied to ${employee.name}.`,
      });
      setIsEditConfirmOpen(false);
    } catch {
      addNotification({
        type: 'error',
        title: 'Update failed',
        message: 'Unable to apply automation changes. Please retry.',
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e]">
        <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
              <div className="mb-2">
                <Link to="/hr" className="inline-flex items-center gap-1 text-sm font-semibold text-[#003d9b] hover:underline">
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  Back to HR Dashboard
                </Link>
              </div>

              <section className="relative overflow-hidden rounded-xl bg-white p-6">
                <div className="pointer-events-none absolute -right-24 -top-10 h-48 w-64 rounded-full bg-[#dae2ff]/50 blur-3xl" />

                <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                  <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-2xl border-4 border-[#f7f9fb] bg-[#d3e4fe]" />
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-3">
                        <h2 className="font-headline text-3xl font-extrabold tracking-tight">{employee.name}</h2>
                        <span className="rounded-full bg-[#dae2fd] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#5c647a]">
                          {employee.department}
                        </span>
                      </div>
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-[#434654]">
                        <Mail className="h-4 w-4" />
                        {employee.email}
                        <span className="text-[#c3c6d6]">•</span>
                        <MapPin className="h-4 w-4" />
                        {employee.location}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500" />
                          Active
                        </span>
                        <span className="inline-flex items-center rounded-full bg-[#dae2ff] px-2.5 py-0.5 text-xs font-semibold text-[#001848]">
                          {employee.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="rounded-lg bg-[#e6e8ea] px-5 py-2.5 text-sm font-bold text-[#191c1e] hover:bg-[#e0e3e5]">
                      View Profile
                    </button>
                    <button
                      className="rounded-lg bg-gradient-to-br from-[#003d9b] to-[#0052cc] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90 disabled:opacity-60"
                      onClick={() => setIsEditConfirmOpen(true)}
                      disabled={isApplying}
                    >
                      {isApplying ? 'Applying...' : 'Edit Automation'}
                    </button>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <section className="rounded-xl bg-white p-8 lg:col-span-7">
                  <div className="mb-8 flex items-center justify-between">
                    <h3 className="font-headline text-xl font-extrabold">Onboarding Momentum</h3>
                    <div className="text-right">
                      <span className="font-headline text-3xl font-extrabold text-[#003d9b]">{employee.onboardingProgress}%</span>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#434654]">Complete</p>
                    </div>
                  </div>

                  <div className="relative space-y-0">
                    <div className="absolute bottom-4 left-[19px] top-4 w-0.5 bg-[#c3c6d6]/40" />

                    {ONBOARDING_STEPS.map((step) => (
                      <article key={step.title} className="group relative flex gap-6 pb-10 last:pb-0">
                        <div
                          className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${
                            step.kind === 'done'
                              ? 'bg-[#003d9b] text-white shadow-lg shadow-[#003d9b]/20'
                              : step.kind === 'progress'
                                ? 'border-4 border-[#003d9b] bg-white text-[#003d9b]'
                                : 'bg-[#e6e8ea] text-[#737685]'
                          }`}
                        >
                          {step.kind === 'done' && <Check className="h-5 w-5" />}
                          {step.kind === 'progress' && <Clock3 className="h-5 w-5 animate-pulse" />}
                          {step.kind === 'pending' && <CircleDashed className="h-5 w-5" />}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <h4 className="font-headline font-bold">{step.title}</h4>
                            <span
                              className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${
                                step.kind === 'done'
                                  ? 'bg-[#f2f4f6] text-[#434654]'
                                  : step.kind === 'progress'
                                    ? 'bg-[#dae2ff] text-[#003d9b]'
                                    : 'bg-[#f2f4f6] text-[#737685]'
                              }`}
                            >
                              {step.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-[#434654]">{step.detail}</p>
                          {step.timestamp && <p className="mt-2 text-[10px] font-medium text-[#737685]">{step.timestamp}</p>}
                          {step.progress && (
                            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#e6e8ea]">
                              <div className="h-full rounded-full bg-[#003d9b]" style={{ width: `${step.progress}%` }} />
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="flex flex-col gap-8 lg:col-span-5">
                  <article className="relative overflow-hidden rounded-xl bg-[#35445a] p-8 text-white shadow-xl">
                    <div className="pointer-events-none absolute right-0 top-0 p-4 opacity-10">
                      <UserPlus className="h-24 w-24" />
                    </div>
                    <h3 className="font-headline text-xl font-extrabold">Offboarding Vault</h3>
                    <p className="mb-6 mt-2 text-sm text-[#c4d4ee]">Pre-scheduled protocols for the final employee cycle.</p>

                    <div className="space-y-4">
                      {OFFBOARDING_ITEMS.map((item) => (
                        <button
                          key={item.title}
                          className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#4c5c72]/60 p-4 text-left transition-all hover:bg-[#4c5c72]/80"
                        >
                          <span className="flex items-center gap-4">
                            {item.kind === 'done' && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                            {item.kind === 'progress' && <Clock3 className="h-5 w-5 text-yellow-400" />}
                            {item.kind === 'pending' && <Circle className="h-5 w-5 text-white/30" />}
                            <span>
                              <p className="font-headline text-sm font-bold">{item.title}</p>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-[#c4d4ee]">{item.status}</p>
                            </span>
                          </span>
                          <ChevronRight className="h-4 w-4 text-white/50" />
                        </button>
                      ))}
                    </div>
                  </article>

                  <article className="flex items-center justify-between rounded-xl bg-[#e6e8ea] p-6">
                    <div>
                      <h4 className="mb-1 text-xs font-bold uppercase tracking-widest text-[#434654]">Total Active Automations</h4>
                      <div className="flex items-end gap-2">
                        <span className="font-headline text-3xl font-extrabold">{employee.activeAutomations}</span>
                        <span className="flex items-center pb-1 text-sm font-bold text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          +2
                        </span>
                      </div>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-[#003d9b]">
                      <UserPlus className="h-5 w-5" />
                    </div>
                  </article>
                </section>
              </div>
        </div>

        <ConfirmationDialog
          open={isEditConfirmOpen}
          onOpenChange={(open) => {
            if (!isApplying) {
              setIsEditConfirmOpen(open);
            }
          }}
          title="Apply automation changes?"
          description={`This will update onboarding workflow settings for ${employee.name}.`}
          confirmLabel="Apply"
          cancelLabel="Cancel"
          variant="info"
          onConfirm={handleApplyAutomation}
          isLoading={isApplying}
        />
      </div>
    </PageTransition>
  );
}
