import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getRooms, createRoom, isRoomMember } from '@/services/firebase';
import type { Room, RoomCategory } from '@/types';
import {
  Hash,
  Plus,
  Search,
  BookOpen,
  Building2,
  GraduationCap,
  Users,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES: { value: RoomCategory; label: string; icon: React.ElementType }[] = [
  { value: 'course', label: 'Course', icon: BookOpen },
  { value: 'department', label: 'Department', icon: Building2 },
  { value: 'faculty', label: 'Faculty', icon: GraduationCap },
  { value: 'social', label: 'Social', icon: Users },
  { value: 'announcements', label: 'Announcements', icon: Hash },
];

const Rooms: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    category: 'course' as RoomCategory,
    visibility: 'public' as 'public' | 'private',
  });

  const selectedCategory = searchParams.get('category') as RoomCategory | null;
  const canCreateRoom = userProfile?.role === 'admin' || userProfile?.role === 'lecturer';

  useEffect(() => {
    fetchRooms();
  }, [selectedCategory]);

  useEffect(() => {
    let filtered = rooms;

    if (searchQuery) {
      filtered = filtered.filter(
        (room) =>
          room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRooms(filtered);
  }, [rooms, searchQuery]);

  const fetchRooms = async () => {
    try {
      const roomsData = await getRooms(selectedCategory || undefined);
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

  const handleRoomClick = async (room: Room) => {
    if (!userProfile) return;

    const isMember = await isRoomMember(room.id, userProfile.uid);

    if (isMember || room.visibility === 'public') {
      navigate(`/rooms/${room.id}`);
    } else {
      // Show join dialog or message
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
        <div>
          <h1 className="text-2xl font-bold text-white">Chat Rooms</h1>
          <p className="text-slate-400 mt-1">
            Browse and join campus conversations
          </p>
        </div>

        {canCreateRoom && (
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
                  Create a new chat room for your course, department, or community.
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
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={!selectedCategory ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSearchParams({})}
          className={cn(
            !selectedCategory
              ? 'bg-indigo-600 hover:bg-indigo-700'
              : 'border-slate-600 text-slate-300 hover:bg-slate-700'
          )}
        >
          All Rooms
        </Button>
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            variant={selectedCategory === cat.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSearchParams({ category: cat.value })}
            className={cn(
              selectedCategory === cat.value
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'border-slate-600 text-slate-300 hover:bg-slate-700'
            )}
          >
            <cat.icon className="w-3 h-3 mr-1" />
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search rooms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Hash className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No rooms found</h3>
            <p className="text-slate-400">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Be the first to create a room!'}
            </p>
          </div>
        ) : (
          filteredRooms.map((room) => {
            const Icon = getCategoryIcon(room.category);
            return (
              <Card
                key={room.id}
                className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer group"
                onClick={() => handleRoomClick(room)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                        getCategoryColor(room.category)
                      )}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate group-hover:text-indigo-400 transition-colors">
                          {room.name}
                        </h3>
                        {room.visibility === 'private' && (
                          <Lock className="w-3 h-3 text-slate-500" />
                        )}
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2 mb-2">
                        {room.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={cn('text-xs capitalize', getCategoryColor(room.category))}
                        >
                          {room.category}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          by {room.createdByName}
                        </span>
                      </div>
                      {room.lastMessage && (
                        <p className="text-xs text-slate-500 mt-2 truncate">
                          Last: {room.lastMessage}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Rooms;
