import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getAllUsers, updateUserProfile } from '@/services/firebase';
import type { User, UserRole } from '@/types';
import {
  Search,
  Shield,
  UserCheck,
  Users,
  ArrowLeft,
  Edit2,
  Ban,
  CheckCircle,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'lecturer', label: 'Lecturer' },
  { value: 'admin', label: 'Admin' },
];

const AdminUsers: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'activate' | 'deactivate' | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userProfile?.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchUsers();
  }, [userProfile]);

  useEffect(() => {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.department.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, roleFilter]);

  const fetchUsers = async () => {
    try {
      const usersData = await getAllUsers();
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    setSaving(true);
    try {
      await updateUserProfile(editingUser.uid, {
        role: editingUser.role,
        isActive: editingUser.isActive,
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAction = (user: User, action: 'activate' | 'deactivate') => {
    setSelectedUser(user);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedUser || !actionType) return;

    try {
      await updateUserProfile(selectedUser.uid, {
        isActive: actionType === 'activate',
      });

      setActionDialogOpen(false);
      setSelectedUser(null);
      setActionType(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500';
      case 'lecturer':
        return 'bg-amber-500';
      default:
        return 'bg-emerald-500';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'lecturer':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return Shield;
      case 'lecturer':
        return UserCheck;
      default:
        return Users;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin')}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Manage Users</h1>
            <p className="text-slate-400 mt-1">
              View and manage user accounts
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Roles</SelectItem>
              {ROLES.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 text-slate-400 font-medium">User</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Department</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Role</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Status</th>
                  <th className="text-right p-4 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const Icon = getRoleIcon(user.role);
                    return (
                      <tr key={user.uid} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback
                                className={cn('text-white', getRoleColor(user.role))}
                              >
                                {getInitials(user.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-white">{user.fullName}</p>
                              <p className="text-sm text-slate-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-slate-300">{user.department}</p>
                          {user.matricNumber && (
                            <p className="text-xs text-slate-500">
                              Matric: {user.matricNumber}
                            </p>
                          )}
                          {user.staffId && (
                            <p className="text-xs text-slate-500">
                              Staff: {user.staffId}
                            </p>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge
                            variant="outline"
                            className={cn('capitalize', getRoleBadgeColor(user.role))}
                          >
                            <Icon className="w-3 h-3 mr-1" />
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant="outline"
                            className={
                              user.isActive
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }
                          >
                            {user.isActive ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <Ban className="w-3 h-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingUser(user)}
                              className="text-slate-400 hover:text-white"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            {user.isActive ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAction(user, 'deactivate')}
                                className="text-slate-400 hover:text-red-400"
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAction(user, 'activate')}
                                className="text-slate-400 hover:text-emerald-400"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update user role and permissions
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback
                    className={cn('text-white', getRoleColor(editingUser.role))}
                  >
                    {getInitials(editingUser.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-white">{editingUser.fullName}</p>
                  <p className="text-sm text-slate-400">{editingUser.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) =>
                    setEditingUser({ ...editingUser, role: value as UserRole })
                  }
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Account Status</Label>
                <Select
                  value={editingUser.isActive ? 'active' : 'inactive'}
                  onValueChange={(value) =>
                    setEditingUser({
                      ...editingUser,
                      isActive: value === 'active',
                    })
                  }
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? <Spinner className="w-4 h-4" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'activate' ? 'Activate User' : 'Deactivate User'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to {actionType}{' '}
              <span className="text-white font-medium">{selectedUser?.fullName}</span>?
              {actionType === 'deactivate' &&
                ' They will no longer be able to access the platform.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={
                actionType === 'activate'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }
            >
              {actionType === 'activate' ? 'Activate' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

import { Label } from '@/components/ui/label';
export default AdminUsers;
