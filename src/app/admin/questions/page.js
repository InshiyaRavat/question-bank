"use client";
import React, { useState } from "react";
import { Search } from "lucide-react";
import AdminQuestionList from "@/components/Admin-side/AdminQuestionList";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { THEME } from "@/theme";

export default function AdminDashboard() {
  // const { isLoaded, isSignedIn, user } = useUser();
  // const [username, setUsername] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("questions");

  // useEffect(() => {
  //   if (isLoaded && isSignedIn && user) {
  //     setUsername(user.username || "");
  //   }
  // }, [isLoaded, user, isSignedIn]);

  return (
    <SidebarInset className="text-black">
      {/* HEADER */}
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-white">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-xl font-semibold" style={{ color: THEME.neutral900 }}>
            Admin Dashboard
          </h1>
        </div>

        {/* Search and Profile Section */}
        <div className="ml-auto flex items-center gap-4 px-4">
          {/* Search Input */}
          <div className="relative w-full max-w-sm">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: THEME.textSecondary }}
            />
            <input
              type="search"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                borderColor: THEME.neutral300,
                backgroundColor: "white",
                color: THEME.textPrimary,
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Profile */}
          {/* <div className="flex items-center gap-3">
            <UserButton />
            <span className="text-sm font-medium" style={{ color: THEME.neutral900 }}>
              {username}
            </span>
          </div> */}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-white">
        {/* Content Area */}
        <div className="min-h-[100vh] flex-1 rounded-xl md:min-h-min" style={{ backgroundColor: THEME.neutral50 }}>
          <div className="p-6">
            <AdminQuestionList searchTerm={searchTerm} />
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
