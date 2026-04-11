import { useState } from 'react';
import { useUserInvitations, useInviteUser, useDeleteInvitation, useAllProfiles } from '@/hooks/useUserManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, UserPlus, Mail, Phone, Trash2, Users, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

const UserManagement = () => {
  const { data: invitations = [] } = useUserInvitations();
  const { data: profiles = [] } = useAllProfiles();
  const inviteUser = useInviteUser();
  const deleteInvitation = useDeleteInvitation();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inviteUser.mutateAsync({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      });
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setInviteOpen(false);
      toast.success('User invited successfully!');
    } catch (err: any) {
      toast.error('Failed to invite user: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDelete = async (id: string) => {
    await deleteInvitation.mutateAsync(id);
    toast.success('Invitation removed');
  };

  const pendingInvitations = invitations.filter((i: any) => i.status === 'pending');
  const acceptedInvitations = invitations.filter((i: any) => i.status === 'accepted');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Invite User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profiles.length}</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingInvitations.length}</p>
                <p className="text-sm text-muted-foreground">Pending Invitations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{acceptedInvitations.length}</p>
                <p className="text-sm text-muted-foreground">Accepted Invitations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invitations" className="w-full">
        <TabsList>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="users">Active Users</TabsTrigger>
        </TabsList>

        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              {invitations.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No invitations yet. Click "Invite User" to get started.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invited</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">
                          {inv.first_name} {inv.last_name}
                        </TableCell>
                        <TableCell>{inv.email}</TableCell>
                        <TableCell>{inv.phone || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={inv.status === 'accepted' ? 'default' : 'secondary'}>
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(inv.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(inv.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Registered Users</CardTitle>
            </CardHeader>
            <CardContent>
              {profiles.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No users registered yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((profile: any) => (
                      <TableRow key={profile.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={profile.avatar_url} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {(profile.first_name?.[0] || profile.full_name?.[0] || '?').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{profile.first_name || '—'}</TableCell>
                        <TableCell>{profile.last_name || '—'}</TableCell>
                        <TableCell>{profile.phone || '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite User Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>Invite a new user to LeadFlow. They'll be able to sign up using the email you provide.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" required />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" required />
            </div>
            <div className="space-y-1.5">
              <Label>Phone (optional)</Label>
              <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={inviteUser.isPending}>
                <UserPlus className="w-4 h-4 mr-2" /> Send Invitation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
