import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { LEAD_STATUSES, LEAD_SOURCES } from '@/lib/constants';
import { Lead } from '@/hooks/useLeads';
import { useAllProfilesMap } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { User, Building, Mail, Phone, IndianRupee, Tag, FileText, Users, UserCheck, Briefcase, X } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (lead: any) => void;
  initialData?: Lead | null;
  loading?: boolean;
}

const LeadFormDialog = ({ open, onOpenChange, onSubmit, initialData, loading }: Props) => {
  const { user } = useAuth();
  const { data: profiles = [] } = useAllProfilesMap();
  const [sharedWith, setSharedWith] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    status: 'new',
    source: 'manual',
    value: '0',
    notes: '',
    assigned_to: 'none',
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: initialData?.name || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        company: initialData?.company || '',
        title: initialData?.title || '',
        status: initialData?.status || 'new',
        source: initialData?.source || 'manual',
        value: initialData?.value?.toString() || '0',
        notes: initialData?.notes || '',
        assigned_to: initialData?.assigned_to || 'none',
      });
      setSharedWith([]);
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      value: parseFloat(form.value) || 0,
      team_id: null,
      assigned_to: form.assigned_to === 'none' ? null : form.assigned_to,
      shared_with: sharedWith,
    });
  };

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const toggleShare = (userId: string) => {
    setSharedWith(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const otherProfiles = (profiles || []).filter((p: any) => p.user_id !== user?.id);
  const selectedOwner = (profiles || []).find((p: any) => p.user_id === form.assigned_to);

  const inputClasses = "h-10 rounded-xl border-border/60 bg-background/80 backdrop-blur-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_0_0_3px_hsl(var(--primary)/0.15)] focus:border-primary/40 transition-all duration-200";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border-border/40 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.15),0_12px_36px_-8px_rgba(0,0,0,0.1)]">
        {/* Header with gradient accent */}
        <div className="relative overflow-hidden px-6 pt-6 pb-4">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-brand-gradient" />
          <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/5 blur-3xl" />
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-xl font-bold tracking-tight">
              {initialData ? 'Edit Lead' : 'Add New Lead'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {initialData ? 'Update the lead information below.' : 'Fill in the contact details to create a new lead.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Contact Info Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <User className="w-3.5 h-3.5" />
              Contact Information
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 p-4 space-y-3 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)]">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <User className="w-3 h-3 text-muted-foreground" /> Name *
                  </Label>
                  <Input value={form.name} onChange={e => update('name', e.target.value)} required className={inputClasses} placeholder="John Doe" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-muted-foreground" /> Email
                  </Label>
                  <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} className={inputClasses} placeholder="john@company.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-muted-foreground" /> Phone
                  </Label>
                  <Input value={form.phone} onChange={e => update('phone', e.target.value)} className={inputClasses} placeholder="+91 98765 43210" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Building className="w-3 h-3 text-muted-foreground" /> Company
                  </Label>
                  <Input value={form.company} onChange={e => update('company', e.target.value)} className={inputClasses} placeholder="Acme Corp" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3 text-muted-foreground" /> Title
                </Label>
                <Input value={form.title} onChange={e => update('title', e.target.value)} className={inputClasses} placeholder="CEO, Manager, etc." />
              </div>
            </div>
          </div>

          {/* Deal Info Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5" />
              Deal Details
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 p-4 space-y-3 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)]">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <IndianRupee className="w-3 h-3 text-muted-foreground" /> Value
                  </Label>
                  <Input type="number" value={form.value} onChange={e => update('value', e.target.value)} className={inputClasses} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Status</Label>
                  <Select value={form.status} onValueChange={v => update('status', v)}>
                    <SelectTrigger className={inputClasses}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: s.solidBg }} />
                            {s.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Source</Label>
                  <Select value={form.source} onValueChange={v => update('source', v)}>
                    <SelectTrigger className={inputClasses}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEAD_SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Assignment */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <UserCheck className="w-3.5 h-3.5" />
              Assign Owner
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 p-4 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)]">
              <Select value={form.assigned_to} onValueChange={v => update('assigned_to', v)}>
                <SelectTrigger className={inputClasses}>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Unassigned</span>
                  </SelectItem>
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
          </div>

          {/* Share with Users */}
          {otherProfiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" />
                Share with Users
              </div>
              <div className="rounded-xl border border-border/40 bg-card/50 p-4 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)]">
                {/* Selected chips */}
                {sharedWith.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {sharedWith.map(uid => {
                      const p = (profiles || []).find((pr: any) => pr.user_id === uid);
                      if (!p) return null;
                      const pName = p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown';
                      return (
                        <span
                          key={uid}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                        >
                          <Avatar className="w-4 h-4">
                            <AvatarImage src={p.avatar_url || undefined} />
                            <AvatarFallback className="text-[8px] bg-primary/20 text-primary">
                              {(p.first_name?.[0] || '?').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {pName}
                          <button type="button" onClick={() => toggleShare(uid)} className="ml-0.5 hover:text-destructive transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                {/* User list */}
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {otherProfiles.map((p: any) => {
                    const pName = p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown';
                    const isSelected = sharedWith.includes(p.user_id);
                    return (
                      <label
                        key={p.user_id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-primary/8 border border-primary/20'
                            : 'hover:bg-muted/60 border border-transparent'
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleShare(p.user_id)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={p.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {(p.first_name?.[0] || p.full_name?.[0] || '?').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">{pName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              Notes
            </div>
            <Textarea
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              rows={3}
              placeholder="Add any notes about this lead..."
              className="rounded-xl border-border/60 bg-background/80 backdrop-blur-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_0_0_3px_hsl(var(--primary)/0.15)] focus:border-primary/40 transition-all duration-200 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl px-5 border-border/60 hover:bg-muted/60 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl px-6 bg-gradient-to-b from-primary to-primary/90 shadow-[0_4px_14px_-2px_hsl(var(--primary)/0.4),inset_0_1px_0_hsl(0_0%_100%/0.15)] hover:shadow-[0_6px_20px_-2px_hsl(var(--primary)/0.5)] hover:-translate-y-0.5 transition-all duration-200 font-semibold"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {initialData ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                initialData ? 'Update Lead' : 'Create Lead'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadFormDialog;
