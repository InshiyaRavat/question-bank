"use client";
import PerformanceOverview from '../../components/PerformanceOverview';
import UpcomingTestReminders from '../../components/UpcomingTestReminders';
import RecentActivityLogs from '../../components/RecentActivityLogs';
import UserAnalytics from '../../components/UserAnalytics';
import UserSidebar from '../../components/UserSidebar';
import React from 'react';

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-white w-full">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 h-full">
        <UserSidebar />
      </div>
      {/* Main Content Area */}
      <div className="flex-1 min-h-screen flex flex-col">
        <h1 className="text-3xl font-bold mb-10 text-primary text-center mt-8">User Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8">
          <div className="md:col-span-2 flex flex-col gap-8">
            <PerformanceOverview />
            <UpcomingTestReminders />
            <UserAnalytics />
          </div>
          <div className="flex flex-col gap-8">
            <RecentActivityLogs />
          </div>
        </div>
      </div>
    </div>
  );
}
