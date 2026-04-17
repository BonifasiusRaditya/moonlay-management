import { createFileRoute } from '@tanstack/react-router';
import { Card } from '@/components/card';
import { PageTransition } from '@/components/page_transition';

export const Route = createFileRoute('/reports')({
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <PageTransition>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Module status</p>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        </div>

        <Card className="p-6 rounded-xl border-gray-200 bg-white shadow-sm">
          <p className="text-base font-medium text-gray-900">Placeholder page</p>
          <p className="mt-2 text-sm text-gray-600">
            Report export services are temporarily unavailable after the latest update.
          </p>
        </Card>
      </div>
    </PageTransition>
  );
}
