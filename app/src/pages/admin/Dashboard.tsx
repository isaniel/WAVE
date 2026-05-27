import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { getStatistics, getAllUsers, getRooms } from '@/services/firebase';
import type { User, Room } from '@/types';
import {
  Users,
  MessageSquare,
  Hash,
  Bell,
  ArrowRight,
  Shield,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRooms: 0,
    totalMessages: 0,
    totalAnnouncements: 0,
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentRooms, setRecentRooms] = useState<Room[]>([]);

  useEffect(() => {
    if (userProfile?.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchDashboardData();
  }, [userProfile]);

  const fetchDashboardData = async () => {
    try {
      const [statsData, usersData, roomsData] = await Promise.all([
        getStatistics(),
        getAllUsers(),
        getRooms(),
      ]);

      setStats(statsData);
      setRecentUsers(usersData.slice(0, 5));
      setRecentRooms(roomsData.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Manage users, rooms, and monitor campus activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Users</p>
                <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Rooms</p>
                <p className="text-3xl font-bold text-white">{stats.totalRooms}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Hash className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Messages</p>
                <p className="text-3xl font-bold text-white">{stats.totalMessages}</p>
              </div>
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Announcements</p>
                <p className="text-3xl font-bold text-white">{stats.totalAnnouncements}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="bg-slate-800 border-slate-700 hover:border-indigo-500/50 cursor-pointer transition-colors"
          onClick={() => navigate('/admin/users')}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="font-medium text-white">Manage Users</p>
                <p className="text-sm text-slate-400">View and edit user accounts</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500" />
          </CardContent>
        </Card>

        <Card
          className="bg-slate-800 border-slate-700 hover:border-emerald-500/50 cursor-pointer transition-colors"
          onClick={() => navigate('/admin/rooms')}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Hash className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-white">Manage Rooms</p>
                <p className="text-sm text-slate-400">Create and manage chat rooms</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500" />
          </CardContent>
        </Card>

        <Card
          className="bg-slate-800 border-slate-700 hover:border-amber-500/50 cursor-pointer transition-colors"
          onClick={() => navigate('/announcements')}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-white">Announcements</p>
                <p className="text-sm text-slate-400">Manage campus announcements</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Recent Users</CardTitle>
              <CardDescription className="text-slate-400">
                Latest registered users
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/users')}
              className="text-indigo-400 hover:text-indigo-300"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No users found</p>
              ) : (
                recentUsers.map((user) => {
                  const Icon = getRoleIcon(user.role);
                  return (
                    <div
                      key={user.uid}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50"
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          getRoleBadgeColor(user.role)
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">
                          {user.fullName}
                        </h3>
                        <p className="text-sm text-slate-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn('capitalize', getRoleBadgeColor(user.role))}
                      >
                        {user.role}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Rooms */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Recent Rooms</CardTitle>
              <CardDescription className="text-slate-400">
                Latest created chat rooms
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/rooms')}
              className="text-indigo-400 hover:text-indigo-300"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRooms.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No rooms found</p>
              ) : (
                recentRooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50"
                  >
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                      <Hash className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">
                        {room.name}
                      </h3>
                      <p className="text-sm text-slate-400 truncate">
                        by {room.createdByName}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {room.category}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
