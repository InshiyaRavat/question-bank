"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { ArrowUpRight, ArrowDownLeft, RefreshCw, XCircle, Menu, X } from "lucide-react";
import { THEME } from "@/theme";
import { useTheme } from "@/context/ThemeContext";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import DynamicLogo from "@/components/common/DynamicLogo";

const Header = () => {
  const { colors } = useTheme();
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
        if (subscription.duration === 12) return toast.warn("Already at maximum plan.");
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
        if (subscription.duration === 6) return toast.warn("Already at minimum plan.");
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
        if (subscription.status === "inactive") return toast.warn("Already canceled.");
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
      <div
        className="w-full hidden lg:flex flex-col justify-between p-6 rounded-lg shadow-xl text-white"
        style={{ backgroundColor: colors.primary }}
      >
        <div>
          <div className="mb-6">
            <DynamicLogo fallbackText="Question Bank" size="xl" showText={true} className="text-white" />
          </div>
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
        <div
          className="w-full p-4 shadow flex items-center justify-between"
          style={{ backgroundColor: colors.primary, color: colors.white }}
        >
          <h2 className="text-2xl font-bold">
            <span className="inline">📚</span>
            <span className="inline max-[399px]:hidden"> Question Bank</span>
          </h2>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-md hover:opacity-80"
            style={{ color: colors.white }}
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {menuOpen && (
          <div
            className="w-full px-4 py-6 rounded-b-xl"
            style={{ background: `linear-gradient(to bottom, ${colors.surface}, ${colors.background})` }}
          >
            <div className="flex flex-col space-y-4">
              <SidebarButton
                name="renewal"
                icon={<RefreshCw />}
                onClick={handleClick}
                text="Renew Subscription"
                style={{ backgroundColor: colors.primaryHover }}
              />
              <SidebarButton
                name="upgrade"
                icon={<ArrowUpRight />}
                onClick={handleClick}
                text="Upgrade Plan"
                style={{ backgroundColor: colors.success }}
              />
              <SidebarButton
                name="downgrade"
                icon={<ArrowDownLeft />}
                onClick={handleClick}
                text="Downgrade Plan"
                style={{ backgroundColor: colors.info, color: colors.white }}
              />
              <SidebarButton
                name="cancellation"
                icon={<XCircle />}
                onClick={handleClick}
                text="Cancel Subscription"
                style={{ backgroundColor: colors.error }}
              />
              <div className="pt-4 flex justify-center items-center gap-4">
                <ThemeToggle />
                <UserButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SidebarButton = ({ name, icon, onClick, text, color, style }) => (
  <button
    name={name}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-md transition text-base font-semibold w-full text-white hover:brightness-110 ${
      color || ""
    }`}
    style={style}
  >
    <span className="shrink-0">{icon}</span>
    <span>{text}</span>
  </button>
);

export default Header;
