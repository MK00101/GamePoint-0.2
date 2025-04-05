import { User } from "@shared/schema";
import { Link } from "wouter";
import { 
  User as UserIcon, 
  LogOut,
  Settings,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  user: User | null;
  actions?: React.ReactNode;
}

export function Header({ user, actions }: HeaderProps) {
  const { logout } = useAuth();

  // Calculate user initials for avatar fallback
  const getInitials = () => {
    if (!user || !user.fullName) return "U";
    return user.fullName
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLogout = async () => {
    try {
      await logout();
      // The auth context already handles redirection
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 py-3 px-4 sm:px-6 md:px-8 hidden md:block">
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-4">
          {actions && (
            <div className="hidden md:flex space-x-3">
              {actions}
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border border-slate-200">
                  <AvatarImage 
                    src={user?.avatarUrl || undefined} 
                    alt={user?.fullName || "User"} 
                  />
                  <AvatarFallback className="bg-primary-100 text-primary-800">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.fullName || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    @{user?.username || "username"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}