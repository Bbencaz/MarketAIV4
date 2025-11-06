import { User, LogOut, Link as LinkIcon, Library } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface UserMenuProps {
  user: { email: string; name: string };
  onLogout: () => void;
  onOpenCatalog: () => void;
  onOpenSocialLinks: () => void;
}

export function UserMenu({ user, onLogout, onOpenCatalog, onOpenSocialLinks }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 border-2 hover:border-purple-400 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="hidden sm:inline">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{user.name}</span>
            <span className="text-xs text-slate-500">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onOpenCatalog} className="cursor-pointer gap-2">
          <Library className="w-4 h-4" />
          My Catalog
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenSocialLinks} className="cursor-pointer gap-2">
          <LinkIcon className="w-4 h-4" />
          Social Media Links
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="cursor-pointer gap-2 text-red-600">
          <LogOut className="w-4 h-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
