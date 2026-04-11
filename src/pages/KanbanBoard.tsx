import { useState } from 'react';
import { useLeads, useUpdateLead, Lead } from '@/hooks/useLeads';
import { LEAD_STATUSES } from '@/lib/constants';
import LeadStatusBadge from '@/components/crm/LeadStatusBadge';
import LeadDetailDialog from '@/components/crm/LeadDetailDialog';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Building, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const KanbanBoard = () => {
  const { data: leads = [] } = useLeads();
  const updateLead = useUpdateLead();
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDrop = async (status: string) => {
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
      <h1 className="text-2xl font-bold">Kanban Board</h1>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {LEAD_STATUSES.map(status => {
          const columnLeads = leads.filter(l => l.status === status.value);
          return (
            <div
              key={status.value}
              className="flex-shrink-0 w-72"
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(status.value)}
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <LeadStatusBadge status={status.value} />
                <span className="text-xs text-muted-foreground font-medium">{columnLeads.length}</span>
              </div>
              <div className="space-y-2 min-h-[200px] p-2 rounded-lg bg-muted/50">
                {columnLeads.map(lead => (
                  <Card
                    key={lead.id}
                    draggable
                    onDragStart={() => setDraggedId(lead.id)}
                    onClick={() => setDetailLead(lead)}
                    className={cn(
                      'p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border',
                      draggedId === lead.id && 'opacity-50'
                    )}
                  >
                    <p className="font-medium text-sm">{lead.name}</p>
                    {lead.company && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Building className="w-3 h-3" />
                        {lead.company}
                      </div>
                    )}
                    {(lead.value || 0) > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <DollarSign className="w-3 h-3" />
                        ${(lead.value || 0).toLocaleString()}
                      </div>
                    )}
                  </Card>
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
