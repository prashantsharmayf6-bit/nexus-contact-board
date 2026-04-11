import { useState, useMemo } from 'react';
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead, Lead } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LeadStatusBadge from '@/components/crm/LeadStatusBadge';
import LeadFormDialog from '@/components/crm/LeadFormDialog';
import LeadDetailDialog from '@/components/crm/LeadDetailDialog';
import LeadFilters from '@/components/crm/LeadFilters';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
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

  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (filters.search && !l.name.toLowerCase().includes(filters.search.toLowerCase()) && !l.company?.toLowerCase().includes(filters.search.toLowerCase()) && !l.email?.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.status !== 'all' && l.status !== filters.status) return false;
      if (filters.source !== 'all' && l.source !== filters.source) return false;
      if (filters.dateFrom && new Date(l.created_at) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(l.created_at) > new Date(filters.dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [leads, filters]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leads</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Lead
        </Button>
      </div>

      <LeadFilters filters={filters} onChange={setFilters} />

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
            {!isLoading && filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No leads found</TableCell></TableRow>}
            {filtered.map(lead => (
              <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailLead(lead)}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>{lead.company || '—'}</TableCell>
                <TableCell><LeadStatusBadge status={lead.status} /></TableCell>
                <TableCell className="capitalize">{lead.source || '—'}</TableCell>
                <TableCell>₹{(lead.value || 0).toLocaleString('en-IN')}</TableCell>
                <TableCell>{format(new Date(lead.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={() => setDetailLead(lead)}><Eye className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditLead(lead)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(lead.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} loading={createLead.isPending} />
      {editLead && <LeadFormDialog open={!!editLead} onOpenChange={() => setEditLead(null)} onSubmit={handleUpdate} initialData={editLead} loading={updateLead.isPending} />}
      <LeadDetailDialog lead={detailLead} open={!!detailLead} onOpenChange={() => setDetailLead(null)} />
    </div>
  );
};

export default Leads;
