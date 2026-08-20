"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Menu, Bell, Search, Moon, Sun, LogOut, User, Shield } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { logout } from "@/app/dashboard/logout/actions";
import type { Profile, UserRole } from "@/types/database";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  employee: "Employee",
};

interface TopbarProps {
  onMenuToggle?: () => void;
  user?: Profile;
  notificationBell?: React.ReactNode;
}

export function Topbar({ onMenuToggle, user, notificationBell }: TopbarProps) {
  const { setTheme } = useTheme();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const displayName = user?.full_name || user?.email?.split("@")[0] || "User";
  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : displayName.charAt(0).toUpperCase();

  // Keyboard shortcut: "/" to focus search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    // Navigate to search — use CRM leads as default search target
    router.push(`/crm/leads?search=${encodeURIComponent(q)}`);
    setSearchQuery("");
    searchInputRef.current?.blur();
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-background/80 backdrop-blur-sm" aria-label="Top navigation">
      {/* Mobile menu */}
      <div className="flex items-center gap-2 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" aria-label="Open navigation menu" />}
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar user={user} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar toggle */}
      <div className="hidden md:flex md:items-center md:gap-2 md:pl-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
          className="hidden md:flex"
        >
          <Menu className="size-4" />
        </Button>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex flex-1 items-center px-4">
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground focus-within:border-ring focus-within:ring-1 focus-within:ring-ring md:w-64 transition-colors">
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label="Search"
          />
          <kbd className="pointer-events-none hidden select-none rounded border border-border bg-background px-1.5 text-[10px] font-medium text-muted-foreground sm:inline">
            /
          </kbd>
        </div>
      </form>

      {/* Right actions */}
      <div className="flex items-center gap-1 px-4">
        {/* Role badge */}
        {user && (
          <div className="hidden items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground sm:flex">
            <Shield className="size-3" />
            <span>{ROLE_LABELS[user.role as UserRole] ?? "Employee"}</span>
          </div>
        )}

        <Separator orientation="vertical" className="h-6" />

        {/* Theme switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" aria-label="Change theme" />}
          >
            <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6" />

        {/* Notifications */}
        {notificationBell || (
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
            <Bell className="size-4" />
          </Button>
        )}

        <Separator orientation="vertical" className="h-6" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="User menu"
                className="rounded-full"
              />
            }
          >
            <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {initials}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {ROLE_LABELS[user?.role as UserRole] ?? "Employee"}
              </p>
            </div>
            <DropdownMenuItem onClick={() => router.push("/dashboard")}>
              <User className="mr-2 size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => logout()}
            >
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
