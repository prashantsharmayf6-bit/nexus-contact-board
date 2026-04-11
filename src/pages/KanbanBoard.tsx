import { useState } from 'react';
import { useLeads, useUpdateLead, Lead } from '@/hooks/useLeads';
import { LEAD_STATUSES } from '@/lib/constants';
import LeadDetailDialog from '@/components/crm/LeadDetailDialog';
import { cn } from '@/lib/utils';
import { Building, IndianRupee, GripVertical, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

const KanbanBoard = () => {
  const { data: leads = [] } = useLeads();
  const updateLead = useUpdateLead();
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const handleDrop = async (status: string) => {
    setDropTarget(null);
    if (!draggedId) return;
    const lead = leads.find(l => l.id === draggedId);
    if (lead && lead.status !== status) {
      await updateLead.mutateAsync({ id: draggedId, status });
      toast.success(`Moved to ${status}`);
    }
    setDraggedId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kanban Board</h1>
        <p className="text-sm text-muted-foreground">{leads.length} leads across {LEAD_STATUSES.length} stages</p>
      </div>
      <div className="flex gap-5 overflow-x-auto pb-6 pt-1 px-1">
        {LEAD_STATUSES.map(status => {
          const columnLeads = leads.filter(l => l.status === status.value);
          const columnValue = columnLeads.reduce((sum, l) => sum + (l.value || 0), 0);
          const isDropping = dropTarget === status.value && draggedId;

          return (
            <div
              key={status.value}
              className="flex-shrink-0 w-[280px]"
              onDragOver={e => { e.preventDefault(); setDropTarget(status.value); }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={() => handleDrop(status.value)}
            >
              {/* Column Header - Solid Color */}
              <div
                className="rounded-t-xl px-4 py-3 flex items-center justify-between"
                style={{
                  backgroundColor: status.solidBg,
                  boxShadow: `0 4px 14px -2px ${status.solidBg}66`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: status.solidText }}>
                    {status.label}
                  </span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: status.solidText }}
                  >
                    {columnLeads.length}
                  </span>
                </div>
                {columnValue > 0 && (
                  <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    ₹{columnValue.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {/* Column Body */}
              <div
                className={cn(
                  'rounded-b-xl border border-t-0 p-3 space-y-3 min-h-[240px] transition-all duration-200',
                  'bg-gradient-to-b from-muted/60 to-muted/30',
                  isDropping && 'ring-2 ring-offset-2 scale-[1.02]',
                )}
                style={isDropping ? { ringColor: status.solidBg } : {}}
              >
                {columnLeads.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-xs text-muted-foreground/60 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                    Drop leads here
                  </div>
                )}
                {columnLeads.map(lead => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => setDraggedId(lead.id)}
                    onDragEnd={() => { setDraggedId(null); setDropTarget(null); }}
                    onClick={() => setDetailLead(lead)}
                    className={cn(
                      'group relative bg-card rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all duration-200',
                      'border border-border/50',
                      'shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08),0_4px_16px_-4px_rgba(0,0,0,0.05)]',
                      'hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)]',
                      'hover:-translate-y-0.5',
                      draggedId === lead.id && 'opacity-40 scale-95 rotate-1'
                    )}
                  >
                    {/* Colored accent bar */}
                    <div
                      className="absolute top-0 left-4 right-4 h-[3px] rounded-b-full"
                      style={{ backgroundColor: status.solidBg }}
                    />

                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm leading-tight">{lead.name}</p>
                      <GripVertical className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 flex-shrink-0 mt-0.5" />
                    </div>

                    {lead.company && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                        <Building className="w-3.5 h-3.5" />
                        <span>{lead.company}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {lead.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    {(lead.value || 0) > 0 && (
                      <div className="mt-3 pt-2 border-t border-border/50 flex items-center gap-1.5">
                        <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-sm font-bold text-emerald-600">
                          ₹{(lead.value || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <LeadDetailDialog lead={detailLead} open={!!detailLead} onOpenChange={() => setDetailLead(null)} />
    </div>
  );
};

export default KanbanBoard;
