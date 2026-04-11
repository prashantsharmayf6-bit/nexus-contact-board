import { useState, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Lead } from '@/hooks/useLeads';
import { useLeadNotes, useAddNote, useCallLogs, useAddCallLog, useLeadActivities, useLeadAttachments, useAddAttachment } from '@/hooks/useLeadDetails';
import LeadStatusBadge from './LeadStatusBadge';
import { LEAD_STATUSES } from '@/lib/constants';
import { format } from 'date-fns';
import { ArrowLeft, Mail, Phone, MessageSquare, Clock, Paperclip, Upload, FileText, PhoneIncoming, PhoneOutgoing, Building, Tag, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateLead } from '@/hooks/useLeads';

interface Props {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LeadDetailDialog = ({ lead, open, onOpenChange }: Props) => {
  const [noteContent, setNoteContent] = useState('');
  const [callForm, setCallForm] = useState({ direction: 'outbound', duration_minutes: 5, outcome: '', notes: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: notes } = useLeadNotes(lead?.id || '');
  const { data: callLogs } = useCallLogs(lead?.id || '');
  const { data: activities } = useLeadActivities(lead?.id || '');
  const { data: attachments } = useLeadAttachments(lead?.id || '');
  const addNote = useAddNote();
  const addCallLog = useAddCallLog();
  const addAttachment = useAddAttachment();
  const updateLead = useUpdateLead();

  if (!lead) return null;

  const initials = lead.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const statusInfo = LEAD_STATUSES.find(s => s.value === lead.status);
  const statusColor = statusInfo?.solidBg || '#3B82F6';

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    await addNote.mutateAsync({ leadId: lead.id, content: noteContent });
    setNoteContent('');
    toast.success('Note added');
  };

  const handleAddCall = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCallLog.mutateAsync({ leadId: lead.id, ...callForm });
    setCallForm({ direction: 'outbound', duration_minutes: 5, outcome: '', notes: '' });
    toast.success('Call log added');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await addAttachment.mutateAsync({ leadId: lead.id, file });
    toast.success('File uploaded');
  };

  const handleStatusChange = async (newStatus: string) => {
    await updateLead.mutateAsync({ id: lead.id, status: newStatus });
    toast.success('Status updated');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'note': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'call': return <Phone className="w-4 h-4 text-green-500" />;
      case 'status_change': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'attachment': return <Paperclip className="w-4 h-4 text-purple-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden max-h-[90vh]">
        {/* Header bar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-background">
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-foreground">Lead Profile</h2>
            <p className="text-sm text-muted-foreground">Details for {lead.name}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row overflow-y-auto max-h-[calc(90vh-70px)]">
          {/* Left: Profile Card */}
          <div className="w-full md:w-72 flex-shrink-0 p-5">
            <div className="rounded-2xl overflow-hidden bg-card border border-border/40" style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.08)' }}>
              {/* Gradient header */}
              <div
                className="h-24 relative"
                style={{
                  background: `linear-gradient(135deg, ${statusColor}, ${statusColor}aa, hsl(var(--primary)))`,
                }}
              />
              {/* Avatar overlapping */}
              <div className="flex flex-col items-center -mt-10 pb-5 px-4">
                <Avatar className="w-20 h-20 border-4 border-card shadow-lg">
                  <AvatarFallback
                    className="text-xl font-bold text-primary bg-primary/10"
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-bold text-foreground mt-3 text-center">{lead.name}</h3>
                {lead.source && (
                  <span
                    className="mt-1.5 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: `${statusColor}15`, color: statusColor }}
                  >
                    <Tag className="w-3 h-3" />
                    {lead.source.charAt(0).toUpperCase() + lead.source.slice(1)} Source
                  </span>
                )}

                <div className="w-full mt-5 space-y-3">
                  {lead.email && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4 text-primary/60 flex-shrink-0" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4 text-primary/60 flex-shrink-0" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                  {lead.company && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Building className="w-4 h-4 text-primary/60 flex-shrink-0" />
                      <span>{lead.company}</span>
                    </div>
                  )}
                  {lead.title && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Tag className="w-4 h-4 text-primary/60 flex-shrink-0" />
                      <span>{lead.title}</span>
                    </div>
                  )}
                  {(lead.value !== null && lead.value !== undefined) && (
                    <div className="flex items-center gap-3 text-sm font-semibold text-emerald-600">
                      <IndianRupee className="w-4 h-4 flex-shrink-0" />
                      <span>₹{lead.value.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Tabs Content */}
          <div className="flex-1 p-5 min-w-0">
            <Tabs defaultValue="status" className="w-full">
              <TabsList className="w-full justify-start border-b border-border/50 bg-transparent p-0 h-auto rounded-none gap-0">
                {[
                  { value: 'status', label: 'Status & Notes' },
                  { value: 'log', label: 'Log' },
                  { value: 'calls', label: 'Calls' },
                  { value: 'files', label: 'Files' },
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm font-medium"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Status & Notes */}
              <TabsContent value="status" className="mt-5 space-y-6">
                <div>
                  <h4 className="text-base font-bold text-foreground mb-3">Lead Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {LEAD_STATUSES.map(s => (
                      <button
                        key={s.value}
                        onClick={() => handleStatusChange(s.value)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                        style={{
                          background: lead.status === s.value ? s.solidBg : `${s.solidBg}12`,
                          color: lead.status === s.value ? '#fff' : s.solidBg,
                          boxShadow: lead.status === s.value ? `0 4px 12px -2px ${s.solidBg}50` : 'none',
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-bold text-foreground">Add Note</h4>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={handleAddNote}
                      disabled={addNote.isPending || !noteContent.trim()}
                      className="text-primary text-sm font-semibold p-0 h-auto"
                    >
                      Save Note
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Type updates for the team..."
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value)}
                    rows={4}
                    className="rounded-xl border-border/60 bg-muted/30 resize-none"
                  />
                </div>

                {notes && notes.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Previous Notes</h4>
                    {notes.map(n => (
                      <div key={n.id} className="p-3 rounded-xl bg-muted/50 border border-border/30">
                        <p className="text-sm text-foreground">{n.content}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">{format(new Date(n.created_at), 'MMM d, yyyy h:mm a')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Activity Log */}
              <TabsContent value="log" className="mt-5 space-y-3">
                {activities?.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No activity yet</p>}
                {activities?.map(a => (
                  <div key={a.id} className="flex gap-3 items-start p-3 rounded-xl bg-muted/30 border border-border/30">
                    <div className="mt-0.5">{getActivityIcon(a.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{a.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(a.created_at), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                  </div>
                ))}
              </TabsContent>

              {/* Calls */}
              <TabsContent value="calls" className="mt-5 space-y-4">
                <form onSubmit={handleAddCall} className="space-y-3 p-4 rounded-xl border border-border/40 bg-muted/20">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Direction</Label>
                      <Select value={callForm.direction} onValueChange={v => setCallForm(f => ({ ...f, direction: v }))}>
                        <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="outbound">Outbound</SelectItem>
                          <SelectItem value="inbound">Inbound</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Duration (min)</Label>
                      <Input type="number" className="rounded-lg" value={callForm.duration_minutes} onChange={e => setCallForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Outcome</Label>
                    <Input className="rounded-lg" value={callForm.outcome} onChange={e => setCallForm(f => ({ ...f, outcome: e.target.value }))} placeholder="e.g., Interested, Follow up" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Notes</Label>
                    <Textarea className="rounded-lg resize-none" value={callForm.notes} onChange={e => setCallForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
                  </div>
                  <Button type="submit" size="sm" disabled={addCallLog.isPending} className="rounded-lg">Log Call</Button>
                </form>
                {callLogs?.map(c => (
                  <div key={c.id} className="flex gap-3 items-start p-3 rounded-xl bg-muted/30 border border-border/30">
                    {c.direction === 'inbound' ? <PhoneIncoming className="w-4 h-4 text-green-500 mt-0.5" /> : <PhoneOutgoing className="w-4 h-4 text-blue-500 mt-0.5" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{c.direction === 'inbound' ? 'Inbound' : 'Outbound'} · {c.duration_minutes} min</p>
                      {c.outcome && <p className="text-sm text-foreground/80">{c.outcome}</p>}
                      {c.notes && <p className="text-xs text-muted-foreground">{c.notes}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(c.called_at), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                  </div>
                ))}
              </TabsContent>

              {/* Files */}
              <TabsContent value="files" className="mt-5 space-y-4">
                <input type="file" ref={fileRef} className="hidden" onChange={handleFileUpload} />
                <Button variant="outline" className="rounded-lg" onClick={() => fileRef.current?.click()} disabled={addAttachment.isPending}>
                  <Upload className="w-4 h-4 mr-2" /> Upload File
                </Button>
                {attachments?.map(a => (
                  <a key={a.id} href={a.file_url} target="_blank" rel="noopener" className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
                    <FileText className="w-5 h-5 text-primary" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{a.file_name}</p>
                      <p className="text-xs text-muted-foreground">{a.file_size ? `${(a.file_size / 1024).toFixed(1)} KB` : ''} · {format(new Date(a.created_at), 'MMM d, yyyy')}</p>
                    </div>
                  </a>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDetailDialog;
