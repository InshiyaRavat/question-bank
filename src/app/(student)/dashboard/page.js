"use client";
import PerformanceOverview from "@/components/PerformanceOverview";
import UpcomingTestReminders from "@/components/UpcomingTestReminders";
import RecentActivityLogs from "@/components/RecentActivityLogs";
import UserAnalytics from "@/components/UserAnalytics";
import UserSidebar from "@/components/UserSidebar";
import AnnouncementBanner from "@/components/Announcements/AnnouncementBanner";
import AnnouncementWidget from "@/components/Announcements/AnnouncementWidget";
import TestSessionHistory from "@/components/TestSessionHistory";
import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-white w-full relative">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="sm" onClick={toggleSidebar} className="bg-white shadow-md">
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        fixed lg:sticky lg:top-0
        w-64 flex-shrink-0 h-full
        transition-transform duration-300 ease-in-out
        z-40
        lg:z-auto
      `}
      >
        <UserSidebar />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-screen flex flex-col lg:ml-0 overflow-auto">
        <div className="p-4 lg:p-8">
          {/* Announcement Banner */}
          <div className="mb-6">
            <AnnouncementBanner />
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                Welcome to your Dashboard
              </h1>
              <p className="text-slate-600 text-lg">
                Track your progress, view analytics, and manage your learning journey
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-3 flex flex-col gap-6">
                <PerformanceOverview />
                <TestSessionHistory />
                <UserAnalytics />
              </div>
              <div className="flex flex-col gap-6">
                <AnnouncementWidget />
                <UpcomingTestReminders />
                <RecentActivityLogs />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
