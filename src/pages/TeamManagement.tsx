import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTeams, useCreateTeam, useTeamMembers, useTeamInvitations, useInviteMember, useMyInvitations, useRespondToInvitation, useRemoveMember } from '@/hooks/useTeams';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, UserPlus, Mail, Check, X, Crown, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const TeamManagement = () => {
  const { user } = useAuth();
  const { data: teams = [] } = useTeams();
  const { data: myInvitations = [] } = useMyInvitations();
  const createTeam = useCreateTeam();
  const inviteMember = useInviteMember();
  const respondToInvitation = useRespondToInvitation();
  const removeMember = useRemoveMember();

  const [createOpen, setCreateOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    await createTeam.mutateAsync(teamName.trim());
    setTeamName('');
    setCreateOpen(false);
    toast.success('Team created!');
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedTeamId) return;
    try {
      await inviteMember.mutateAsync({ teamId: selectedTeamId, email: inviteEmail.trim() });
      setInviteEmail('');
      toast.success('Invitation sent!');
    } catch (err: any) {
      if (err.message?.includes('duplicate')) {
        toast.error('This person has already been invited');
      } else {
        toast.error('Failed to send invitation');
      }
    }
  };

  const handleRespond = async (invitationId: string, teamId: string, accept: boolean) => {
    await respondToInvitation.mutateAsync({ invitationId, teamId, accept });
    toast.success(accept ? 'You joined the team!' : 'Invitation declined');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Team
        </Button>
      </div>

      {/* Pending Invitations */}
      {myInvitations.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" /> Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myInvitations.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-card border">
                <div>
                  <p className="font-medium">{inv.teams?.name || 'Unknown Team'}</p>
                  <p className="text-xs text-muted-foreground">Invited {new Date(inv.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleRespond(inv.id, inv.team_id, true)}>
                    <Check className="w-4 h-4 mr-1" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRespond(inv.id, inv.team_id, false)}>
                    <X className="w-4 h-4 mr-1" /> Decline
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No teams yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Create a team to start collaborating on leads</p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => (
            <Card
              key={team.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTeamId(team.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{team.name}</p>
                    {team.owner_id === user?.id && (
                      <Badge variant="secondary" className="text-xs mt-0.5">
                        <Crown className="w-3 h-3 mr-1" /> Owner
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Team Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
            <DialogDescription>Create a new team to collaborate on leads with others.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div className="space-y-2">
              <Label>Team Name</Label>
              <Input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="e.g., Sales Team" required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createTeam.isPending}>Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Team Detail Dialog */}
      {selectedTeam && (
        <TeamDetailDialog
          team={selectedTeam}
          isOwner={selectedTeam.owner_id === user?.id}
          open={!!selectedTeamId}
          onOpenChange={() => setSelectedTeamId(null)}
          inviteEmail={inviteEmail}
          setInviteEmail={setInviteEmail}
          onInvite={handleInvite}
          inviting={inviteMember.isPending}
          onRemoveMember={(memberId, teamId) => {
            removeMember.mutateAsync({ memberId, teamId });
            toast.success('Member removed');
          }}
        />
      )}
    </div>
  );
};

interface TeamDetailProps {
  team: any;
  isOwner: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteEmail: string;
  setInviteEmail: (v: string) => void;
  onInvite: (e: React.FormEvent) => void;
  inviting: boolean;
  onRemoveMember: (memberId: string, teamId: string) => void;
}

const TeamDetailDialog = ({ team, isOwner, open, onOpenChange, inviteEmail, setInviteEmail, onInvite, inviting, onRemoveMember }: TeamDetailProps) => {
  const { data: members = [] } = useTeamMembers(team.id);
  const { data: invitations = [] } = useTeamInvitations(team.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {team.name}
          </DialogTitle>
          <DialogDescription>Manage team members and invitations</DialogDescription>
        </DialogHeader>

        {/* Invite Form (owner only) */}
        {isOwner && (
          <form onSubmit={onInvite} className="flex gap-2">
            <Input
              type="email"
              placeholder="Email address to invite..."
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="flex-1"
              required
            />
            <Button type="submit" disabled={inviting} size="sm">
              <UserPlus className="w-4 h-4 mr-1" /> Invite
            </Button>
          </form>
        )}

        {/* Members */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Members ({members.length})</h4>
          {members.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={m.profiles?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {(m.profiles?.full_name || '?')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{m.profiles?.full_name || 'Unknown'}</p>
                  <Badge variant="outline" className="text-xs">{m.role}</Badge>
                </div>
              </div>
              {isOwner && m.role !== 'owner' && (
                <Button variant="ghost" size="icon" onClick={() => onRemoveMember(m.id, team.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Pending Invitations */}
        {isOwner && invitations.filter((i: any) => i.status === 'pending').length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Pending Invitations</h4>
            {invitations.filter((i: any) => i.status === 'pending').map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{inv.email}</span>
                </div>
                <Badge variant="secondary" className="text-xs">Pending</Badge>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TeamManagement;
