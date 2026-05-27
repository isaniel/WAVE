import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
// Card components not used in this page
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { getRoomById, getRoomMessages, leaveRoom, isRoomMember } from '@/services/firebase';
import { socketService } from '@/services/socket';
import type { Room, RoomMessage } from '@/types';
import {
  ArrowLeft,
  MoreVertical,
  Send,
  Users,
  LogOut,
  Edit2,
  Trash2,
  Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toDate } from '@/lib/toDate';
import { format } from 'date-fns';

const RoomChat: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [editingMessage, setEditingMessage] = useState<RoomMessage | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (roomId && userProfile) {
      fetchRoomData();
      setupSocketListeners();

      return () => {
        socketService.leaveRoom(roomId);
        socketService.offRoomMessage();
        socketService.offUserTyping();
        socketService.offMessageEdited();
        socketService.offMessageDeleted();
      };
    }
  }, [roomId, userProfile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchRoomData = async () => {
    if (!roomId || !userProfile) return;

    try {
      const [roomData, memberStatus] = await Promise.all([
        getRoomById(roomId),
        isRoomMember(roomId, userProfile.uid),
      ]);

      if (roomData) {
        setRoom(roomData);
        setIsMember(memberStatus);

        // Fetch message history
        const { messages: messageHistory } = await getRoomMessages(roomId, 50);
        setMessages(messageHistory);

        // Join socket room
        socketService.joinRoom(roomId, (success, error) => {
          if (!success) {
            console.error('Failed to join room:', error);
          }
        });
      } else {
        navigate('/rooms');
      }
    } catch (error) {
      console.error('Error fetching room data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    if (!roomId) return;

    // Listen for new messages
    socketService.onRoomMessage((data) => {
      if (data.roomId === roomId) {
        setMessages((prev) => [...prev, data.message]);
      }
    });

    // Listen for typing indicators
    socketService.onUserTyping((data) => {
      if (data.roomId === roomId) {
        if (data.isTyping) {
          setTypingUsers((prev) =>
            prev.includes(data.user.fullName) ? prev : [...prev, data.user.fullName]
          );
        } else {
          setTypingUsers((prev) => prev.filter((name) => name !== data.user.fullName));
        }
      }
    });

    // Listen for message edits
    socketService.onMessageEdited((data) => {
      if (data.roomId === roomId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.messageId ? { ...msg, text: data.text, edited: true } : msg
          )
        );
      }
    });

    // Listen for message deletions
    socketService.onMessageDeleted((data) => {
      if (data.roomId === roomId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.messageId
              ? { ...msg, text: '[deleted]', deleted: true }
              : msg
          )
        );
      }
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !roomId) return;

    if (editingMessage) {
      socketService.editRoomMessage(roomId, editingMessage.id, newMessage, (success) => {
        if (success) {
          setEditingMessage(null);
          setNewMessage('');
        }
      });
    } else {
      socketService.sendRoomMessage(roomId, newMessage, (success) => {
        if (success) {
          setNewMessage('');
        }
      });
    }
  };

  const handleTyping = () => {
    if (!roomId) return;

    socketService.startTyping(roomId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(roomId);
    }, 2000);
  };

  const handleEditMessage = (message: RoomMessage) => {
    if (message.senderId !== userProfile?.uid && userProfile?.role !== 'admin') return;

    setEditingMessage(message);
    setNewMessage(message.text);
    inputRef.current?.focus();
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!messageToDelete || !roomId) return;

    socketService.deleteRoomMessage(roomId, messageToDelete, (success) => {
      if (success) {
        setDeleteDialogOpen(false);
        setMessageToDelete(null);
      }
    });
  };

  const handleLeaveRoom = async () => {
    if (!roomId || !userProfile) return;

    try {
      await leaveRoom(roomId, userProfile.uid);
      navigate('/rooms');
    } catch (error) {
      console.error('Error leaving room:', error);
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

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Hash className="w-16 h-16 text-slate-600 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Room not found</h2>
        <Button onClick={() => navigate('/rooms')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Rooms
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/rooms')}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-white">{room.name}</h1>
              <Badge variant="outline" className="capitalize text-xs">
                {room.category}
              </Badge>
            </div>
            <p className="text-sm text-slate-400">{room.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-slate-400">
            <Users className="w-4 h-4 mr-2" />
            Members
          </Button>

          {isMember && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-400">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                <DropdownMenuItem
                  onClick={handleLeaveRoom}
                  className="text-red-400 focus:bg-slate-700 focus:text-red-400 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave Room
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Hash className="w-16 h-16 mb-4" />
            <p className="text-lg">No messages yet</p>
            <p className="text-sm">Be the first to send a message!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.senderId === userProfile?.uid;
            const showAvatar =
              index === 0 || messages[index - 1].senderId !== message.senderId;

            return (
              <div
                key={message.id}
                className={cn('flex gap-3', isOwnMessage && 'flex-row-reverse')}
              >
                {showAvatar ? (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback
                      className={cn('text-white text-xs', getRoleColor(message.senderRole))}
                    >
                      {getInitials(message.senderName)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8 flex-shrink-0" />
                )}

                <div className={cn('max-w-[70%]', isOwnMessage && 'items-end')}>
                  {showAvatar && (
                    <div
                      className={cn(
                        'flex items-center gap-2 mb-1',
                        isOwnMessage && 'flex-row-reverse'
                      )}
                    >
                      <span className="text-sm font-medium text-slate-300">
                        {message.senderName}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs capitalize',
                          getRoleColor(message.senderRole).replace('bg-', 'text-').replace('500', '400')
                        )}
                      >
                        {message.senderRole}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {format(toDate(message.createdAt), 'h:mm a')}
                      </span>
                      {message.edited && (
                        <span className="text-xs text-slate-500">(edited)</span>
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      'group relative px-4 py-2 rounded-2xl',
                      isOwnMessage
                        ? 'bg-indigo-600 text-white rounded-br-md'
                        : 'bg-slate-700 text-slate-200 rounded-bl-md',
                      message.deleted && 'italic opacity-50'
                    )}
                  >
                    <p>{message.text}</p>

                    {!message.deleted && isOwnMessage && (
                      <div className="absolute -top-2 right-0 hidden group-hover:flex gap-1">
                        <button
                          onClick={() => handleEditMessage(message)}
                          className="p-1 bg-slate-800 rounded-full hover:bg-slate-700"
                        >
                          <Edit2 className="w-3 h-3 text-slate-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="p-1 bg-slate-800 rounded-full hover:bg-slate-700"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    )}

                    {!message.deleted &&
                      userProfile?.role === 'admin' &&
                      message.senderId !== userProfile?.uid && (
                        <div className="absolute -top-2 right-0 hidden group-hover:flex gap-1">
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="p-1 bg-slate-800 rounded-full hover:bg-slate-700"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <div className="flex gap-1">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce delay-100">.</span>
              <span className="animate-bounce delay-200">.</span>
            </div>
            <span>{typingUsers.join(', ')} typing</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700 bg-slate-800">
        {editingMessage && (
          <div className="flex items-center justify-between mb-2 px-2">
            <span className="text-sm text-slate-400">Editing message</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingMessage(null);
                setNewMessage('');
              }}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this message? This action cannot be undone.
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

export default RoomChat;
