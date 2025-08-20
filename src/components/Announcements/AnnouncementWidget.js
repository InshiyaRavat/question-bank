"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  BellRing,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  ChevronRight,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { useAnnouncements } from "@/hooks/useAnnouncements";

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
};

const typeColors = {
  info: "text-blue-600",
  warning: "text-yellow-600",
  success: "text-green-600",
  error: "text-red-600",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export default function AnnouncementWidget({ maxHeight = "400px", showAll = false }) {
  const [expanded, setExpanded] = useState(false);
  const { announcements, unreadCount, loading, markAsRead, markAsUnread, refresh } = useAnnouncements({
    includeRead: showAll,
    autoRefresh: true,
    refreshInterval: 60000, // 1 minute
  });

  const handleMarkAsRead = async (announcementId, isRead) => {
    if (isRead) {
      await markAsUnread(announcementId);
    } else {
      await markAsRead(announcementId);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const displayedAnnouncements = expanded ? announcements : announcements.slice(0, 3);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            {unreadCount > 0 ? <BellRing className="h-4 w-4 text-primary" /> : <Bell className="h-4 w-4" />}
            Announcements
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={refresh} className="h-6 w-6 p-0" disabled={loading}>
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No announcements</p>
          </div>
        ) : (
          <div className="space-y-3">
            <ScrollArea style={{ maxHeight }}>
              <div className="space-y-3 pr-4">
                {displayedAnnouncements.map((announcement) => {
                  const TypeIcon = typeIcons[announcement.type];
                  const typeColor = typeColors[announcement.type];

                  return (
                    <div
                      key={announcement.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        announcement.isRead ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300 shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <TypeIcon className={`h-4 w-4 flex-shrink-0 ${typeColor}`} />
                          <h4
                            className={`text-sm font-medium truncate ${
                              announcement.isRead ? "text-gray-600" : "text-gray-900"
                            }`}
                          >
                            {announcement.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Badge className={`text-xs ${priorityColors[announcement.priority]}`}>
                            {announcement.priority}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(announcement.id, announcement.isRead)}
                            className="h-6 w-6 p-0"
                          >
                            {announcement.isRead ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>

                      <p
                        className={`text-xs leading-relaxed mb-2 ${
                          announcement.isRead ? "text-gray-500" : "text-gray-700"
                        }`}
                      >
                        {announcement.content.length > 100
                          ? `${announcement.content.substring(0, 100)}...`
                          : announcement.content}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{formatDate(announcement.createdAt)}</span>
                        {announcement.endDate && <span>Until {formatDate(announcement.endDate)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {announcements.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="w-full text-xs text-gray-600 hover:text-gray-900"
              >
                {expanded ? "Show Less" : `Show All (${announcements.length})`}
                <ChevronRight className={`h-3 w-3 ml-1 transition-transform ${expanded ? "rotate-90" : ""}`} />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
