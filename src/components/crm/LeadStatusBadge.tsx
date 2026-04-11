import { LEAD_STATUSES } from '@/lib/constants';

const LeadStatusBadge = ({ status }: { status: string }) => {
  const s = LEAD_STATUSES.find(s => s.value === status);
  if (!s) return <span>{status}</span>;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold tracking-wide uppercase"
      style={{
        color: s.solidBg,
        background: `${s.solidBg}14`,
        boxShadow: `inset 0 0 0 1px ${s.solidBg}25`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.solidBg }} />
      {s.label}
    </span>
  );
};

export default LeadStatusBadge;
