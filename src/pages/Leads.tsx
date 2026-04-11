import { useState, useMemo } from 'react';
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead, Lead } from '@/hooks/useLeads';
import { LEAD_STATUSES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LeadStatusBadge from '@/components/crm/LeadStatusBadge';
import LeadFormDialog from '@/components/crm/LeadFormDialog';
import LeadDetailDialog from '@/components/crm/LeadDetailDialog';
import LeadFilters from '@/components/crm/LeadFilters';
import { Plus, Pencil, Trash2, Eye, Building, Mail, Phone, IndianRupee, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const Leads = () => {
  const { data: leads = [], isLoading } = useLeads();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const [formOpen, setFormOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [filters, setFilters] = useState({ search: '', status: 'all', source: 'all', dateFrom: '', dateTo: '' });
  const [sortField, setSortField] = useState<'name' | 'value' | 'created_at'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    const result = leads.filter(l => {
      if (filters.search && !l.name.toLowerCase().includes(filters.search.toLowerCase()) && !l.company?.toLowerCase().includes(filters.search.toLowerCase()) && !l.email?.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.status !== 'all' && l.status !== filters.status) return false;
      if (filters.source !== 'all' && l.source !== filters.source) return false;
      if (filters.dateFrom && new Date(l.created_at) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(l.created_at) > new Date(filters.dateTo + 'T23:59:59')) return false;
      return true;
    });
    return result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'value') cmp = (a.value || 0) - (b.value || 0);
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [leads, filters, sortField, sortDir]);

  const handleCreate = async (data: any) => {
    await createLead.mutateAsync(data);
    setFormOpen(false);
    toast.success('Lead created');
  };

  const handleUpdate = async (data: any) => {
    if (!editLead) return;
    await updateLead.mutateAsync({ id: editLead.id, ...data });
    setEditLead(null);
    toast.success('Lead updated');
  };

  const handleDelete = async (id: string) => {
    await deleteLead.mutateAsync(id);
    toast.success('Lead deleted');
  };

  const toggleSort = (field: 'name' | 'value' | 'created_at') => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const totalValue = filtered.reduce((sum, l) => sum + (l.value || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} lead{filtered.length !== 1 ? 's' : ''} · Pipeline: ₹{totalValue.toLocaleString('en-IN')}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
          <Plus className="w-4 h-4 mr-2" /> Add Lead
        </Button>
      </div>

      <LeadFilters filters={filters} onChange={setFilters} />

      {/* Card-based lead list */}
      <div className="space-y-3">
        {/* Sort bar */}
        <div className="flex items-center gap-4 px-1">
          <button onClick={() => toggleSort('name')} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            Name <ArrowUpDown className="w-3 h-3" />
          </button>
          <button onClick={() => toggleSort('value')} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            Value <ArrowUpDown className="w-3 h-3" />
          </button>
          <button onClick={() => toggleSort('created_at')} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            Date <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-12 text-muted-foreground">Loading leads...</div>
        )}

        {!isLoading && filtered.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="text-lg font-medium mb-1">No leads found</p>
              <p className="text-sm">Try adjusting your filters or add a new lead</p>
            </CardContent>
          </Card>
        )}

        {filtered.map(lead => {
          const statusInfo = LEAD_STATUSES.find(s => s.value === lead.status);
          return (
            <div
              key={lead.id}
              onClick={() => setDetailLead(lead)}
              className="group relative bg-card rounded-xl border border-border/50 p-4 cursor-pointer transition-all duration-200 shadow-[0_1px_4px_-1px_rgba(0,0,0,0.06),0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1),0_4px_12px_-2px_rgba(0,0,0,0.05)] hover:-translate-y-0.5"
            >
              {/* Left accent */}
              <div
                className="absolute left-0 top-3 bottom-3 w-[4px] rounded-r-full"
                style={{ backgroundColor: statusInfo?.solidBg || '#94a3b8' }}
              />

              <div className="flex items-center gap-4 pl-3">
                {/* Lead info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-sm truncate">{lead.name}</h3>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    {lead.company && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Building className="w-3 h-3" /> {lead.company}
                      </span>
                    )}
                    {lead.email && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" /> {lead.email}
                      </span>
                    )}
                    {lead.phone && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" /> {lead.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Value */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 text-sm font-bold text-emerald-600">
                    <IndianRupee className="w-3.5 h-3.5" />
                    {(lead.value || 0).toLocaleString('en-IN')}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">{lead.source || 'manual'}</p>
                </div>

                {/* Date */}
                <div className="text-right flex-shrink-0 hidden md:block">
                  <p className="text-xs text-muted-foreground">{format(new Date(lead.created_at), 'dd MMM yyyy')}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailLead(lead)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditLead(lead)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(lead.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} loading={createLead.isPending} />
      {editLead && <LeadFormDialog open={!!editLead} onOpenChange={() => setEditLead(null)} onSubmit={handleUpdate} initialData={editLead} loading={updateLead.isPending} />}
      <LeadDetailDialog lead={detailLead} open={!!detailLead} onOpenChange={() => setDetailLead(null)} />
    </div>
  );
};

export default Leads;
