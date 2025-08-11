"use client";
import React from "react";
import UserSidebar from "@/components/UserSidebar";
import UserBillingHistory from "@/components/UserBillingHistory";

export default function BillingHistoryPage() {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-white">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0">
                <UserSidebar />
            </div>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 lg:mb-10 text-primary text-center">
                    Billing History
                </h1>
                <div className="w-full">
                    <UserBillingHistory />
                </div>
            </main>
        </div>
    );
}
