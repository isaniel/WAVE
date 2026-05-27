import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getUserChats, searchUsers, getOrCreatePrivateChat } from '@/services/firebase';
import type { PrivateChat, User } from '@/types';
import { MessageSquare, Plus, Search, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const Messages: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<PrivateChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);

  useEffect(() => {
    fetchChats();
  }, [userProfile]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const fetchChats = async () => {
    if (!userProfile) return;

    try {
      const chatsData = await getUserChats(userProfile.uid);
      setChats(chatsData);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      // Filter out current user
      setSearchResults(results.filter((u) => u.uid !== userProfile?.uid));
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const startNewChat = async (otherUser: User) => {
    if (!userProfile) return;

    try {
      const chatId = await getOrCreatePrivateChat(userProfile.uid, otherUser.uid);
      setNewChatDialogOpen(false);
      setSearchQuery('');
      navigate(`/messages/${chatId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
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
          <h1 className="text-2xl font-bold text-white">Private Messages</h1>
          <p className="text-slate-400 mt-1">
            Chat privately with other campus members
          </p>
        </div>

        <Dialog open={newChatDialogOpen} onOpenChange={setNewChatDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Start New Conversation</DialogTitle>
              <DialogDescription className="text-slate-400">
                Search for a user to start messaging
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searching ? (
                  <div className="flex justify-center py-4">
                    <Spinner className="w-6 h-6" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <div
                      key={user.uid}
                      onClick={() => startNewChat(user)}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 cursor-pointer transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback
                          className={cn('text-white', getRoleColor(user.role))}
                        >
                          {getInitials(user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">
                          {user.fullName}
                        </h3>
                        <p className="text-sm text-slate-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'text-xs px-2 py-1 rounded-full capitalize',
                          getRoleColor(user.role).replace('bg-', 'bg-').replace('500', '500/20'),
                          getRoleColor(user.role).replace('bg-', 'text-').replace('500', '400')
                        )}
                      >
                        {user.role}
                      </span>
                    </div>
                  ))
                ) : searchQuery ? (
                  <p className="text-center text-slate-500 py-4">
                    No users found
                  </p>
                ) : (
                  <p className="text-center text-slate-500 py-4">
                    Type to search for users
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Conversations List */}
      <div className="grid grid-cols-1 gap-3">
        {chats.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No conversations yet
              </h3>
              <p className="text-slate-400 text-center max-w-md mb-4">
                Start a new conversation with other students, lecturers, or staff members
              </p>
              <Button
                onClick={() => setNewChatDialogOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Start New Chat
              </Button>
            </CardContent>
          </Card>
        ) : (
          chats.map((chat) => (
            <Card
              key={chat.id}
              className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
              onClick={() => navigate(`/messages/${chat.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback
                      className={cn(
                        'text-white',
                        getRoleColor(chat.otherUser?.role || 'student')
                      )}
                    >
                      {getInitials(chat.otherUser?.fullName || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white truncate">
                        {chat.otherUser?.fullName}
                      </h3>
                      {chat.lastMessageAt && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(chat.lastMessageAt.toDate(), 'MMM d, h:mm a')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 truncate mt-1">
                      {chat.lastMessage || 'No messages yet'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full capitalize',
                          getRoleColor(chat.otherUser?.role || 'student')
                            .replace('bg-', 'bg-')
                            .replace('500', '500/20'),
                          getRoleColor(chat.otherUser?.role || 'student')
                            .replace('bg-', 'text-')
                            .replace('500', '400')
                        )}
                      >
                        {chat.otherUser?.role}
                      </span>
                      <span className="text-xs text-slate-500">
                        {chat.otherUser?.department}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Messages;
