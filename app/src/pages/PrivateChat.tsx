import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
// Card components not used in this page
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
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
import { getPrivateMessages, getUserProfile, db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { socketService } from '@/services/socket';
import type { PrivateMessage, User } from '@/types';
import { ArrowLeft, Send, Trash2, MoreVertical, Phone, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toDate } from '@/lib/toDate';
import { format } from 'date-fns';

const PrivateChat: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (chatId && userProfile) {
      fetchChatData();
      setupSocketListeners();

      return () => {
        socketService.leavePrivateChat(chatId);
        socketService.offPrivateMessage();
        socketService.offPrivateMessageDeleted();
      };
    }
  }, [chatId, userProfile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatData = async () => {
    if (!chatId || !userProfile) return;

    try {
      // Fetch the chat document to get participants
      const chatDoc = await getDoc(doc(db, 'privateChats', chatId));
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        const participants: string[] = chatData.participants || [];
        const recipientId = participants.find((id: string) => id !== userProfile.uid);
        if (recipientId) {
          setOtherUserId(recipientId);
          const userData = await getUserProfile(recipientId);
          setOtherUser(userData);
        }
      }

      // Fetch messages
      const messagesData = await getPrivateMessages(chatId);
      setMessages(messagesData);

      // Join socket room
      socketService.joinPrivateChat(chatId, (success, error) => {
        if (!success) {
          console.error('Failed to join private chat:', error);
        }
      });
    } catch (error) {
      console.error('Error fetching chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    if (!chatId) return;

    // Listen for new messages
    socketService.onPrivateMessage((data) => {
      if (data.chatId === chatId) {
        setMessages((prev) => [...prev, data.message]);

        // If we don't have other user info yet, try to get it
        if (!otherUser && data.message.senderId !== userProfile?.uid) {
          getUserProfile(data.message.senderId).then((userData) => {
            setOtherUser(userData);
          });
        }
      }
    });

    // Listen for message deletions
    socketService.onPrivateMessageDeleted((data) => {
      if (data.chatId === chatId) {
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
    const recipientId = otherUserId || otherUser?.uid;
    if (!newMessage.trim() || !chatId || !recipientId) return;

    socketService.sendPrivateMessage(
      chatId,
      recipientId,
      newMessage,
      (success) => {
        if (success) {
          setNewMessage('');
        }
      }
    );
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!messageToDelete || !chatId) return;

    socketService.deleteRoomMessage(chatId, messageToDelete, (success) => {
      if (success) {
        setDeleteDialogOpen(false);
        setMessageToDelete(null);
      }
    });
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/messages')}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {otherUser ? (
            <>
              <Avatar className="w-10 h-10">
                <AvatarFallback
                  className={cn('text-white', getRoleColor(otherUser.role))}
                >
                  {getInitials(otherUser.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-white">
                    {otherUser.fullName}
                  </h1>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs capitalize',
                      getRoleColor(otherUser.role)
                        .replace('bg-', 'text-')
                        .replace('500', '400')
                    )}
                  >
                    {otherUser.role}
                  </Badge>
                </div>
                <p className="text-sm text-slate-400">{otherUser.department}</p>
              </div>
            </>
          ) : (
            <div>
              <h1 className="text-lg font-semibold text-white">Private Chat</h1>
              <p className="text-sm text-slate-400">Loading...</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-slate-400">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8" />
            </div>
            <p className="text-lg">No messages yet</p>
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.senderId === userProfile?.uid;
            const showDate =
              index === 0 ||
              new Date(toDate(messages[index - 1].createdAt)).toDateString() !==
                new Date(toDate(message.createdAt)).toDateString();

            return (
              <React.Fragment key={message.id}>
                {showDate && (
                  <div className="flex justify-center">
                    <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
                      {format(toDate(message.createdAt), 'MMMM d, yyyy')}
                    </span>
                  </div>
                )}

                <div
                  className={cn('flex gap-3', isOwnMessage && 'flex-row-reverse')}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback
                      className={cn(
                        'text-white text-xs',
                        isOwnMessage
                          ? getRoleColor(userProfile?.role || 'student')
                          : getRoleColor(otherUser?.role || 'student')
                      )}
                    >
                      {getInitials(
                        isOwnMessage
                          ? userProfile?.fullName || 'U'
                          : otherUser?.fullName || 'U'
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className={cn('max-w-[70%]', isOwnMessage && 'items-end')}>
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

                      <div
                        className={cn(
                          'flex items-center gap-2 mt-1',
                          isOwnMessage ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <span className="text-xs opacity-70">
                          {format(toDate(message.createdAt), 'h:mm a')}
                        </span>
                      </div>

                      {!message.deleted && isOwnMessage && (
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="absolute -top-2 right-0 hidden group-hover:flex p-1 bg-slate-800 rounded-full hover:bg-slate-700"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700 bg-slate-800">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
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

export default PrivateChat;
