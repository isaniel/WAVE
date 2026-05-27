import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { updateUserProfile } from '@/services/firebase';
import { User, Mail, Building2, GraduationCap, Briefcase, Shield, Edit2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEPARTMENTS = [
  'Computer Science',
  'Software Engineering',
  'Information Technology',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Business Administration',
  'Economics',
  'Law',
  'Medicine',
  'Pharmacy',
];

const Profile: React.FC = () => {
  const { userProfile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    department: '',
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        fullName: userProfile.fullName,
        department: userProfile.department,
      });
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!userProfile) return;

    setSaving(true);
    try {
      await updateUserProfile(userProfile.uid, {
        fullName: formData.fullName,
        department: formData.department,
      });

      await refreshProfile();
      setEditing(false);

      toast.success('Profile Updated', {
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error', {
        description: 'Failed to update profile. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (userProfile) {
      setFormData({
        fullName: userProfile.fullName,
        department: userProfile.department,
      });
    }
    setEditing(false);
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

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-slate-400 mt-1">
          Manage your account information
        </p>
      </div>

      {/* Profile Card */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarFallback
                className={cn('text-white text-2xl', getRoleColor(userProfile.role))}
              >
                {getInitials(userProfile.fullName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">
                  {userProfile.fullName}
                </h2>
                <Badge
                  variant="outline"
                  className={cn('capitalize', getRoleBadgeColor(userProfile.role))}
                >
                  {userProfile.role}
                </Badge>
              </div>
              <p className="text-slate-400">{userProfile.email}</p>
            </div>

            {!editing && (
              <Button
                onClick={() => setEditing(true)}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </Label>
                {editing ? (
                  <Input
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                ) : (
                  <p className="text-white">{userProfile.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-400 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <p className="text-white">{userProfile.email}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-400 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Role
                </Label>
                <p className="text-white capitalize">{userProfile.role}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Department
                </Label>
                {editing ? (
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-white">{userProfile.department}</p>
                )}
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="pt-4 border-t border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              Academic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userProfile.matricNumber && (
                <div className="space-y-2">
                  <Label className="text-slate-400 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Matric Number
                  </Label>
                  <p className="text-white">{userProfile.matricNumber}</p>
                </div>
              )}

              {userProfile.staffId && (
                <div className="space-y-2">
                  <Label className="text-slate-400 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Staff ID
                  </Label>
                  <p className="text-white">{userProfile.staffId}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-slate-400 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Account Status
                </Label>
                <Badge
                  variant="outline"
                  className={
                    userProfile.isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }
                >
                  {userProfile.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Edit Actions */}
          {editing && (
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {saving ? (
                  <Spinner className="w-4 h-4 mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Info Card */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Account Information</CardTitle>
          <CardDescription className="text-slate-400">
            Details about your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-400">Account Created</Label>
              <p className="text-white">
                {userProfile.createdAt
                  ? new Date(userProfile.createdAt.toDate()).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-slate-400">Last Updated</Label>
              <p className="text-white">
                {userProfile.updatedAt
                  ? new Date(userProfile.updatedAt.toDate()).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
