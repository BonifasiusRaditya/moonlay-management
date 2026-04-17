import { Link, createFileRoute, redirect } from '@tanstack/react-router';
import {
  ArrowRight,
  Building2,
  Camera,
  ChevronLeft,
  CircleHelp,
  Info,
  Settings,
  UserPlus,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { ConfirmationDialog } from '@/components/confirmation_dialog';
import { PageTransition } from '@/components/page_transition';
import { useNotificationStore } from '@/stores/notificationStore';
import { useUserStore } from '@/stores/userStore';

const roleOptions = [
  'Senior Solutions Architect',
  'Product Manager',
  'Head of Operations',
  'Data Scientist',
] as const;

const departmentOptions = [
  'Engineering & Infrastructure',
  'Growth & Marketing',
  'Strategic Finance',
  'People Ops',
] as const;

const managerOptions = ['Sarah Chen (VP Engineering)', 'Marcus Aurelius (CTO)', 'Elena Rodriguez (HR Director)'] as const;

const onboardingSchema = z.object({
  fullName: z.string().min(3, 'Full legal name must be at least 3 characters.'),
  personalEmail: z.string().email('Please provide a valid personal email.'),
  startDate: z.string().min(1, 'Start date is required.'),
  role: z.string().min(1, 'Role is required.'),
  department: z.string().min(1, 'Department is required.'),
  manager: z.string().min(1, 'Reporting manager is required.'),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const defaultFormData: OnboardingFormData = {
  fullName: '',
  personalEmail: '',
  startDate: '',
  role: roleOptions[0],
  department: departmentOptions[0],
  manager: managerOptions[0],
};

export const Route = createFileRoute('/hr/create/onboarding')({
  beforeLoad: () => {
    const { token, user } = useUserStore.getState();
    if (!token || !user) {
      throw redirect({
        to: '/login',
        replace: true,
      });
    }
  },
  component: HrOnboardingCreatePage,
});

function HrOnboardingCreatePage() {
  const addNotification = useNotificationStore((state) => state.addNotification);

  const [formData, setFormData] = useState<OnboardingFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewName = useMemo(() => (formData.fullName.trim() ? formData.fullName : 'New Hire Preview'), [formData.fullName]);

  const clearFieldError = (fieldName: keyof OnboardingFormData) => {
    if (!formErrors[fieldName]) {
      return;
    }

    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const handleFieldChange = (fieldName: keyof OnboardingFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    clearFieldError(fieldName);
  };

  const validateForm = () => {
    const result = onboardingSchema.safeParse(formData);

    if (result.success) {
      setFormErrors({});
      return true;
    }

    const nextErrors: Record<string, string> = {};
    result.error.errors.forEach((error) => {
      const path = error.path.join('.');
      nextErrors[path] = error.message;
    });
    setFormErrors(nextErrors);
    return false;
  };

  const handleSubmitClick = () => {
    const valid = validateForm();
    if (!valid) {
      addNotification({
        type: 'warning',
        title: 'Form is incomplete',
        message: 'Resolve highlighted fields before finalizing onboarding.',
      });
      return;
    }

    setIsConfirmOpen(true);
  };

  const finalizeOnboarding = async () => {
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      setIsConfirmOpen(false);
      setFormData(defaultFormData);
      setFormErrors({});
      addNotification({
        type: 'success',
        title: 'Onboarding initialized',
        message: 'Employee registry was created and workflow provisioning has started.',
      });
    } catch {
      addNotification({
        type: 'error',
        title: 'Initialization failed',
        message: 'Could not finalize onboarding. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] pb-6">
        <div className="mx-auto w-full max-w-5xl p-4 md:p-8">
              <div className="mb-6">
                <Link to="/hr" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#434654] hover:bg-slate-200/70">
                  <ChevronLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </div>

              <div className="relative mb-10">
                <div className="absolute -left-2 top-1 h-12 w-1 bg-[#003d9b]" />
                <h1 className="pl-4 text-3xl font-extrabold tracking-tight md:text-4xl">New Employee Registry</h1>
                <p className="mt-2 max-w-3xl pl-4 text-sm text-[#434654]">
                  Initialize the organizational record for new talent. This action triggers provisioning workflows across internal teams.
                </p>
              </div>

              <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                <form
                  className="space-y-6 lg:col-span-8"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSubmitClick();
                  }}
                >
                  <div className="mb-8 flex gap-2">
                    <div className="h-1 flex-1 rounded-full bg-[#003d9b]" />
                    <div className="h-1 flex-1 rounded-full bg-[#e6e8ea]" />
                    <div className="h-1 flex-1 rounded-full bg-[#e6e8ea]" />
                  </div>

                  <section className="rounded-xl bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-6 flex items-center gap-3">
                      <UserPlus className="h-5 w-5 text-[#003d9b]" />
                      <h2 className="text-lg font-bold">Identity Details</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest text-[#434654]">Full Legal Name</label>
                        <input
                          value={formData.fullName}
                          onChange={(event) => handleFieldChange('fullName', event.target.value)}
                          className={`w-full rounded-t-lg border-0 border-b-2 bg-[#f2f4f6] px-4 py-3 text-sm text-[#191c1e] focus:ring-0 ${
                            formErrors.fullName ? 'border-red-500' : 'border-[#c3c6d6] focus:border-[#003d9b]'
                          }`}
                          placeholder="e.g. Jonathan Aris-Thompson"
                          type="text"
                        />
                        {formErrors.fullName && <p className="mt-1 text-sm text-red-600">{formErrors.fullName}</p>}
                      </div>

                      <div>
                        <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest text-[#434654]">Personal Email</label>
                        <input
                          value={formData.personalEmail}
                          onChange={(event) => handleFieldChange('personalEmail', event.target.value)}
                          className={`w-full rounded-t-lg border-0 border-b-2 bg-[#f2f4f6] px-4 py-3 text-sm text-[#191c1e] focus:ring-0 ${
                            formErrors.personalEmail ? 'border-red-500' : 'border-[#c3c6d6] focus:border-[#003d9b]'
                          }`}
                          placeholder="jonathan.t@personal.com"
                          type="email"
                        />
                        {formErrors.personalEmail && <p className="mt-1 text-sm text-red-600">{formErrors.personalEmail}</p>}
                      </div>

                      <div>
                        <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest text-[#434654]">Start Date</label>
                        <input
                          value={formData.startDate}
                          onChange={(event) => handleFieldChange('startDate', event.target.value)}
                          className={`w-full rounded-t-lg border-0 border-b-2 bg-[#f2f4f6] px-4 py-3 text-sm text-[#191c1e] focus:ring-0 ${
                            formErrors.startDate ? 'border-red-500' : 'border-[#c3c6d6] focus:border-[#003d9b]'
                          }`}
                          type="date"
                        />
                        {formErrors.startDate && <p className="mt-1 text-sm text-red-600">{formErrors.startDate}</p>}
                      </div>
                    </div>
                  </section>

                  <section className="rounded-xl bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-6 flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-[#003d9b]" />
                      <h2 className="text-lg font-bold">Organizational Role</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest text-[#434654]">Designated Role</label>
                        <select
                          value={formData.role}
                          onChange={(event) => handleFieldChange('role', event.target.value)}
                          className="w-full appearance-none rounded-t-lg border-0 border-b-2 border-[#c3c6d6] bg-[#f2f4f6] px-4 py-3 text-sm text-[#191c1e] focus:border-[#003d9b] focus:ring-0"
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest text-[#434654]">Department</label>
                        <select
                          value={formData.department}
                          onChange={(event) => handleFieldChange('department', event.target.value)}
                          className="w-full appearance-none rounded-t-lg border-0 border-b-2 border-[#c3c6d6] bg-[#f2f4f6] px-4 py-3 text-sm text-[#191c1e] focus:border-[#003d9b] focus:ring-0"
                        >
                          {departmentOptions.map((department) => (
                            <option key={department} value={department}>
                              {department}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest text-[#434654]">Reporting Manager</label>
                        <div className="flex items-center gap-4 rounded-lg bg-[#f2f4f6] p-4">
                          <div className="h-10 w-10 rounded-full bg-[#b7c8e1]" />
                          <select
                            value={formData.manager}
                            onChange={(event) => handleFieldChange('manager', event.target.value)}
                            className="w-full border-0 bg-transparent p-0 text-sm font-semibold text-[#191c1e] focus:ring-0"
                          >
                            {managerOptions.map((manager) => (
                              <option key={manager} value={manager}>
                                {manager}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      className="rounded-lg px-6 py-2.5 text-sm font-bold text-[#434654] transition-all hover:bg-[#e6e8ea]"
                      onClick={() => {
                        setFormData(defaultFormData);
                        setFormErrors({});
                      }}
                    >
                      Cancel Entry
                    </button>

                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#003d9b] to-[#0052cc] px-8 py-3 text-sm font-bold text-white shadow-xl transition-all active:scale-95"
                    >
                      Finalize Onboarding
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </form>

                <aside className="space-y-6 lg:col-span-4">
                  <section className="relative overflow-hidden rounded-xl bg-[#f2f4f6] p-6">
                    <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[#003d9b]/5" />
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#434654]">Draft Preview</h3>
                    <div className="mb-6 flex items-center gap-4">
                      <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-[#c3c6d6] bg-[#e0e3e5]">
                        <Camera className="h-7 w-7 text-[#737685]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{previewName}</p>
                        <p className="text-xs text-[#434654]">{formData.department}</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#434654]">Access Level</span>
                        <span className="font-semibold text-[#003d9b]">Full Employee</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#434654]">Asset Kit</span>
                        <span className="font-semibold">Standard Macbook Pro</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#434654]">Visa Status</span>
                        <span className="font-semibold">Not Required</span>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-xl border-l-4 border-[#35445a] bg-white/85 p-6 shadow-sm backdrop-blur-xl">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
                      <Info className="h-4 w-4 text-[#35445a]" />
                      Compliance Check
                    </h3>
                    <p className="mb-4 text-xs leading-relaxed text-[#434654]">
                      Ensure legal names match government ID. Employment contracts are generated from selected role and department.
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#003d9b]">
                      <CircleHelp className="h-3.5 w-3.5" />
                      View Hiring Policy
                    </span>
                  </section>
                </aside>
              </div>
        </div>

        <ConfirmationDialog
          open={isConfirmOpen}
          onOpenChange={(open) => {
            if (!isSubmitting) {
              setIsConfirmOpen(open);
            }
          }}
          title="Finalize onboarding?"
          description="This will create an employee registry and trigger automated provisioning workflows."
          confirmLabel="Confirm and Continue"
          cancelLabel="Review Form"
          variant="info"
          onConfirm={finalizeOnboarding}
          isLoading={isSubmitting}
        />
      </div>
    </PageTransition>
  );
}
