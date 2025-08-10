"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, BookOpen, CreditCard, RefreshCw, ArrowUpRight, ArrowDownLeft, XCircle } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarHeader } from "@/components/ui/sidebar";

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Question Topics",
    url: "/question-topic",
    icon: BookOpen,
  },
  {
    title: "Subscription",
    url: "#subscription",
    icon: CreditCard,
  },
];

export default function UserSidebar({ activeTab, setActiveTab }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // Subscription actions (moved from Header)
  const handleSubscription = async (action) => {
    if (!user) return;
    setSubscriptionLoading(true);
    try {
      const response = await fetch(`/api/subscription?userid=${user.id}`);
      const data = await response.json();
      const subscription = data.subscription;
      if (!subscription) return;
      switch (action) {
        case "renewal":
          router.push("/");
          break;
        case "upgrade":
          if (subscription.duration === 12) return alert("Already at maximum plan.");
          const upgraded = new Date(subscription.subscribedAt);
          upgraded.setMonth(upgraded.getMonth() + 6);
          await fetch(`/api/subscription/${subscription.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ duration: 12, subscribedAt: upgraded.toISOString() }),
          });
          alert("Subscription upgraded!");
          break;
        case "downgrade":
          if (subscription.duration === 6) return alert("Already at minimum plan.");
          const downgraded = new Date(subscription.subscribedAt);
          downgraded.setMonth(downgraded.getMonth() - 6);
          await fetch(`/api/subscription/${subscription.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ duration: 6, subscribedAt: downgraded.toISOString() }),
          });
          alert("Subscription downgraded.");
          break;
        case "cancellation":
          if (subscription.status === "inactive") return alert("Already canceled.");
          await fetch(`/api/subscription/${subscription.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "inactive" }),
          });
          alert("Subscription canceled.");
          router.push("/");
          break;
        default:
          break;
      }
    } catch (err) {
      alert("Subscription action failed.");
    } finally {
      setSubscriptionLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar className="bg-white border-r border-border min-h-screen w-64 flex flex-col">
        <SidebarHeader className="flex flex-col items-center py-6">
          <div className="text-2xl font-bold mb-2 text-primary">📚 Question Bank</div>
          <UserButton />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item, idx) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        (item.url !== "#subscription" && pathname.startsWith(item.url)) ||
                        (item.url === "#subscription" && activeTab === "subscription")
                      }
                      onClick={() => {
                        if (item.url === "#subscription") setActiveTab && setActiveTab("subscription");
                      }}
                    >
                      {item.url === "#subscription" ? (
                        <button className="flex items-center gap-3 w-full">
                          <item.icon className="h-4 w-4" />
                          <span className="truncate">{item.title}</span>
                        </button>
                      ) : (
                        <Link href={item.url} className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {/* Subscription Tab Content */}
          {activeTab === "subscription" && (
            <div className="mt-8 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="font-semibold text-lg mb-4 text-blue-700">Manage Subscription</div>
              <div className="flex flex-col gap-3">
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium"
                  onClick={() => handleSubscription("renewal")}
                  disabled={subscriptionLoading}
                >
                  <RefreshCw className="w-4 h-4" /> Renew Subscription
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded bg-green-100 text-green-700 hover:bg-green-200 font-medium"
                  onClick={() => handleSubscription("upgrade")}
                  disabled={subscriptionLoading}
                >
                  <ArrowUpRight className="w-4 h-4" /> Upgrade Plan
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-medium"
                  onClick={() => handleSubscription("downgrade")}
                  disabled={subscriptionLoading}
                >
                  <ArrowDownLeft className="w-4 h-4" /> Downgrade Plan
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded bg-red-100 text-red-700 hover:bg-red-200 font-medium"
                  onClick={() => handleSubscription("cancellation")}
                  disabled={subscriptionLoading}
                >
                  <XCircle className="w-4 h-4" /> Cancel Subscription
                </button>
              </div>
            </div>
          )}
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
