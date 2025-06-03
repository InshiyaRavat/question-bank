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
import { THEME } from "@/theme";

const Header = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
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
          return toast.warn("Already at maximum plan.");
        const expiresRaw = subscription.subscribedAt;
        if (!expiresRaw || isNaN(new Date(expiresRaw))) {
          toast.error("Invalid expiration date in subscription.");
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
        toast.success("Subscription upgraded!");
        break;
      case "downgrade":
        if (subscription.duration === 6)
          return toast.warn("Already at minimum plan.");
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
        toast.success("Subscription downgraded.");
        break;
      case "cancellation":
        if (subscription.status === "inactive")
          return toast.warn("Already canceled.");
        await fetch(`api/subscription/${subscription.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "inactive" }),
        });
        toast.success("Subscription canceled.");
        router("/");
        break;
      default:
        break;
    }
  };

  return (
    <div className="h-fit lg:h-screen w-full flex">
      {/* Sidebar (Desktop) */}
      <div className={`w-full hidden lg:flex flex-col justify-between bg-[${THEME.primary_4}] p-6 rounded-lg shadow-xl text-white`}>
        <div>
          <h2 className={`text-3xl font-bold text-[${THEME.secondary_1}] mb-6`}>
            📚 Question Bank
          </h2>
          <nav className="flex flex-col gap-4">
            <SidebarButton
              name="renewal"
              icon={<RefreshCw />}
              onClick={handleClick}
              text="Renew Subscription"
              color={`bg-[${THEME.primary_2}]`}
            />
            <SidebarButton
              name="upgrade"
              icon={<ArrowUpRight />}
              onClick={handleClick}
              text="Upgrade Plan"
              color={`bg-[${THEME.secondary_2}]`}
            />
            <SidebarButton
              name="downgrade"
              icon={<ArrowDownLeft />}
              onClick={handleClick}
              text="Downgrade Plan"
              color={`bg-[${THEME.primary_1}] text-[${THEME.primary_4}]`}
            />
            <SidebarButton
              name="cancellation"
              icon={<XCircle />}
              onClick={handleClick}
              text="Cancel Subscription"
              color={`bg-[${THEME.secondary_6}]`}
            />
          </nav>
        </div>
      </div>

      {/* Mobile View */}
      <div className="flex flex-col lg:hidden w-full">
        <div className={`w-full p-4 bg-[${THEME.primary_4}] shadow flex items-center justify-between text-[${THEME.secondary_1}]`}>
          <h2 className="text-2xl font-bold">
            <span className="inline">📚</span>
            <span className="inline max-[399px]:hidden"> Question Bank</span>
          </h2>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`text-[${THEME.secondary_1}] p-2 rounded-md hover:bg-[${THEME.primary_3}]`}
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {menuOpen && (
          <div className={`w-full px-4 py-6 bg-gradient-to-b from-[${THEME.secondary_1}] to-[#FFF] rounded-b-xl`}>
            <div className="flex flex-col space-y-4">
              <SidebarButton
                name="renewal"
                icon={<RefreshCw />}
                onClick={handleClick}
                text="Renew Subscription"
                color={`bg-[${THEME.primary_2}]`}
              />
              <SidebarButton
                name="upgrade"
                icon={<ArrowUpRight />}
                onClick={handleClick}
                text="Upgrade Plan"
                color={`bg-[${THEME.secondary_2}]`}
              />
              <SidebarButton
                name="downgrade"
                icon={<ArrowDownLeft />}
                onClick={handleClick}
                text="Downgrade Plan"
                color={`bg-[${THEME.primary_1}] text-[${THEME.primary_4}]`}
              />
              <SidebarButton
                name="cancellation"
                icon={<XCircle />}
                onClick={handleClick}
                text="Cancel Subscription"
                color={`bg-[${THEME.secondary_6}]`}
              />
              <div className="pt-4 flex justify-center">
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
    className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-md transition text-base font-semibold w-full ${color} hover:brightness-110`}
  >
    <span className="shrink-0">{icon}</span>
    <span>{text}</span>
  </button>
);

export default Header;
