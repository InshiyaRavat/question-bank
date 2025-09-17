"use client";
import React, { useEffect, useState } from "react";
import UsersTableEnhanced from "@/components/Admin-side/UsersTableEnhanced";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { THEME } from "@/theme";

export default function AdminDashboard() {
  // const { isLoaded, isSignedIn, user } = useUser();
  // const [username, setUsername] = useState("");

  // useEffect(() => {
  //   if (isLoaded && isSignedIn && user) {
  //     setUsername(user.username || "");
  //   }
  // }, [isLoaded, user, isSignedIn]);

  return (
    <SidebarInset className='text-black'>
      {/* HEADER */}
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-white">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-xl font-semibold" style={{ color: THEME.neutral900 }}>
            Users Management
          </h1>
        </div>

        {/* Profile Section */}
        {/* <div className="ml-auto flex items-center gap-4 px-4">
          <div className="flex items-center gap-3">
            <UserButton />
            <span className="text-sm font-medium" style={{ color: THEME.neutral900 }}>
              {username}
            </span>
          </div>
        </div> */}
      </header>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-white">
        {/* Content Area */}
        <div className="min-h-[100vh] flex-1 rounded-xl md:min-h-min" style={{ backgroundColor: THEME.neutral50 }}>
          <div className="p-6">
            <UsersTableEnhanced />
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
