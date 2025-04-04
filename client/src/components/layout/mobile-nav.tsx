import { useState } from "react";
import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";
import { cn } from "@/lib/utils";
import {
  Home,
  Search,
  CalendarClock,
  Trophy,
  User as UserIcon,
  Menu,
  X,
  Bell,
  DollarSign, 
  Settings,
  LogOut
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface MobileNavProps {
  user: User | null;
}

export function MobileNav({ user }: MobileNavProps) {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { logout } = useAuth();
  
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

  const footerNavItems = [
    {
      name: "Home",
      href: "/dashboard",
      icon: Home,
      active: location === "/dashboard"
    },
    {
      name: "Games",
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
      name: "Profile",
      href: "/profile",
      icon: UserIcon,
      active: location === "/profile"
    }
  ];

  return (
    <>
      {/* Mobile Header */}
      <header className="bg-primary-50 border-b border-slate-200 px-4 py-3 md:hidden flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <div className="font-bold text-2xl bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            GameOn
          </div>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <button className="rounded-full p-2 text-slate-600 hover:bg-primary-100 transition-colors duration-200">
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85%] sm:w-[385px] pt-12">
            {user && (
              <div className="border-b border-slate-200 pb-5 mb-5">
                <div className="flex items-center px-1">
                  <div className="relative">
                    <img
                      className="h-12 w-12 rounded-full object-cover border-2 border-primary-200"
                      src={user.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                      alt="Profile"
                    />
                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 border-2 border-white"></span>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-slate-800">{user.fullName}</div>
                    <div className="text-sm font-medium text-slate-500">{user.email}</div>
                  </div>
                </div>
              </div>
            )}
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    item.active
                      ? "bg-primary-100 text-primary-900"
                      : "text-slate-600 hover:bg-primary-50 hover:text-primary-900",
                    "flex items-center px-4 py-3 text-base font-medium rounded-lg transition-all duration-200"
                  )}
                >
                  <item.icon className={cn(
                    item.active ? "text-primary-600" : "text-slate-500",
                    "h-5 w-5 mr-3"
                  )} />
                  {item.name}
                </Link>
              ))}
              <div className="pt-6 border-t border-slate-200 mt-6">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50 px-4 py-3 h-auto text-base font-medium"
                  onClick={() => logout()}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign out
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      {/* Mobile Navigation Footer */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex z-10">
        {footerNavItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-3",
              item.active 
                ? "text-primary-600 relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-10 after:h-1 after:bg-primary-600 after:rounded-t-md" 
                : "text-slate-500"
            )}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium">{item.name}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
