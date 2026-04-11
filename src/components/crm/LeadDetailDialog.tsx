import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Lead } from '@/hooks/useLeads';
import { useLeadNotes, useAddNote, useCallLogs, useAddCallLog, useLeadActivities, useLeadAttachments, useAddAttachment } from '@/hooks/useLeadDetails';
import LeadStatusBadge from './LeadStatusBadge';
import { format } from 'date-fns';
import { MessageSquare, Phone, Clock, Paperclip, Upload, FileText, PhoneCall, PhoneIncoming, PhoneOutgoing, Brain } from 'lucide-react';
import LeadAIInsights from './LeadAIInsights';
import { toast } from 'sonner';

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

  if (!lead) return null;

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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-xl">{lead.name}</DialogTitle>
            <LeadStatusBadge status={lead.status} />
          </div>
          <DialogDescription>
            {lead.company && <span>{lead.company}</span>}
            {lead.title && <span> · {lead.title}</span>}
            {lead.email && <span> · {lead.email}</span>}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="timeline" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="calls">Calls</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-3 mt-4">
            {activities?.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No activity yet</p>}
            {activities?.map(a => (
              <div key={a.id} className="flex gap-3 items-start">
                <div className="mt-1">{getActivityIcon(a.type)}</div>
                <div className="flex-1">
                  <p className="text-sm">{a.description}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a note..."
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button onClick={handleAddNote} disabled={addNote.isPending || !noteContent.trim()} className="self-end">
                Add
              </Button>
            </div>
            {notes?.map(n => (
              <div key={n.id} className="p-3 rounded-lg bg-muted">
                <p className="text-sm">{n.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.created_at), 'MMM d, yyyy h:mm a')}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="calls" className="space-y-4 mt-4">
            <form onSubmit={handleAddCall} className="space-y-3 p-4 rounded-lg border">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Direction</Label>
                  <Select value={callForm.direction} onValueChange={v => setCallForm(f => ({ ...f, direction: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outbound">Outbound</SelectItem>
                      <SelectItem value="inbound">Inbound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Duration (min)</Label>
                  <Input type="number" value={callForm.duration_minutes} onChange={e => setCallForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Outcome</Label>
                <Input value={callForm.outcome} onChange={e => setCallForm(f => ({ ...f, outcome: e.target.value }))} placeholder="e.g., Interested, Follow up next week" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Notes</Label>
                <Textarea value={callForm.notes} onChange={e => setCallForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
              <Button type="submit" size="sm" disabled={addCallLog.isPending}>Log Call</Button>
            </form>
            {callLogs?.map(c => (
              <div key={c.id} className="flex gap-3 items-start p-3 rounded-lg bg-muted">
                {c.direction === 'inbound' ? <PhoneIncoming className="w-4 h-4 text-green-500 mt-0.5" /> : <PhoneOutgoing className="w-4 h-4 text-blue-500 mt-0.5" />}
                <div>
                  <p className="text-sm font-medium">{c.direction === 'inbound' ? 'Inbound' : 'Outbound'} · {c.duration_minutes} min</p>
                  {c.outcome && <p className="text-sm">{c.outcome}</p>}
                  {c.notes && <p className="text-xs text-muted-foreground">{c.notes}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(c.called_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="files" className="space-y-4 mt-4">
            <input type="file" ref={fileRef} className="hidden" onChange={handleFileUpload} />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={addAttachment.isPending}>
              <Upload className="w-4 h-4 mr-2" /> Upload File
            </Button>
            {attachments?.map(a => (
              <a key={a.id} href={a.file_url} target="_blank" rel="noopener" className="flex items-center gap-3 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{a.file_name}</p>
                  <p className="text-xs text-muted-foreground">{a.file_size ? `${(a.file_size / 1024).toFixed(1)} KB` : ''} · {format(new Date(a.created_at), 'MMM d, yyyy')}</p>
                </div>
              </a>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDetailDialog;
