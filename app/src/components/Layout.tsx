import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
// Button component not used in this layout
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare,
  Home,
  Users,
  Bell,
  User,
  LogOut,
  Menu,
  Hash,
  BookOpen,
  Building2,
  GraduationCap,
  MessageCircle,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string | undefined) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500';
      case 'lecturer':
        return 'bg-amber-500';
      default:
        return 'bg-emerald-500';
    }
  };

  const mainNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/rooms', icon: Hash, label: 'Rooms' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/announcements', icon: Bell, label: 'Announcements' },
  ];

  const roomCategories = [
    { category: 'course', icon: BookOpen, label: 'Courses' },
    { category: 'department', icon: Building2, label: 'Departments' },
    { category: 'faculty', icon: GraduationCap, label: 'Faculties' },
    { category: 'social', icon: Users, label: 'Social' },
  ];

  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform duration-200 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 border-b border-slate-700">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white">Wave</h1>
                <p className="text-xs text-slate-400">Engine</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Main Nav */}
            <nav className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
                Main
              </p>
              {mainNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    location.pathname === item.path
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Room Categories */}
            <nav className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
                Browse Rooms
              </p>
              {roomCategories.map((item) => (
                <Link
                  key={item.category}
                  to={`/rooms?category=${item.category}`}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    location.search.includes(`category=${item.category}`)
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Admin Section */}
            {isAdmin && (
              <nav className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
                  Administration
                </p>
                <Link
                  to="/admin"
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    location.pathname.startsWith('/admin')
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  )}
                >
                  <Shield className="w-4 h-4" />
                  Admin Dashboard
                </Link>
              </nav>
            )}
          </div>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-700">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700 transition-colors">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className={cn('text-white text-sm', getRoleColor(userProfile?.role))}>
                      {getInitials(userProfile?.fullName || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {userProfile?.fullName}
                    </p>
                    <p className="text-xs text-slate-400 capitalize">{userProfile?.role}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
                <DropdownMenuItem
                  onClick={() => navigate('/profile')}
                  className="text-slate-300 focus:bg-slate-700 focus:text-white cursor-pointer"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-400 focus:bg-slate-700 focus:text-red-400 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-300"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-white">Campus Chat</h1>
          <Avatar className="w-8 h-8">
            <AvatarFallback className={cn('text-white text-xs', getRoleColor(userProfile?.role))}>
              {getInitials(userProfile?.fullName || 'U')}
            </AvatarFallback>
          </Avatar>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
