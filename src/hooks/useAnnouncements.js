"use client";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "./use-toast";

export const useAnnouncements = (options = {}) => {
  const {
    includeRead = false,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    type = null,
    priority = null,
  } = options;

  const [announcements, setAnnouncements] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchAnnouncements = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (includeRead) params.append("includeRead", "true");
      if (type) params.append("type", type);
      if (priority) params.append("priority", priority);

      const response = await fetch(`/api/announcements?${params}`);
      const data = await response.json();

      if (response.ok) {
        setAnnouncements(data.announcements || []);
        setUnreadCount(data.unreadCount || 0);
        setError(null);
      } else {
        setError(data.error || "Failed to fetch announcements");
      }
    } catch (err) {
      setError("Network error while fetching announcements");
      console.error("Error fetching announcements:", err);
    } finally {
      setLoading(false);
    }
  }, [includeRead, type, priority]);

  const markAsRead = useCallback(
    async (announcementId) => {
      try {
        const response = await fetch(`/api/announcements/${announcementId}/read`, {
          method: "POST",
        });

        if (response.ok) {
          // Update local state
          setAnnouncements((prev) =>
            prev.map((announcement) =>
              announcement.id === announcementId
                ? { ...announcement, isRead: true, readAt: new Date().toISOString() }
                : announcement
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));

          toast({
            title: "Announcement marked as read",
            duration: 2000,
          });

          return true;
        } else {
          const data = await response.json();
          throw new Error(data.error || "Failed to mark as read");
        }
      } catch (err) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
        return false;
      }
    },
    [toast]
  );

  const markAsUnread = useCallback(
    async (announcementId) => {
      try {
        const response = await fetch(`/api/announcements/${announcementId}/read`, {
          method: "DELETE",
        });

        if (response.ok) {
          // Update local state
          setAnnouncements((prev) =>
            prev.map((announcement) =>
              announcement.id === announcementId ? { ...announcement, isRead: false, readAt: null } : announcement
            )
          );
          setUnreadCount((prev) => prev + 1);

          toast({
            title: "Announcement marked as unread",
            duration: 2000,
          });

          return true;
        } else {
          const data = await response.json();
          throw new Error(data.error || "Failed to mark as unread");
        }
      } catch (err) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
        return false;
      }
    },
    [toast]
  );

  const markAllAsRead = useCallback(async () => {
    const unreadAnnouncements = announcements.filter((a) => !a.isRead);

    try {
      const promises = unreadAnnouncements.map((announcement) =>
        fetch(`/api/announcements/${announcement.id}/read`, {
          method: "POST",
        })
      );

      const results = await Promise.allSettled(promises);
      const successCount = results.filter((result) => result.status === "fulfilled").length;

      if (successCount > 0) {
        // Update local state
        setAnnouncements((prev) => prev.map((announcement) => ({ ...announcement, isRead: true })));
        setUnreadCount(0);

        toast({
          title: `${successCount} announcement${successCount !== 1 ? "s" : ""} marked as read`,
          duration: 3000,
        });
      }

      return successCount;
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to mark announcements as read",
        variant: "destructive",
      });
      return 0;
    }
  }, [announcements, toast]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Initial fetch
  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAnnouncements();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAnnouncements]);

  // Listen for storage events to sync across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "announcement-read-status") {
        refresh();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refresh]);

  return {
    announcements,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    refresh,
  };
};
