"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  XCircle,
  Menu,
  X,
} from "lucide-react";

const Header = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      console.log("User loaded successfully");
    }
  }, [isLoaded, isSignedIn]);

  const handleClick = async (e) => {
    const name = e.currentTarget.name;
    const response = await fetch(`api/subscription?userid=${user?.id}`);
    const data = await response.json();
    const subscription = data.subscription;
    switch (name) {
      case "renewal":
        router.push("/");
        break;
      case "upgrade":
        if (subscription.duration === 12)
          return alert("Already at maximum plan.");
        const expiresRaw = subscription.subscribedAt;
        console.log(expiresRaw)
        if (!expiresRaw || isNaN(new Date(expiresRaw))) {
          alert("Invalid expiration date in subscription.");
          return;
        }

        const upgraded = new Date(expiresRaw);
        upgraded.setMonth(upgraded.getMonth() + 6);
        await fetch(`api/subscription/${subscription.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            duration: 12,
            subscribedAt: upgraded.toISOString(),
          }),
        });
        alert("Subscription upgraded!");
        break;
      case "downgrade":
        if (subscription.duration === 6)
          return alert("Already at minimum plan.");
        const downgraded = new Date(subscription.subscribedAt);
        downgraded.setMonth(downgraded.getMonth() - 6);
        await fetch(`api/subscription/${subscription.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            duration: 6,
            subscribedAt: downgraded.toISOString(),
          }),
        });
        alert("Subscription downgraded.");
        break;
      case "cancellation":
        if (subscription.status === "inactive")
          return alert("Already canceled.");
        await fetch(`api/subscription/${subscription.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "inactive" }),
        });
        alert("Subscription canceled.");
        router("/");
        break;
      default:
        break;
    }
  };

  return (
    <div className="h-fit lg:h-screen w-full flex">
      {/* Sidebar (Desktop) */}
      <div className="w-full hidden lg:flex flex-col justify-between bg-white shadow-lg p-6 ">
        <div>
          <h2 className="text-3xl font-bold text-blue-900 mb-6">
            📚 Question Bank
          </h2>
          <nav className="flex flex-col gap-4">
            <SidebarButton
              name="renewal"
              icon={<RefreshCw />}
              onClick={handleClick}
              text="Renew Subscription"
              color="bg-sky-600"
            />
            <SidebarButton
              name="upgrade"
              icon={<ArrowUpRight />}
              onClick={handleClick}
              text="Upgrade Plan"
              color="bg-emerald-600"
            />
            <SidebarButton
              name="downgrade"
              icon={<ArrowDownLeft />}
              onClick={handleClick}
              text="Downgrade Plan"
              color="bg-yellow-500"
            />
            <SidebarButton
              name="cancellation"
              icon={<XCircle />}
              onClick={handleClick}
              text="Cancel Subscription"
              color="bg-rose-600"
            />
          </nav>
        </div>
        <UserButton />
      </div>

      {/* Topbar for Mobile/Tablet */}
      <div className="flex flex-col lg:hidden w-full flex items-center justify-between">
        <div className="lg:hidden w-full p-4 bg-white shadow flex  items-center justify-between">
          <h2 className="text-2xl font-bold text-blue-900">
            <span className="inline">📚</span>
            <span className="inline max-[399px]:hidden"> Question Bank</span>
          </h2>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-blue-700 p-2 rounded-md hover:bg-blue-100"
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="lg:hidden w-full px-4 py-6 bg-gradient-to-b from-blue-50 to-white">
            <div className="flex flex-col space-y-4">
              <SidebarButton
                name="renewal"
                icon={<RefreshCw />}
                onClick={handleClick}
                text="Renew Subscription"
                color="bg-sky-600"
              />
              <SidebarButton
                name="upgrade"
                icon={<ArrowUpRight />}
                onClick={handleClick}
                text="Upgrade Plan"
                color="bg-emerald-600"
              />
              <SidebarButton
                name="downgrade"
                icon={<ArrowDownLeft />}
                onClick={handleClick}
                text="Downgrade Plan"
                color="bg-yellow-500"
              />
              <SidebarButton
                name="cancellation"
                icon={<XCircle />}
                onClick={handleClick}
                text="Cancel Subscription"
                color="bg-rose-600"
              />
              <div className="pt-4">
                <UserButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SidebarButton = ({ name, icon, onClick, text, color }) => (
  <button
    name={name}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 text-white rounded-lg shadow-md ${color} hover:brightness-110 transition text-base font-semibold w-full`}
  >
    <span className="shrink-0">{icon}</span>
    <span>{text}</span>
  </button>
);

export default Header;
