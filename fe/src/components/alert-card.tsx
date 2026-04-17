import type { Alert } from '@/types/alert';
import dayjs from '@/utils/dayjs';
import { Button } from './button';
import { cn } from '@/utils/cn';

function toTitleCase(value: string) {
  return value
    .split('_')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

function SeverityPill({ severity }: { severity: Alert['severity'] }) {
  const styles =
    severity === 'critical'
      ? 'bg-red-100 text-red-800 border-red-200'
      : severity === 'warning'
        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
        : 'bg-blue-100 text-blue-800 border-blue-200';

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border', styles)}>
      {toTitleCase(severity)}
    </span>
  );
}

export function AlertCard({
  alert,
  canResolve,
  onResolveClick,
  isSelectable = false,
  isSelected = false,
  onSelectionChange,
}: {
  alert: Alert;
  canResolve: boolean;
  onResolveClick: (alert: Alert) => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (alertId: number, selected: boolean) => void;
}) {
  const isResolved = !!alert.resolved_at;

  return (
    <div className={cn('p-4 rounded border bg-white', isResolved ? 'border-gray-200 opacity-75' : 'border-gray-300')}>
      <div className="flex items-start justify-between gap-4">
        {isSelectable && !isResolved && (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelectionChange?.(alert.id, e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
        )}
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <SeverityPill severity={alert.severity} />
            <span className="text-sm font-semibold text-gray-900">{toTitleCase(alert.alert_type)}</span>
            {alert.device_id !== null && (
              <span className="text-xs text-gray-500">Device #{alert.device_id}</span>
            )}
            {alert.license_id !== null && (
              <span className="text-xs text-gray-500">License #{alert.license_id}</span>
            )}
          </div>
          <p className="text-sm text-gray-800">{alert.message}</p>
          <p className="text-xs text-gray-500">
            Created: {dayjs(alert.created_at).format('MMM DD, YYYY HH:mm')}
            {isResolved && alert.resolved_at
              ? ` • Resolved: ${dayjs(alert.resolved_at).format('MMM DD, YYYY HH:mm')}`
              : ''}
          </p>
        </div>

        {!isResolved && canResolve && (
          <Button variant="secondary" size="sm" onClick={() => onResolveClick(alert)}>
            Resolve
          </Button>
        )}
      </div>
    </div>
  );
}

