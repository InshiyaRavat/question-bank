"use client";
import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserSidebar from "@/components/UserSidebar";
import PersonalizedReport from "@/components/User/PersonalizedReport";

export default function PersonalizedReportPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-slate-50 w-full relative">
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
          <h1 className="text-2xl lg:text-3xl font-bold mb-6 lg:mb-10 text-slate-900 text-center mt-8 lg:mt-0">
            Personalized Report
          </h1>
          
          <div className="max-w-6xl mx-auto">
            <PersonalizedReport />
          </div>
        </div>
      </div>
    </div>
  );
}
