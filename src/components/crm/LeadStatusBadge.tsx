import { LEAD_STATUSES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const LeadStatusBadge = ({ status }: { status: string }) => {
  const s = LEAD_STATUSES.find(s => s.value === status);
  if (!s) return <span>{status}</span>;
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', s.color)}>
      {s.label}
    </span>
  );
};

export default LeadStatusBadge;
