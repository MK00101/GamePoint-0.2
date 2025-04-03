import { useState } from "react";
import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";
import { cn } from "@/lib/utils";
import {
  Home,
  Search,
  Clock,
  User as UserIcon,
  Menu
} from "lucide-react";

interface MobileNavProps {
  user: User | null;
}

export function MobileNav({ user }: MobileNavProps) {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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
      icon: Home,
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
      icon: Home,
      active: location === "/notifications"
    },
    {
      name: "Earnings",
      href: "/earnings",
      icon: Home,
      active: location === "/earnings"
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Home,
      active: location === "/settings"
    }
  ];

  const footerNavItems = [
    {
      name: "Home",
      href: "/dashboard",
      icon: Home,
      active: location === "/dashboard"
    },
    {
      name: "Explore",
      href: "/explore",
      icon: Search,
      active: location === "/explore"
    },
    {
      name: "Upcoming",
      href: "/upcoming",
      icon: Clock,
      active: location === "/upcoming"
    },
    {
      name: "Profile",
      href: "/profile",
      icon: UserIcon,
      active: location === "/profile"
    }
  ];

  return (
    <>
      {/* Mobile Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 md:hidden flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <div className="font-bold text-xl text-primary-900">GameOn</div>
        </div>
        <button
          onClick={toggleMenu}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile Menu Dropdown */}
      <div
        className={cn(
          "md:hidden bg-white border-b border-slate-200 px-2 py-3 absolute w-full z-50 shadow-lg transition-all duration-200 ease-in-out",
          isMenuOpen ? "block" : "hidden"
        )}
      >
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                item.active
                  ? "bg-slate-100 text-primary-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-primary-900",
                "flex items-center px-3 py-2 text-sm font-medium rounded-md"
              )}
            >
              <item.icon className={cn(
                item.active ? "text-primary-900" : "text-slate-500",
                "h-5 w-5 mr-3"
              )} />
              {item.name}
            </Link>
          ))}
        </nav>
        {user && (
          <div className="pt-4 pb-3 border-t border-slate-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <img
                  className="h-10 w-10 rounded-full"
                  src={user.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                  alt="Profile"
                />
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-slate-800">{user.fullName}</div>
                <div className="text-sm font-medium text-slate-500">{user.email}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Navigation Footer */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex z-10">
        {footerNavItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-3",
              item.active ? "text-secondary-600" : "text-slate-500"
            )}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs mt-1">{item.name}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
