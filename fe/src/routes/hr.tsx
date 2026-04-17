import { Link, Outlet, createFileRoute, redirect, useRouterState } from '@tanstack/react-router';
import {
  ChevronRight,
  CircleEllipsis,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import { PageTransition } from '@/components/page_transition';
import { useUserStore } from '@/stores/userStore';

const HR_AUTOMATIONS = [
  {
    processId: 'onboarding-process',
    title: 'Onboarding Process',
    description: 'Automated provisioning of equipment, software licenses, and team invitations for new hires.',
    badge: 'ACTIVE',
    active: true,
    Icon: UserPlus,
    ownerCount: '+12',
  },
  {
    processId: 'hiring-process',
    title: 'Offboarding',
    description: 'Systematic access revocation, asset recovery, and compliance exit interviews.',
    badge: 'PAUSED',
    active: false,
    Icon: UserMinus,
    ownerCount: '+2',
  },
];

const CANDIDATE_ROWS = [
  {
    employeeId: 'elena-rodriguez',
    name: 'Elena Rodriguez',
    email: 'elena.r@corporate.com',
    role: 'Senior Product Architect',
    department: 'Engineering',
    startDate: 'Oct 12, 2023',
    startEta: 'In 4 days',
    status: 'Pre-boarding',
    active: true,
  },
  {
    employeeId: 'marcus-chen',
    name: 'Marcus Chen',
    email: 'm.chen@corporate.com',
    role: 'Head of Global Sales',
    department: 'Operations',
    startDate: 'Oct 24, 2023',
    startEta: 'In 16 days',
    status: 'Pending Signature',
    active: false,
  },
  {
    employeeId: 'sarah-jenkins',
    name: 'Sarah Jenkins',
    email: 's.jenkins@corporate.com',
    role: 'UX Research Lead',
    department: 'Design',
    startDate: 'Nov 02, 2023',
    startEta: 'In 25 days',
    status: 'Provisioning Assets',
    active: true,
  },
];

export const Route = createFileRoute('/hr')({
  beforeLoad: () => {
    const { token, user } = useUserStore.getState();
    if (!token || !user) {
      throw redirect({
        to: '/login',
        replace: true,
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouterState();

  if (router.location.pathname !== '/hr') {
    return <Outlet />;
  }

  return (
    <PageTransition>
      <main className="min-h-screen bg-[#f7f9fb] text-[#191c1e]">
        <div className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-8">
              <section>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#191c1e]">HR Automations</h1>
                <p className="mt-1 text-sm text-[#434654]">Manage lifecycle workflows and automated task triggers.</p>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {HR_AUTOMATIONS.map((automation) => (
                    <article key={automation.processId} className="group rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                      <div className="mb-4 flex items-start justify-between">
                        <div className={`rounded-lg p-3 ${automation.active ? 'bg-[#dae2ff] text-[#003d9b]' : 'bg-[#dae2fd] text-[#565e74]'}`}>
                          <automation.Icon className="h-6 w-6" />
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-bold ${
                            automation.active ? 'bg-[#dae2ff] text-[#003d9b]' : 'bg-[#e6e8ea] text-[#737685]'
                          }`}
                        >
                          {automation.badge}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-[#191c1e] transition-colors group-hover:text-[#003d9b]">{automation.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#434654]">{automation.description}</p>

                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex -space-x-2">
                          <div className="h-8 w-8 rounded-full border-2 border-[#f7f9fb] bg-[#d3e4fe]" />
                          <div className="h-8 w-8 rounded-full border-2 border-[#f7f9fb] bg-[#bec6e0]" />
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f7f9fb] bg-[#e6e8ea] text-[10px] font-bold text-[#434654]">
                            {automation.ownerCount}
                          </div>
                        </div>

                        <Link
                          to="/hr/config/$processID"
                          params={{ processID: automation.processId }}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-[#003d9b] hover:underline"
                        >
                          Configure
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl bg-[#f2f4f6] p-1">
                <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                  <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-8">
                      <button className="border-b-2 border-[#003d9b] pb-1 text-sm font-bold text-[#003d9b]">Incoming Employees</button>
                      <button className="pb-1 text-sm font-bold text-[#434654] hover:text-[#003d9b]">Offboarding Soon</button>
                    </div>
                    <Link to="/hr/create/onboarding" className="inline-flex items-center gap-2 self-start rounded-lg bg-gradient-to-br from-[#003d9b] to-[#0052cc] px-5 py-2 text-sm font-bold text-white shadow-md hover:opacity-90 md:self-auto">
                      <UserPlus className="h-4 w-4" />
                      Add Employee
                    </Link>
                  </div>

                  <div className="overflow-x-auto px-2 pb-4 md:px-4">
                    <table className="w-full min-w-[760px] border-separate border-spacing-y-1 text-left">
                      <thead>
                        <tr className="text-[10px] font-bold uppercase tracking-widest text-[#434654]">
                          <th className="pb-3 pl-2">Candidate</th>
                          <th className="pb-3">Role</th>
                          <th className="pb-3">Start Date</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 pr-2 text-right">Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {CANDIDATE_ROWS.map((candidate) => (
                          <tr key={candidate.email} className="group rounded-lg transition-colors hover:bg-[#f2f4f6]">
                            <td className="rounded-l-lg py-4 pl-2">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-[#4c5c72]" />
                                <div>
                                  <Link
                                    to="/hr/onboarding/$employeeId"
                                    params={{ employeeId: candidate.employeeId }}
                                    className="text-sm font-bold text-[#191c1e] hover:text-[#003d9b] hover:underline"
                                  >
                                    {candidate.name}
                                  </Link>
                                  <p className="text-[10px] text-[#434654]">{candidate.email}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-4">
                              <p className="text-sm font-medium text-[#191c1e]">{candidate.role}</p>
                              <p className="text-[10px] text-[#434654]">{candidate.department}</p>
                            </td>

                            <td className="py-4">
                              <p className="text-sm font-medium text-[#191c1e]">{candidate.startDate}</p>
                              <p className="text-[10px] text-[#434654]">{candidate.startEta}</p>
                            </td>

                            <td className="py-4">
                              <div className="inline-flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${candidate.active ? 'animate-pulse bg-[#003d9b]' : 'bg-[#c3c6d6]'}`} />
                                <span className={`text-xs font-semibold ${candidate.active ? 'text-[#003d9b]' : 'text-[#434654]'}`}>
                                  {candidate.status}
                                </span>
                              </div>
                            </td>

                            <td className="rounded-r-lg py-4 pr-2 text-right">
                              <button className="rounded-full p-1.5 text-[#737685] transition-colors hover:text-[#003d9b]">
                                <CircleEllipsis className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
        </div>
      </main>
    </PageTransition>
  );
}
