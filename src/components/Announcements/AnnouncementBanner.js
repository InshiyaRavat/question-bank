"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, AlertTriangle, Info, CheckCircle, XCircle, Bell } from "lucide-react";
import { useAnnouncements } from "@/hooks/useAnnouncements";

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
};

const typeColors = {
  info: "bg-blue-50 border-blue-200 text-blue-900",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
  success: "bg-green-50 border-green-200 text-green-900",
  error: "bg-red-50 border-red-200 text-red-900",
};

const typeAccentColors = {
  info: "bg-blue-500",
  warning: "bg-yellow-500",
  success: "bg-green-500",
  error: "bg-red-500",
};

export default function AnnouncementBanner() {
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState(new Set());
  const { announcements, loading, markAsRead } = useAnnouncements({
    includeRead: false,
    autoRefresh: true,
    refreshInterval: 120000, // 2 minutes
  });

  useEffect(() => {
    // Load dismissed announcements from localStorage
    const dismissed = localStorage.getItem("dismissedAnnouncements");
    if (dismissed) {
      try {
        setDismissedAnnouncements(new Set(JSON.parse(dismissed)));
      } catch (error) {
        console.error("Error parsing dismissed announcements:", error);
      }
    }
  }, []);

  const handleDismiss = async (announcementId) => {
    // Mark as read in the backend
    const success = await markAsRead(announcementId);

    if (success) {
      // Add to dismissed set
      const newDismissed = new Set(dismissedAnnouncements);
      newDismissed.add(announcementId);
      setDismissedAnnouncements(newDismissed);

      // Save to localStorage
      localStorage.setItem("dismissedAnnouncements", JSON.stringify([...newDismissed]));
    }
  };

  // Filter for high priority announcements that should be shown as banners
  const bannerAnnouncements = announcements.filter(
    (announcement) =>
      (announcement.priority === "urgent" || announcement.priority === "high") &&
      !dismissedAnnouncements.has(announcement.id)
  );

  if (loading || bannerAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {bannerAnnouncements.map((announcement) => {
        const TypeIcon = typeIcons[announcement.type];
        const colorClasses = typeColors[announcement.type];
        const accentColor = typeAccentColors[announcement.type];

        return (
          <div key={announcement.id} className={`relative border rounded-lg p-4 pr-12 ${colorClasses} shadow-sm`}>
            {/* Priority accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${accentColor}`} />

            <div className="flex items-start gap-3 ml-2">
              <div className="flex-shrink-0">
                <TypeIcon className="h-5 w-5 mt-0.5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-sm">{announcement.title}</h3>
                  <Badge variant="secondary" className="text-xs bg-white/50 text-current border-current/20">
                    {announcement.priority}
                  </Badge>
                  {announcement.priority === "urgent" && <Bell className="h-3 w-3 animate-pulse" />}
                </div>

                <p className="text-sm leading-relaxed">{announcement.content}</p>

                {(announcement.startDate || announcement.endDate) && (
                  <div className="mt-2 text-xs opacity-75">
                    {announcement.endDate && (
                      <span>Valid until: {new Date(announcement.endDate).toLocaleDateString()}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Dismiss button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDismiss(announcement.id)}
              className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-black/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
