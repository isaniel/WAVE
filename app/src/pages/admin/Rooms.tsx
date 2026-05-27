import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { getRooms, createRoom, updateRoom, deleteRoom } from '@/services/firebase';
import type { Room, RoomCategory } from '@/types';
import {
  Hash,
  Plus,
  Search,
  ArrowLeft,
  Edit2,
  Trash2,
  Archive,
  ArchiveRestore,
  Globe,
  Lock,
  BookOpen,
  Building2,
  GraduationCap,
  Users,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const CATEGORIES: { value: RoomCategory; label: string; icon: React.ElementType }[] = [
  { value: 'course', label: 'Course', icon: BookOpen },
  { value: 'department', label: 'Department', icon: Building2 },
  { value: 'faculty', label: 'Faculty', icon: GraduationCap },
  { value: 'social', label: 'Social', icon: Users },
  { value: 'announcements', label: 'Announcements', icon: Hash },
];

const AdminRooms: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    category: 'course' as RoomCategory,
    visibility: 'public' as 'public' | 'private',
  });

  useEffect(() => {
    if (userProfile?.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchRooms();
  }, [userProfile, showArchived]);

  useEffect(() => {
    let filtered = rooms;

    if (searchQuery) {
      filtered = filtered.filter(
        (room) =>
          room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((room) => room.category === categoryFilter);
    }

    setFilteredRooms(filtered);
  }, [rooms, searchQuery, categoryFilter]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const roomsData = await getRooms(undefined, showArchived);
      setRooms(roomsData);
      setFilteredRooms(roomsData);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!userProfile) return;

    setCreating(true);
    try {
      await createRoom(
        {
          name: newRoom.name,
          description: newRoom.description,
          category: newRoom.category,
          createdBy: userProfile.uid,
          visibility: newRoom.visibility,
          isArchived: false,
        },
        userProfile.fullName
      );

      setCreateDialogOpen(false);
      setNewRoom({
        name: '',
        description: '',
        category: 'course',
        visibility: 'public',
      });
      fetchRooms();
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateRoom = async () => {
    if (!editingRoom) return;

    try {
      await updateRoom(editingRoom.id, {
        name: editingRoom.name,
        description: editingRoom.description,
        category: editingRoom.category,
        visibility: editingRoom.visibility,
        isArchived: editingRoom.isArchived,
      });

      setEditingRoom(null);
      fetchRooms();
    } catch (error) {
      console.error('Error updating room:', error);
    }
  };

  const handleDeleteRoom = (roomId: string) => {
    setRoomToDelete(roomId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!roomToDelete) return;

    try {
      await deleteRoom(roomToDelete);
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  const handleArchiveRoom = async (room: Room) => {
    try {
      await updateRoom(room.id, { isArchived: !room.isArchived });
      fetchRooms();
    } catch (error) {
      console.error('Error archiving room:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find((c) => c.value === category);
    return cat?.icon || Hash;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'course':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'department':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'faculty':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'social':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
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
            <h1 className="text-2xl font-bold text-white">Manage Rooms</h1>
            <p className="text-slate-400 mt-1">
              Create and manage chat rooms
            </p>
          </div>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Room</DialogTitle>
              <DialogDescription className="text-slate-400">
                Create a new chat room for the campus community
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Room Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., CSC 401 Discussion"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What is this room about?"
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newRoom.category}
                    onValueChange={(value) =>
                      setNewRoom({ ...newRoom, category: value as RoomCategory })
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={newRoom.visibility}
                    onValueChange={(value) =>
                      setNewRoom({ ...newRoom, visibility: value as 'public' | 'private' })
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
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
                onClick={handleCreateRoom}
                disabled={!newRoom.name || !newRoom.description || creating}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {creating ? <Spinner className="w-4 h-4" /> : 'Create Room'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active / Archived Tabs */}
      <div className="flex items-center gap-2">
        <Button
          variant={!showArchived ? 'default' : 'outline'}
          onClick={() => setShowArchived(false)}
          className={!showArchived ? 'bg-indigo-600 hover:bg-indigo-700' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
        >
          Active Rooms
        </Button>
        <Button
          variant={showArchived ? 'default' : 'outline'}
          onClick={() => setShowArchived(true)}
          className={showArchived ? 'bg-amber-600 hover:bg-amber-700' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
        >
          <Archive className="w-4 h-4 mr-2" />
          Archived Rooms
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Hash className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No rooms found</h3>
            <p className="text-slate-400">
              {searchQuery ? 'Try adjusting your search' : 'Create your first room!'}
            </p>
          </div>
        ) : (
          filteredRooms.map((room) => {
            const Icon = getCategoryIcon(room.category);
            return (
              <Card
                key={room.id}
                className={cn(
                  'bg-slate-800 border-slate-700',
                  room.isArchived && 'opacity-60'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        getCategoryColor(room.category)
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingRoom(room)}
                        className="text-slate-400 hover:text-white h-8 w-8"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleArchiveRoom(room)}
                        className={cn(
                          'h-8 w-8',
                          room.isArchived
                            ? 'text-slate-400 hover:text-emerald-400'
                            : 'text-slate-400 hover:text-amber-400'
                        )}
                        title={room.isArchived ? 'Unarchive' : 'Archive'}
                      >
                        {room.isArchived ? (
                          <ArchiveRestore className="w-4 h-4" />
                        ) : (
                          <Archive className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRoom(room.id)}
                        className="text-slate-400 hover:text-red-400 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-white mb-1">{room.name}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                    {room.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn('text-xs capitalize', getCategoryColor(room.category))}
                      >
                        {room.category}
                      </Badge>
                      {room.visibility === 'private' ? (
                        <Lock className="w-3 h-3 text-slate-500" />
                      ) : (
                        <Globe className="w-3 h-3 text-slate-500" />
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {format(room.createdAt.toDate(), 'MMM d, yyyy')}
                    </span>
                  </div>

                  {room.isArchived && (
                    <Badge
                      variant="outline"
                      className="mt-3 bg-slate-700/50 text-slate-400 border-slate-600"
                    >
                      Archived
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Room Dialog */}
      <Dialog open={!!editingRoom} onOpenChange={() => setEditingRoom(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update room details
            </DialogDescription>
          </DialogHeader>

          {editingRoom && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Room Name</Label>
                <Input
                  id="edit-name"
                  value={editingRoom.name}
                  onChange={(e) =>
                    setEditingRoom({ ...editingRoom, name: e.target.value })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingRoom.description}
                  onChange={(e) =>
                    setEditingRoom({ ...editingRoom, description: e.target.value })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={editingRoom.category}
                    onValueChange={(value) =>
                      setEditingRoom({ ...editingRoom, category: value as RoomCategory })
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select
                    value={editingRoom.visibility}
                    onValueChange={(value) =>
                      setEditingRoom({ ...editingRoom, visibility: value as 'public' | 'private' })
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingRoom(null)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRoom}
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
            <AlertDialogTitle>Delete Room</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this room? This action cannot be undone and all messages will be lost.
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

export default AdminRooms;
