"use client";
import PerformanceOverview from "../../components/PerformanceOverview";
import UpcomingTestReminders from "../../components/UpcomingTestReminders";
import RecentActivityLogs from "../../components/RecentActivityLogs";
import UserAnalytics from "../../components/UserAnalytics";
import UserSidebar from "../../components/UserSidebar";
import AnnouncementBanner from "../../components/Announcements/AnnouncementBanner";
import AnnouncementWidget from "../../components/Announcements/AnnouncementWidget";
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
        fixed lg:relative
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
      <div className="flex-1 min-h-screen flex flex-col lg:ml-0">
        <div className="p-4 lg:p-8">
          {/* Announcement Banner */}
          <div className="mb-6">
            <AnnouncementBanner />
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold mb-6 lg:mb-10 text-primary text-center mt-8 lg:mt-0">
            User Dashboard
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
            <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-8">
              <PerformanceOverview />
              <UpcomingTestReminders />
              <UserAnalytics />
            </div>
            <div className="flex flex-col gap-4 lg:gap-8">
              <AnnouncementWidget />
              <RecentActivityLogs />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
