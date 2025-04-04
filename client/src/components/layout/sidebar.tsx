import { User } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

import {
  Home,
  Trophy,
  CalendarClock,
  Bell,
  DollarSign,
  Settings,
  User as UserIcon,
  LogOut
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  user: User | null;
}

export function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();
  const { logout } = useAuth();

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      active: location === "/dashboard"
    },
    {
      name: "My Games",
      href: "/my-games",
      icon: Trophy,
      active: location === "/my-games"
    },
    {
      name: "Upcoming",
      href: "/upcoming",
      icon: CalendarClock,
      active: location === "/upcoming"
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: Bell,
      active: location === "/notifications"
    },
    {
      name: "Earnings",
      href: "/earnings",
      icon: DollarSign,
      active: location === "/earnings"
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      active: location === "/settings"
    }
  ];

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-primary-50 to-white border-r border-slate-200">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-6">
            <div className="font-bold text-3xl bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              GameOn
            </div>
          </div>
          <nav className="flex-1 px-3 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  item.active
                    ? "bg-primary-100 text-primary-900 shadow-sm"
                    : "text-slate-700 hover:bg-primary-50 hover:text-primary-900",
                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200"
                )}
              >
                <item.icon
                  className={cn(
                    item.active ? "text-primary-600" : "text-slate-500",
                    "h-5 w-5 mr-3"
                  )}
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        {user && (
          <div className="flex-shrink-0 border-t border-slate-200 p-4">
            <Link href="/profile" className="flex items-center group mb-4 w-full hover:bg-primary-50 p-2 rounded-lg transition-all duration-200">
              <div className="relative">
                <img
                  className="h-10 w-10 rounded-full object-cover border-2 border-primary-200"
                  src={user.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                  alt="Profile"
                />
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-white"></span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {user.fullName}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  View profile
                </p>
              </div>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
