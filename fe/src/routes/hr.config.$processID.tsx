import { createFileRoute } from '@tanstack/react-router';
import {
  CheckCircle2,
  ChevronRight,
  FolderOpen,
  Lock,
  Mail,
  Settings,
  Upload,
  UserPlus,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmationDialog } from '@/components/confirmation_dialog';
import { PageTransition } from '@/components/page_transition';
import { useNotificationStore } from '@/stores/notificationStore';
import { requireAuthBeforeLoad } from '@/utils/route_guards';

const PROCESS_TITLES: Record<string, string> = {
  'hiring-process': 'Hiring Process',
  'onboarding-process': 'Global Onboarding',
  'training-status': 'Training Status',
};

const WORKFLOW_STEPS = [
  {
    title: 'Document Upload',
    phase: 'Pre-Arrival Phase',
    eta: '4-8 Hours Est.',
    description: 'Candidate submits ID, tax forms, and signed agreements via the portal.',
    tone: 'border-[#003d9b] ring-[#dae2ff] text-[#003d9b]',
    tags: ['Auto-Verify', 'AES-256'],
    accentIcon: Upload,
  },
  {
    title: 'IT Provisioning',
    phase: 'Operational Setup',
    eta: '24 Hours SLA',
    description: 'Trigger automatic creation of AD account, SSO permissions, and hardware procurement ticket.',
    tone: 'border-[#565e74] ring-[#e6e8ea] text-[#565e74]',
    tags: ['Departmental Handover'],
    accentIcon: Settings,
  },
  {
    title: 'Orientation Scheduled',
    phase: 'First Week Experience',
    eta: 'Final Step',
    description: 'Send calendar invitations for HR induction, safety briefings, and 1:1 manager intros.',
    tone: 'border-[#003d9b] ring-[#dae2ff] text-[#ffffff]',
    tags: ['Sync with Microsoft Outlook / Google Calendar'],
    accentIcon: CheckCircle2,
    final: true,
  },
];

function HrConfigPage() {
  const { processID } = Route.useParams();
  const processTitle = PROCESS_TITLES[processID] ?? 'HR Workflow Engine';

  const addNotification = useNotificationStore((state) => state.addNotification);
  const [triggerEmailEnabled, setTriggerEmailEnabled] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const headingTitle = useMemo(() => `Process Configuration: ${processTitle}`, [processTitle]);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      addNotification({
        type: 'success',
        title: 'Workflow published',
        message: `${processTitle} configuration is now active.`,
      });
      setIsConfirmOpen(false);
    } catch {
      addNotification({
        type: 'error',
        title: 'Publish failed',
        message: 'Could not publish workflow. Please retry.',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#f7f9fb] font-body text-[#191c1e]">
        <main className="p-4 md:p-8">
            <header className="mb-8">
              <div className="mb-2 flex items-center gap-2 text-sm text-[#434654]">
                <span>Admin</span>
                <ChevronRight className="h-3.5 w-3.5" />
                <span>System Configuration</span>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="font-semibold text-[#003d9b]">HR Workflow Engine</span>
              </div>
              <h1 className="font-headline text-3xl font-extrabold tracking-tight">{headingTitle}</h1>
              <p className="mt-2 max-w-2xl text-sm text-[#434654]">
                Define behavioral triggers, asset allocation folders, and communication templates for the standard new-hire journey.
              </p>
            </header>

            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
              <section className="space-y-6 lg:col-span-5">
                <div className="rounded-xl bg-white p-6 shadow-[0_12px_32px_-4px_rgba(25,28,30,0.04)]">
                  <h2 className="mb-6 border-b border-[#c3c6d6] pb-3 font-headline text-lg font-bold">Automated Parameters</h2>

                  <div className="space-y-8">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <label className="block text-sm font-bold">Trigger Email</label>
                        <p className="text-xs text-[#434654]">Initiate communication sequences upon contract signature timestamp.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTriggerEmailEnabled((prev) => !prev)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          triggerEmailEnabled ? 'bg-[#0052cc]' : 'bg-[#c3c6d6]'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                            triggerEmailEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold">SharePoint CV Folder</label>
                      <div className="flex items-center gap-2 rounded-lg border-b-2 border-[#c3c6d6] bg-[#f2f4f6] px-4 py-3 focus-within:border-[#003d9b]">
                        <FolderOpen className="h-4 w-4 text-[#003d9b]" />
                        <input
                          className="w-full border-none bg-transparent p-0 text-sm outline-none"
                          defaultValue="HR/Onboarding/2024/CandidateVault"
                          type="text"
                        />
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-[#434654]">Root directory for secured document storage</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold">Welcome Email Template</label>
                      <div className="rounded-lg bg-[#f2f4f6] p-4 hover:bg-[#e6e8ea]">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="inline-flex items-center gap-2">
                            <Mail className="h-4 w-4 text-[#0052cc]" />
                            <span className="text-sm font-semibold">Global_Standard_Welcome_v2</span>
                          </div>
                          <Settings className="h-4 w-4 text-[#737685]" />
                        </div>
                        <p className="rounded bg-white/80 p-3 text-[11px] italic text-[#434654]">
                          &quot;Dear {'{{candidate_name}}'}, we are thrilled to have you join the team. Your journey begins on {'{{start_date}}'}...&quot;
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 border-t border-[#c3c6d6]/40 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">Data Retention Period</span>
                        <span className="rounded bg-[#dae2ff] px-2 py-1 text-xs font-bold text-[#003d9b]">24 Months</span>
                      </div>
                      <input className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-[#003d9b]" type="range" defaultValue={60} />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#4c5c72]/10 bg-[#4c5c72]/5 p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#d3e4fe] text-[#35445a]">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-headline text-sm font-bold">Policy Integrity</h3>
                      <p className="text-xs text-[#434654]">All changes are logged for SOC2 compliance and require Tier-3 admin approval.</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="relative overflow-hidden rounded-2xl bg-[#f2f4f6] p-6 md:p-8 lg:col-span-7">
                <div className="mb-8 inline-flex items-center gap-2 font-headline text-xl font-bold text-[#434654]">
                  <UserPlus className="h-5 w-5" />
                  Live Flow Logic
                </div>

                <div className="space-y-10">
                  {WORKFLOW_STEPS.map((step, index) => (
                    <div key={step.title} className="relative flex gap-5">
                      {index < WORKFLOW_STEPS.length - 1 && (
                        <div className="absolute left-[23px] top-12 h-[calc(100%+28px)] w-[2px] bg-[repeating-linear-gradient(to_bottom,#0052cc_0px,#0052cc_4px,transparent_4px,transparent_8px)]" />
                      )}

                      <div className={`z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white ring-4 ${step.final ? 'bg-gradient-to-br from-[#003d9b] to-[#0052cc] text-white ring-[#dae2ff]/50' : step.tone}`}>
                        <step.accentIcon className="h-5 w-5" />
                      </div>

                      <article className={`flex-1 rounded-xl bg-white p-5 shadow-sm transition-transform hover:scale-[1.01] ${step.final ? '' : `border-l-4 ${step.tone.split(' ')[0]}`}`}>
                        <div className="mb-2 flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-headline font-bold">{step.title}</h4>
                            <span className="mt-1 inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#003d9b] bg-[#dae2ff]">
                              {step.phase}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-[#434654]">{step.eta}</span>
                        </div>

                        <p className="text-sm text-[#434654]">{step.description}</p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {step.tags.map((tag) => (
                            <span key={tag} className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] ${step.final ? 'border border-[#0052cc]/15 bg-[#0052cc]/5 text-[#003d9b]' : 'bg-[#f2f4f6] text-[#434654]'}`}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </article>
                    </div>
                  ))}
                </div>

                <div className="mt-10 flex justify-end gap-3">
                  <button className="rounded-lg px-6 py-3 text-sm font-bold text-[#434654] hover:bg-[#e6e8ea]">Discard Draft</button>
                  <button
                    className="rounded-lg bg-gradient-to-br from-[#003d9b] to-[#0052cc] px-8 py-3 text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => setIsConfirmOpen(true)}
                    disabled={isPublishing}
                  >
                    {isPublishing ? 'Publishing...' : 'Publish Workflow'}
                  </button>
                </div>
              </section>
            </div>
        </main>

        <ConfirmationDialog
          open={isConfirmOpen}
          onOpenChange={(open) => {
            if (!isPublishing) {
              setIsConfirmOpen(open);
            }
          }}
          title="Publish workflow configuration?"
          description="This will apply the process automation changes and notify dependent systems."
          confirmLabel="Publish"
          cancelLabel="Cancel"
          variant="info"
          onConfirm={handlePublish}
          isLoading={isPublishing}
        />
      </div>
    </PageTransition>
  );
}

export const Route = createFileRoute('/hr/config/$processID')({
  beforeLoad: async () => {
    await requireAuthBeforeLoad();
  },
  component: HrConfigPage,
});
