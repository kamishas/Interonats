import { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Mail, FileText, LayoutDashboard, LogOut, Settings, User, Menu, X } from 'lucide-react';
import { ResumeManagement } from './resume-management';
import { EmailAgent } from './email-agent';
import { cn } from './ui/utils';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<'dashboard' | 'resumes' | 'email'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const navigation = [
    {
      id: 'dashboard' as const,
      name: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview and analytics'
    },
    {
      id: 'resumes' as const,
      name: 'Resume Management',
      icon: FileText,
      description: 'Manage candidate resumes'
    },
    {
      id: 'email' as const,
      name: 'Email Agent',
      icon: Mail,
      description: 'Send and track emails'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                    HR Platform
                  </h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Enterprise Recruitment Suite</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3 hover:bg-blue-50">
                    <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-600 to-indigo-600">
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden sm:block">
                      <p className="text-sm font-medium">{user?.user_metadata?.full_name || 'User'}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-64 bg-white/80 backdrop-blur-md border-r border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            'mt-16 lg:mt-0'
          )}
        >
          <div className="h-full overflow-y-auto py-6 px-4">
            <nav className="space-y-2">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    activeSection === item.id
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  )}
                >
                  <item.icon className={cn(
                    'h-5 w-5 flex-shrink-0 mt-0.5',
                    activeSection === item.id ? 'text-white' : 'text-gray-500'
                  )} />
                  <div className="text-left">
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className={cn(
                      'text-xs mt-0.5',
                      activeSection === item.id ? 'text-blue-100' : 'text-gray-500'
                    )}>
                      {item.description}
                    </p>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Welcome back, {user?.user_metadata?.full_name || 'User'}!
                </h2>
                <p className="text-gray-600 mt-2">
                  Here's an overview of your recruitment activities
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
                  onClick={() => setActiveSection('resumes')}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">24</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Active Resumes</h3>
                  <p className="text-sm text-gray-600">Manage candidate applications</p>
                </div>

                <div
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
                  onClick={() => setActiveSection('email')}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">156</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Emails Sent</h3>
                  <p className="text-sm text-gray-600">Track email campaigns</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">98%</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Compliance Rate</h3>
                  <p className="text-sm text-gray-600">EEOC standards maintained</p>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Button
                    variant="outline"
                    className="justify-start h-auto py-4 hover:bg-blue-50 hover:border-blue-300"
                    onClick={() => setActiveSection('resumes')}
                  >
                    <FileText className="mr-3 h-5 w-5 text-blue-600" />
                    <div className="text-left">
                      <p className="font-semibold">View All Resumes</p>
                      <p className="text-xs text-gray-500">Browse and manage candidates</p>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start h-auto py-4 hover:bg-indigo-50 hover:border-indigo-300"
                    onClick={() => setActiveSection('email')}
                  >
                    <Mail className="mr-3 h-5 w-5 text-indigo-600" />
                    <div className="text-left">
                      <p className="font-semibold">Compose Email</p>
                      <p className="text-xs text-gray-500">Send emails to candidates</p>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'resumes' && <ResumeManagement />}
          {activeSection === 'email' && <EmailAgent />}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
