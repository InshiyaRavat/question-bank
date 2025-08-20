"use client";
import React, { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Users,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { THEME } from "@/theme";
import AnnouncementForm from "@/components/Admin-side/AnnouncementForm";
import { useToast } from "@/hooks/use-toast";

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
};

const typeColors = {
  info: "bg-blue-100 text-blue-800 border-blue-200",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  success: "bg-green-100 text-green-800 border-green-200",
  error: "bg-red-100 text-red-800 border-red-200",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800 border-gray-200",
  medium: "bg-blue-100 text-blue-800 border-blue-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  urgent: "bg-red-100 text-red-800 border-red-200",
};

export default function AdminAnnouncementsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [username, setUsername] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [filters, setFilters] = useState({
    type: "",
    priority: "",
    isActive: "",
    targetRole: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setUsername(user.username || "");
    }
  }, [isLoaded, user, isSignedIn]);

  useEffect(() => {
    fetchAnnouncements();
  }, [filters]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`/api/admin/announcements?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        setAnnouncements(data.announcements);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch announcements",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast({
        title: "Error",
        description: "Failed to fetch announcements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = () => {
    setEditingAnnouncement(null);
    setShowForm(true);
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Announcement deleted successfully",
        });
        fetchAnnouncements();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to delete announcement",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Announcement ${!currentStatus ? "activated" : "deactivated"} successfully`,
        });
        fetchAnnouncements();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to update announcement",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating announcement:", error);
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAnnouncement(null);
    fetchAnnouncements();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReadStats = (announcement) => {
    const totalReads = announcement.readBy?.length || 0;
    return `${totalReads} read${totalReads !== 1 ? "s" : ""}`;
  };

  return (
    <SidebarInset className="text-black">
      {/* HEADER */}
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-white">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-xl font-semibold" style={{ color: THEME.neutral900 }}>
            Announcements Management
          </h1>
        </div>

        {/* Profile Section */}
        <div className="ml-auto flex items-center gap-4 px-4">
          <Button onClick={handleCreateAnnouncement} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Create Announcement
          </Button>
          <div className="flex items-center gap-3">
            <UserButton />
            <span className="text-sm font-medium" style={{ color: THEME.neutral900 }}>
              {username}
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-white">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
          <select
            value={filters.type}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Types</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <select
            value={filters.isActive}
            onChange={(e) => setFilters((prev) => ({ ...prev, isActive: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <select
            value={filters.targetRole}
            onChange={(e) => setFilters((prev) => ({ ...prev, targetRole: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Audiences</option>
            <option value="all">All Users</option>
            <option value="student">Students Only</option>
            <option value="admin">Admins Only</option>
          </select>
        </div>

        {/* Content Area */}
        <div className="min-h-[100vh] flex-1 rounded-xl md:min-h-min" style={{ backgroundColor: THEME.neutral50 }}>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">No announcements found</div>
                <Button onClick={handleCreateAnnouncement} className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Announcement
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {announcements.map((announcement) => {
                  const TypeIcon = typeIcons[announcement.type];
                  return (
                    <Card key={announcement.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <TypeIcon className="h-5 w-5 mt-1 text-gray-600" />
                            <div className="flex-1">
                              <CardTitle className="text-lg font-semibold mb-2">{announcement.title}</CardTitle>
                              <div className="flex flex-wrap gap-2 mb-2">
                                <Badge className={typeColors[announcement.type]}>{announcement.type}</Badge>
                                <Badge className={priorityColors[announcement.priority]}>
                                  {announcement.priority} priority
                                </Badge>
                                <Badge variant={announcement.isActive ? "default" : "secondary"}>
                                  {announcement.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Badge variant="outline">
                                  <Users className="h-3 w-3 mr-1" />
                                  {announcement.targetRole === "all"
                                    ? "All Users"
                                    : announcement.targetRole === "student"
                                    ? "Students"
                                    : "Admins"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(announcement.id, announcement.isActive)}
                            >
                              {announcement.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditAnnouncement(announcement)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAnnouncement(announcement.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-4 line-clamp-3">{announcement.content}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Created: {formatDate(announcement.createdAt)}
                            </span>
                            {announcement.startDate && <span>Start: {formatDate(announcement.startDate)}</span>}
                            {announcement.endDate && <span>End: {formatDate(announcement.endDate)}</span>}
                          </div>
                          <span>{getReadStats(announcement)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Announcement Form Modal */}
      {showForm && (
        <AnnouncementForm
          announcement={editingAnnouncement}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingAnnouncement(null);
          }}
        />
      )}
    </SidebarInset>
  );
}
