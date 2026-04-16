import { useState, useMemo } from 'react';
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead, Lead } from '@/hooks/useLeads';
import { LEAD_STATUSES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import LeadStatusBadge from '@/components/crm/LeadStatusBadge';
import LeadFormDialog from '@/components/crm/LeadFormDialog';
import LeadDetailDialog from '@/components/crm/LeadDetailDialog';
import LeadFilters from '@/components/crm/LeadFilters';
import { useAllProfilesMap } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Pencil, Trash2, Eye, Building, Mail, Phone, IndianRupee, ArrowUpDown, TrendingUp, Users, Zap, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const Leads = () => {
  const { data: leads = [], isLoading } = useLeads();
  const { profilesMap } = useAllProfilesMap();
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
    const { shared_with, ...leadData } = data;
    await createLead.mutateAsync(leadData);
    setFormOpen(false);
    toast.success('Lead created');
  };

  const handleUpdate = async (data: any) => {
    if (!editLead) return;
    const { shared_with, ...leadData } = data;
    await updateLead.mutateAsync({ id: editLead.id, ...leadData });
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
  const wonLeads = filtered.filter(l => l.status === 'won').length;
  const activeLeads = filtered.filter(l => !['won', 'lost'].includes(l.status)).length;

  // Stats cards data
  const stats = [
    { label: 'Total Leads', value: filtered.length, icon: Users, color: '#3B82F6', gradient: 'from-blue-500 to-blue-600' },
    { label: 'Pipeline Value', value: `₹${totalValue.toLocaleString('en-IN')}`, icon: IndianRupee, color: '#10B981', gradient: 'from-emerald-500 to-emerald-600' },
    { label: 'Active Deals', value: activeLeads, icon: Zap, color: '#8B5CF6', gradient: 'from-purple-500 to-purple-600' },
    { label: 'Won', value: wonLeads, icon: TrendingUp, color: '#F59E0B', gradient: 'from-amber-500 to-amber-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and track your sales pipeline</p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="bg-gradient-to-b from-primary to-primary/90 shadow-[0_4px_14px_-2px_hsl(var(--primary)/0.4),inset_0_1px_0_hsl(0_0%_100%/0.15)] hover:shadow-[0_6px_20px_-2px_hsl(var(--primary)/0.5)] hover:-translate-y-0.5 transition-all duration-200 font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Lead
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-2xl p-4 text-white"
            style={{
              background: `linear-gradient(145deg, ${stat.color}, ${stat.color}dd)`,
              boxShadow: `0 8px 24px -4px ${stat.color}40, 0 4px 8px -2px ${stat.color}30, inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.1)`,
            }}
          >
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -translate-y-6 translate-x-6" style={{ background: 'white' }} />
            <stat.icon className="w-5 h-5 mb-2 opacity-80" />
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-xs font-medium opacity-75 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.5)]">
        <LeadFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Sort bar */}
      <div className="flex items-center gap-1 px-1">
        {(['name', 'value', 'created_at'] as const).map((field) => {
          const labels = { name: 'Name', value: 'Value', created_at: 'Date' };
          const isActive = sortField === field;
          return (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary shadow-[0_2px_6px_-1px_hsl(var(--primary)/0.2)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {labels[field]}
              <ArrowUpDown className={`w-3 h-3 ${isActive ? 'opacity-100' : 'opacity-40'}`} />
              {isActive && (
                <span className="text-[10px] opacity-60">{sortDir === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          );
        })}
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Lead Cards */}
      <div className="space-y-3">
        {isLoading && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="inline-flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              Loading leads...
            </div>
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-border/60 py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-base font-semibold text-foreground mb-1">No leads found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or add a new lead</p>
          </div>
        )}

        {filtered.map((lead) => {
          const statusInfo = LEAD_STATUSES.find(s => s.value === lead.status);
          const statusColor = statusInfo?.solidBg || '#94a3b8';
          return (
            <div
              key={lead.id}
              onClick={() => setDetailLead(lead)}
              className="group relative rounded-2xl border border-border/40 bg-card cursor-pointer transition-all duration-300 hover:-translate-y-1"
              style={{
                boxShadow: `0 2px 8px -2px rgba(0,0,0,0.06), 0 4px 16px -4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(0,0,0,0.03)`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px -6px ${statusColor}20, 0 8px 20px -4px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(0,0,0,0.03)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 8px -2px rgba(0,0,0,0.06), 0 4px 16px -4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(0,0,0,0.03)`;
              }}
            >
              {/* Top accent line */}
              <div
                className="absolute top-0 left-6 right-6 h-[3px] rounded-b-full opacity-80 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, transparent, ${statusColor}, transparent)` }}
              />

              <div className="p-4 pl-5">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                    style={{
                      background: `linear-gradient(145deg, ${statusColor}, ${statusColor}cc)`,
                      boxShadow: `0 4px 12px -2px ${statusColor}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
                    }}
                  >
                    {lead.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Lead info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-semibold text-sm truncate text-foreground">{lead.name}</h3>
                      <LeadStatusBadge status={lead.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {lead.company && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building className="w-3 h-3 opacity-60" /> {lead.company}
                        </span>
                      )}
                      {lead.email && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3 opacity-60" /> {lead.email}
                        </span>
                      )}
                      {lead.phone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3 opacity-60" /> {lead.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Value pill */}
                  <div className="flex-shrink-0">
                    <div
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-bold"
                      style={{
                        background: 'linear-gradient(145deg, #10B98118, #10B98108)',
                        color: '#10B981',
                        boxShadow: 'inset 0 1px 0 rgba(16,185,129,0.1), 0 1px 3px rgba(16,185,129,0.05)',
                      }}
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      {(lead.value || 0).toLocaleString('en-IN')}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 text-right capitalize">{lead.source || 'manual'}</p>
                  </div>

                  {/* Owner avatar */}
                  {lead.assigned_to && profilesMap.get(lead.assigned_to) && (() => {
                    const owner = profilesMap.get(lead.assigned_to!);
                    const ownerName = owner?.full_name || `${owner?.first_name || ''} ${owner?.last_name || ''}`.trim() || 'Unknown';
                    const ownerInitial = (owner?.first_name?.[0] || owner?.full_name?.[0] || '?').toUpperCase();
                    return (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex-shrink-0">
                            <Avatar className="w-7 h-7 border-2 border-background shadow-sm">
                              <AvatarImage src={owner?.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{ownerInitial}</AvatarFallback>
                            </Avatar>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top"><p className="text-xs">Owner: {ownerName}</p></TooltipContent>
                      </Tooltip>
                    );
                  })()}

                  {/* Date */}
                  <div className="text-right flex-shrink-0 hidden md:block">
                    <p className="text-xs text-muted-foreground font-medium">{format(new Date(lead.created_at), 'dd MMM yyyy')}</p>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => setDetailLead(lead)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-amber-500/10 hover:text-amber-600" onClick={() => setEditLead(lead)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(lead.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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
