import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { getRooms, getAnnouncements, getUserChats } from '@/services/firebase';
import type { Room, Announcement, PrivateChat } from '@/types';
import {
  Users,
  Bell,
  Hash,
  ArrowRight,
  BookOpen,
  Building2,
  GraduationCap,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Home: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [chats, setChats] = useState<PrivateChat[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsData, announcementsData, chatsData] = await Promise.all([
          getRooms(),
          getAnnouncements(userProfile?.role),
          userProfile ? getUserChats(userProfile.uid) : Promise.resolve([]),
        ]);

        setRooms(roomsData.slice(0, 5));
        setAnnouncements(announcementsData.slice(0, 3));
        setChats(chatsData.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'course':
        return BookOpen;
      case 'department':
        return Building2;
      case 'faculty':
        return GraduationCap;
      default:
        return Hash;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'course':
        return 'bg-blue-500/20 text-blue-400';
      case 'department':
        return 'bg-purple-500/20 text-purple-400';
      case 'faculty':
        return 'bg-amber-500/20 text-amber-400';
      default:
        return 'bg-emerald-500/20 text-emerald-400';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {userProfile?.fullName.split(' ')[0]}!
          </h1>
          <p className="text-slate-400 mt-1">
            Here's what's happening on your campus today
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn('capitalize px-3 py-1', getRoleBadgeColor(userProfile?.role || ''))}
        >
          {userProfile?.role}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <Hash className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{rooms.length}+</p>
                <p className="text-sm text-slate-400">Active Rooms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{chats.length}</p>
                <p className="text-sm text-slate-400">Conversations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{announcements.length}</p>
                <p className="text-sm text-slate-400">Announcements</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{userProfile?.department}</p>
                <p className="text-sm text-slate-400">Your Department</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Rooms */}
        <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Active Rooms</CardTitle>
              <CardDescription className="text-slate-400">
                Join conversations happening now
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/rooms')}
              className="text-indigo-400 hover:text-indigo-300"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rooms.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No active rooms found</p>
              ) : (
                rooms.map((room) => {
                  const Icon = getCategoryIcon(room.category);
                  return (
                    <div
                      key={room.id}
                      onClick={() => navigate(`/rooms/${room.id}`)}
                      className="flex items-center gap-4 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 cursor-pointer transition-colors"
                    >
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', getCategoryColor(room.category))}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">{room.name}</h3>
                        <p className="text-sm text-slate-400 truncate">{room.description}</p>
                      </div>
                      <Badge variant="outline" className={cn('capitalize', getCategoryColor(room.category))}>
                        {room.category}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Announcements</CardTitle>
              <CardDescription className="text-slate-400">
                Latest campus updates
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/announcements')}
              className="text-indigo-400 hover:text-indigo-300"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No announcements yet</p>
              ) : (
                announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    onClick={() => navigate('/announcements')}
                    className="p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      {announcement.pinned && (
                        <Bell className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white text-sm truncate">
                          {announcement.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {announcement.content}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          By {announcement.createdByName}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      {chats.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Recent Conversations</CardTitle>
              <CardDescription className="text-slate-400">
                Your latest private messages
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/messages')}
              className="text-indigo-400 hover:text-indigo-300"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => navigate(`/messages/${chat.id}`)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {chat.otherUser?.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">
                      {chat.otherUser?.fullName}
                    </h3>
                    <p className="text-sm text-slate-400 truncate">{chat.lastMessage}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Home;
