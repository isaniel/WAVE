import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
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
import { getAnnouncements, createAnnouncement, deleteAnnouncement, updateAnnouncement } from '@/services/firebase';
import type { Announcement } from '@/types';
import { Plus, Pin, Trash2, Edit2, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const TARGET_AUDIENCES = [
  { value: 'all', label: 'Everyone' },
  { value: 'students', label: 'Students Only' },
  { value: 'lecturers', label: 'Lecturers Only' },
  { value: 'admins', label: 'Admins Only' },
];

const Announcements: React.FC = () => {
  const { userProfile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    targetAudience: 'all' as 'all' | 'students' | 'lecturers' | 'admins',
    pinned: false,
  });

  const canManageAnnouncements = userProfile?.role === 'admin';

  useEffect(() => {
    fetchAnnouncements();
  }, [userProfile]);

  const fetchAnnouncements = async () => {
    try {
      const data = await getAnnouncements(userProfile?.role);
      setAnnouncements(data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!userProfile) return;

    setCreating(true);
    try {
      await createAnnouncement(
        {
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          targetAudience: newAnnouncement.targetAudience,
          pinned: newAnnouncement.pinned,
          createdBy: userProfile.uid,
        },
        userProfile.fullName
      );

      setCreateDialogOpen(false);
      setNewAnnouncement({
        title: '',
        content: '',
        targetAudience: 'all',
        pinned: false,
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateAnnouncement = async () => {
    if (!editingAnnouncement) return;

    try {
      await updateAnnouncement(editingAnnouncement.id, {
        title: editingAnnouncement.title,
        content: editingAnnouncement.content,
        targetAudience: editingAnnouncement.targetAudience,
        pinned: editingAnnouncement.pinned,
      });

      setEditingAnnouncement(null);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error updating announcement:', error);
    }
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncementToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!announcementToDelete) return;

    try {
      await deleteAnnouncement(announcementToDelete);
      setDeleteDialogOpen(false);
      setAnnouncementToDelete(null);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const getTargetAudienceLabel = (audience: string) => {
    return TARGET_AUDIENCES.find((a) => a.value === audience)?.label || audience;
  };

  const getTargetAudienceColor = (audience: string) => {
    switch (audience) {
      case 'all':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'students':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'lecturers':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'admins':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
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
        <div>
          <h1 className="text-2xl font-bold text-white">Announcements</h1>
          <p className="text-slate-400 mt-1">
            Official campus updates and notifications
          </p>
        </div>

        {canManageAnnouncements && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Announcement</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Post an official announcement to the campus community
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Announcement title"
                    value={newAnnouncement.title}
                    onChange={(e) =>
                      setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Announcement content..."
                    value={newAnnouncement.content}
                    onChange={(e) =>
                      setNewAnnouncement({ ...newAnnouncement, content: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white min-h-[120px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Select
                      value={newAnnouncement.targetAudience}
                      onValueChange={(value) =>
                        setNewAnnouncement({
                          ...newAnnouncement,
                          targetAudience: value as typeof newAnnouncement.targetAudience,
                        })
                      }
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {TARGET_AUDIENCES.map((audience) => (
                          <SelectItem key={audience.value} value={audience.value}>
                            {audience.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pinned">Pin to Top</Label>
                    <Select
                      value={newAnnouncement.pinned ? 'true' : 'false'}
                      onValueChange={(value) =>
                        setNewAnnouncement({
                          ...newAnnouncement,
                          pinned: value === 'true',
                        })
                      }
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="false">No</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAnnouncement}
                  disabled={!newAnnouncement.title || !newAnnouncement.content || creating}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {creating ? <Spinner className="w-4 h-4" /> : 'Post Announcement'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Megaphone className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No announcements yet
              </h3>
              <p className="text-slate-400 text-center max-w-md">
                Check back later for official campus updates and notifications
              </p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card
              key={announcement.id}
              className={cn(
                'bg-slate-800 border-slate-700',
                announcement.pinned && 'border-amber-500/30'
              )}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {announcement.pinned && (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/20 text-amber-400 border-amber-500/30"
                        >
                          <Pin className="w-3 h-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(getTargetAudienceColor(announcement.targetAudience))}
                      >
                        {getTargetAudienceLabel(announcement.targetAudience)}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl text-white">
                      {announcement.title}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Posted by {announcement.createdByName} on{' '}
                      {format(announcement.createdAt.toDate(), 'MMMM d, yyyy')}
                    </CardDescription>
                  </div>

                  {canManageAnnouncements && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingAnnouncement(announcement)}
                        className="text-slate-400 hover:text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 whitespace-pre-wrap">
                  {announcement.content}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingAnnouncement}
        onOpenChange={() => setEditingAnnouncement(null)}
      >
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
          </DialogHeader>

          {editingAnnouncement && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingAnnouncement.title}
                  onChange={(e) =>
                    setEditingAnnouncement({
                      ...editingAnnouncement,
                      title: e.target.value,
                    })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={editingAnnouncement.content}
                  onChange={(e) =>
                    setEditingAnnouncement({
                      ...editingAnnouncement,
                      content: e.target.value,
                    })
                  }
                  className="bg-slate-700 border-slate-600 text-white min-h-[120px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select
                    value={editingAnnouncement.targetAudience}
                    onValueChange={(value) =>
                      setEditingAnnouncement({
                        ...editingAnnouncement,
                        targetAudience: value as typeof editingAnnouncement.targetAudience,
                      })
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {TARGET_AUDIENCES.map((audience) => (
                        <SelectItem key={audience.value} value={audience.value}>
                          {audience.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Pin to Top</Label>
                  <Select
                    value={editingAnnouncement.pinned ? 'true' : 'false'}
                    onValueChange={(value) =>
                      setEditingAnnouncement({
                        ...editingAnnouncement,
                        pinned: value === 'true',
                      })
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="false">No</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingAnnouncement(null)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAnnouncement}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this announcement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Announcements;
