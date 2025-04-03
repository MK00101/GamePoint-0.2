import { User } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

import {
  Home,
  Zap,
  Clock,
  Bell,
  Download,
  Settings,
  User as UserIcon
} from "lucide-react";

interface SidebarProps {
  user: User | null;
}

export function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();

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
      icon: Zap,
      active: location === "/my-games"
    },
    {
      name: "Upcoming",
      href: "/upcoming",
      icon: Clock,
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
      icon: Download,
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
      <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-slate-200">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="font-bold text-2xl text-primary-900">GameOn</div>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  item.active
                    ? "bg-slate-100 text-primary-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-primary-900",
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md"
                )}
              >
                <item.icon
                  className={cn(
                    item.active ? "text-primary-900" : "text-slate-500",
                    "h-5 w-5 mr-3"
                  )}
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        {user && (
          <div className="flex-shrink-0 flex border-t border-slate-200 p-4">
            <Link href="/profile" className="flex-shrink-0 group block w-full">
              <div className="flex items-center">
                <div>
                  <img
                    className="inline-block h-10 w-10 rounded-full"
                    src={user.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                    alt="Profile"
                  />
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium text-slate-700">
                    {user.fullName}
                  </p>
                  <p className="text-sm font-medium text-slate-500">
                    View profile
                  </p>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
