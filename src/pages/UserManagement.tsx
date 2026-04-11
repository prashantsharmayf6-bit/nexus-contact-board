import { useState } from 'react';
import { useUserInvitations, useInviteUser, useDeleteInvitation, useAllProfiles, useIsAdmin, useDeleteUser, useAllUserRoles, useManageRole } from '@/hooks/useUserManagement';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, UserPlus, Mail, Phone, Trash2, Users, UserCheck, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const UserManagement = () => {
  const { user } = useAuth();
  const { data: invitations = [] } = useUserInvitations();
  const { data: profiles = [] } = useAllProfiles();
  const { data: isAdmin = false } = useIsAdmin();
  const inviteUser = useInviteUser();
  const deleteInvitation = useDeleteInvitation();
  const deleteUser = useDeleteUser();
  const { data: allRoles = [] } = useAllUserRoles();
  const manageRole = useManageRole();

  const getUserRole = (userId: string) => {
    const role = allRoles.find((r: any) => r.user_id === userId);
    return role?.role || 'user';
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await manageRole.mutateAsync({ user_id: userId, role: newRole, action: 'set' });
      toast.success(`Role updated to ${newRole}`);
    } catch (err: any) {
      toast.error('Failed to update role: ' + (err.message || 'Unknown error'));
    }
  };

  const [inviteOpen, setInviteOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await inviteUser.mutateAsync({
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
      if (result?.email_sent) {
        toast.success('Invitation sent! The user will receive an email to set up their account.');
      } else {
        toast.success('Invitation created, but email could not be sent. The user can still sign up manually.');
      }
    } catch (err: any) {
      toast.error('Failed to invite user: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) return;
    try {
      await deleteUser.mutateAsync(userId);
      toast.success(`User "${name}" has been deleted.`);
    } catch (err: any) {
      toast.error('Failed to delete user: ' + (err.message || 'Unknown error'));
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
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          {isAdmin && (
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Admin Access
            </p>
          )}
        </div>
        {isAdmin && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" /> Invite User
          </Button>
        )}
      </div>

      {!isAdmin && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4 text-center text-amber-700 text-sm">
            Only administrators can invite new users. Contact your admin to get access.
          </CardContent>
        </Card>
      )}

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
                  <p>No invitations yet. {isAdmin ? 'Click "Invite User" to get started.' : 'Ask an admin to invite users.'}</p>
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
                      {isAdmin && <TableHead className="w-12"></TableHead>}
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
                        {isAdmin && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(inv.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
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
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      {isAdmin && <TableHead className="w-12"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((profile: any) => {
                      const currentRole = getUserRole(profile.user_id);
                      const isSelf = profile.user_id === user?.id;
                      return (
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
                          <TableCell>
                            {isAdmin && !isSelf ? (
                              <Select
                                value={currentRole}
                                onValueChange={(val) => handleRoleChange(profile.user_id, val)}
                                disabled={manageRole.isPending}
                              >
                                <SelectTrigger className="w-28 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="user">User</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant={currentRole === 'admin' ? 'default' : 'secondary'} className="text-xs">
                                {currentRole === 'admin' ? '🛡️ Admin' : 'User'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(profile.created_at).toLocaleDateString()}
                          </TableCell>
                          {isAdmin && (
                            <TableCell>
                              {!isSelf && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteUser(profile.user_id, profile.full_name || profile.first_name || 'Unknown')}
                                  disabled={deleteUser.isPending}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
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
            <DialogDescription>Invite a new user to EzyCRM. They'll receive an email invitation to set up their account.</DialogDescription>
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
              <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={inviteUser.isPending}>
                <Mail className="w-4 h-4 mr-2" /> Send Invitation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
