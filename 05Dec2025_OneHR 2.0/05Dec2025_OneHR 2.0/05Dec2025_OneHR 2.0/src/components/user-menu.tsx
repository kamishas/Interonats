import { useAuth } from '../lib/auth-context';
import { getRoleDisplayName } from '../types/auth';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { LogOut, User, Settings } from 'lucide-react';
import { Badge } from './ui/badge';

interface UserMenuProps {
  variant?: 'dropdown' | 'sidebar';
  onNavigate?: (view: any) => void;
}

export function UserMenu({ variant = 'dropdown', onNavigate }: UserMenuProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const roleDisplay = getRoleDisplayName(user.role);

  // Dropdown version for header
  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-500 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
              <Badge variant="secondary" className="mt-2 w-fit text-xs">
                {roleDisplay}
              </Badge>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {onNavigate && (
            <DropdownMenuItem onClick={() => onNavigate('settings')} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Account Settings</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Sidebar version - just shows user info, no logout button
  return (
    <div className="border-t pt-4">
      <div className="flex items-center gap-3 px-3 py-2">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-500 text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-1">
          <span className="text-sm font-medium">{user.name}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>
      </div>
    </div>
  );
}
