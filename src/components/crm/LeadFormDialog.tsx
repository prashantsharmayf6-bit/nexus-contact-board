import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LEAD_STATUSES, LEAD_SOURCES } from '@/lib/constants';
import { Lead } from '@/hooks/useLeads';
import { useTeams } from '@/hooks/useTeams';
import { useAllProfilesMap } from '@/hooks/useProfiles';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (lead: any) => void;
  initialData?: Lead | null;
  loading?: boolean;
}

const LeadFormDialog = ({ open, onOpenChange, onSubmit, initialData, loading }: Props) => {
  const { data: teams = [] } = useTeams();
  const { data: profiles = [] } = useAllProfilesMap();
  const [form, setForm] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    company: initialData?.company || '',
    title: initialData?.title || '',
    status: initialData?.status || 'new',
    source: initialData?.source || 'manual',
    value: initialData?.value?.toString() || '0',
    notes: initialData?.notes || '',
    team_id: initialData?.team_id || 'none',
    assigned_to: initialData?.assigned_to || 'none',
  });

  useEffect(() => {
    if (open && initialData) {
      setForm({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        company: initialData.company || '',
        title: initialData.title || '',
        status: initialData.status || 'new',
        source: initialData.source || 'manual',
        value: initialData.value?.toString() || '0',
        notes: initialData.notes || '',
        team_id: initialData.team_id || 'none',
        assigned_to: initialData.assigned_to || 'none',
      });
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      value: parseFloat(form.value) || 0,
      team_id: form.team_id === 'none' ? null : form.team_id,
      assigned_to: form.assigned_to === 'none' ? null : form.assigned_to,
    });
  };

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
          <DialogDescription>Fill in the lead details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => update('name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={form.company} onChange={e => update('company', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => update('title', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Value (₹)</Label>
              <Input type="number" value={form.value} onChange={e => update('value', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => update('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={form.source} onValueChange={v => update('source', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Owner assignment */}
          <div className="space-y-2">
            <Label>Assign Owner</Label>
            <Select value={form.assigned_to} onValueChange={v => update('assigned_to', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {(profiles || []).map((p: any) => (
                  <SelectItem key={p.user_id} value={p.user_id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={p.avatar_url || undefined} />
                        <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                          {(p.first_name?.[0] || p.full_name?.[0] || '?').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown'}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {teams.length > 0 && (
            <div className="space-y-2">
              <Label>Share with Team</Label>
              <Select value={form.team_id} onValueChange={v => update('team_id', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Private (only me)</SelectItem>
                  {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{initialData ? 'Update' : 'Create'} Lead</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadFormDialog;
