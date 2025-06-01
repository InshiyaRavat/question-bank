"use client";
import React, { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import AdminQuestionList from "@/components/Admin-side/AdminQuestionList";

export default function AdminDashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [username, setUsername] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setUsername(user.username || "");
    }
  }, [isLoaded, user, isSignedIn]);

  return (
    <div className="min-h-screen flex flex-col bg-[#E9D8A6]">
      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between p-4 bg-[#005F73] shadow-md gap-4">
        <div className="flex items-center gap-3">
          {/* Sidebar Toggle for Mobile */}
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => setSidebarOpen(true)}
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold text-white">
            Admin Dashboard
          </h1>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <input
            type="search"
            placeholder="Search..."
            className="w-full px-4 py-2 text-[#001219] bg-white border border-[#94D2BD] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0A9396]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            className="absolute right-3 top-3 w-5 h-5 text-[#005F73]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15.7955 15.8111L21 21M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z" />
          </svg>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-4">
          <UserButton />
          <p className="text-lg font-medium text-white">{username}</p>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex flex-col md:flex-row flex-1">
        {/* SIDEBAR */}
        <aside
          className={`fixed z-50 inset-y-0 left-0 w-64 bg-[#001219] text-white p-6 transition-transform transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-64"
          } md:translate-x-0 md:relative md:z-auto shadow-lg`}
        >
          <div className="flex justify-between items-center md:hidden">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button
              className="text-white focus:outline-none"
              onClick={() => setSidebarOpen(false)}
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="mt-6 space-y-4">
            <a
              href="#"
              className="block px-4 py-2 rounded-md bg-[#0A9396] text-white hover:bg-[#94D2BD] hover:text-[#001219] transition"
            >
              Question Dashboard
            </a>
          </nav>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 bg-[#FAF3E0]">
          <AdminQuestionList searchTerm={searchTerm} />
        </main>
      </div>
    </div>
  );
}
