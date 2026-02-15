"use client";

import React, { useState, useRef, useEffect } from "react";
import { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Settings,
  Users,
  LogOut,
  ChevronDown,
  FolderKanban,
  Search,
  Bell,
  Workflow,
  Store,
  UserPlus,
  FileUp,
} from "lucide-react";
import { AppView } from "@/app/page";

interface TopHeaderProps {
  currentUser: User | null;
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onLogout: () => void;
  onSearch?: (query: string) => void;
}

export function TopHeader({
  currentUser,
  currentView,
  onChangeView,
  onLogout,
  onSearch,
}: TopHeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Check if user has admin role
  const isAdmin = currentUser?.roles?.some(r => r.role?.name === "Administrator") || false;

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
      {/* Left side - Logo/Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-lg text-gray-900">WMS</span>
            <span className="text-xs text-gray-500 block -mt-1">Work Management Hub</span>
          </div>
        </div>
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-xl mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects and tasks..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch?.(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 border-0 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Right side - Icons, Admin & User */}
      <div className="flex items-center gap-2">
        {/* Quick Action Icons - 3D Animated Style */}
        <button
          className="group relative p-2 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-amber-200/50 bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 border border-amber-200/50"
          title="Notifications"
        >
          <Bell className="w-5 h-5 text-amber-600 group-hover:text-amber-700 transition-colors group-hover:animate-bounce" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold shadow-md">3</span>
        </button>
        <button
          className="group relative p-2 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-purple-200/50 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border border-purple-200/50"
          title="Workflows"
        >
          <Workflow className="w-5 h-5 text-purple-600 group-hover:text-purple-700 transition-colors" />
        </button>
        <button
          onClick={() => onChangeView("marketplace")}
          className={cn(
            "group relative p-2 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-indigo-200/50 border",
            currentView === "marketplace"
              ? "bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400 shadow-lg shadow-indigo-300/50"
              : "bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 border-indigo-200/50"
          )}
          title="Marketplace"
        >
          <Store className={cn(
            "w-5 h-5 transition-colors",
            currentView === "marketplace" ? "text-white" : "text-indigo-600 group-hover:text-indigo-700"
          )} />
        </button>
        <button
          className="group relative p-2 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-emerald-200/50 bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 border border-emerald-200/50"
          title="Invite Members"
        >
          <UserPlus className="w-5 h-5 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
        </button>
        <button
          onClick={() => onChangeView("imports")}
          className={cn(
            "group relative p-2 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-cyan-200/50 border",
            currentView === "imports"
              ? "bg-gradient-to-br from-cyan-500 to-blue-600 border-cyan-400 shadow-lg shadow-cyan-300/50"
              : "bg-gradient-to-br from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 border-cyan-200/50"
          )}
          title="Import Data"
        >
          <FileUp className={cn(
            "w-5 h-5 transition-colors",
            currentView === "imports" ? "text-white" : "text-cyan-600 group-hover:text-cyan-700"
          )} />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-2" />

        {/* User Menu with Admin options integrated */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
              {currentUser?.firstName?.[0] || "U"}{currentUser?.lastName?.[0] || ""}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-700">
                {currentUser?.firstName} {currentUser?.lastName}
              </p>
              <p className="text-xs text-gray-500">{currentUser?.email}</p>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-gray-400 transition-transform",
              isUserMenuOpen ? "rotate-180" : ""
            )} />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                <p className="text-sm font-medium text-gray-700">
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <p className="text-xs text-gray-500">{currentUser?.email}</p>
              </div>
              
              {/* Administration Section (only for admins) */}
              {isAdmin && (
                <>
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Administration</p>
                  </div>
                  <button
                    onClick={() => {
                      onChangeView("users");
                      setIsUserMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                      currentView === "users"
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Users className="w-4 h-4" />
                    User Management
                  </button>
                  <button
                    onClick={() => {
                      onChangeView("settings");
                      setIsUserMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                      currentView === "settings"
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <div className="border-t border-gray-100 my-2" />
                </>
              )}

              <button
                onClick={() => {
                  onLogout();
                  setIsUserMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
