"use client";
import React, { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Activity,
  Search,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
  MessageSquare,
  Shield,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { THEME } from "@/theme";

const ACTION_ICONS = {
  user_created: Users,
  user_deleted: Users,
  user_bulk_deleted: Users,
  user_role_granted: Shield,
  user_role_removed: Shield,
  announcement_created: MessageSquare,
  announcement_updated: MessageSquare,
  announcement_deleted: MessageSquare,
  settings_updated: Settings,
  default: Activity,
};

const ACTION_COLORS = {
  // User actions
  user_created: "bg-green-100 text-green-800 border-green-200",
  user_deleted: "bg-red-100 text-red-800 border-red-200",
  user_bulk_deleted: "bg-red-100 text-red-800 border-red-200",
  user_role_granted: "bg-blue-100 text-blue-800 border-blue-200",
  user_role_removed: "bg-orange-100 text-orange-800 border-orange-200",
  user_lifetime_granted: "bg-green-100 text-green-800 border-green-200",
  user_lifetime_removed: "bg-orange-100 text-orange-800 border-orange-200",

  // Announcement actions
  announcement_created: "bg-blue-100 text-blue-800 border-blue-200",
  announcement_updated: "bg-yellow-100 text-yellow-800 border-yellow-200",
  announcement_deleted: "bg-red-100 text-red-800 border-red-200",
  announcement_activated: "bg-green-100 text-green-800 border-green-200",
  announcement_deactivated: "bg-gray-100 text-gray-800 border-gray-200",

  // System actions
  settings_updated: "bg-purple-100 text-purple-800 border-purple-200",
  admin_login: "bg-blue-100 text-blue-800 border-blue-200",

  // Default
  default: "bg-gray-100 text-gray-800 border-gray-200",
};

const RESOURCE_COLORS = {
  user: "bg-blue-50 text-blue-700",
  announcement: "bg-green-50 text-green-700",
  subscription: "bg-purple-50 text-purple-700",
  system: "bg-gray-50 text-gray-700",
  default: "bg-gray-50 text-gray-700",
};

export default function AdminActivityLogsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [username, setUsername] = useState("");
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    adminId: "",
    action: "",
    resource: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 50,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
  });

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setUsername(user.username || "");
    }
  }, [isLoaded, user, isSignedIn]);

  useEffect(() => {
    fetchActivityLogs();
  }, [filters]);

  const fetchActivityLogs = async (includeStats = false) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      if (includeStats) queryParams.append("includeStats", "true");

      const response = await fetch(`/api/admin/activity-logs?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        setLogs(data.logs);
        setPagination(data.pagination);
        if (data.stats) setStats(data.stats);
      } else {
        console.error("Error fetching activity logs:", data.error);
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({
      adminId: "",
      action: "",
      resource: "",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 50,
    });
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatActionName = (action) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getActionIcon = (action) => {
    const IconComponent = ACTION_ICONS[action] || ACTION_ICONS.default;
    return <IconComponent className="h-4 w-4" />;
  };

  const getActionColor = (action) => {
    return ACTION_COLORS[action] || ACTION_COLORS.default;
  };

  const getResourceColor = (resource) => {
    return RESOURCE_COLORS[resource] || RESOURCE_COLORS.default;
  };

  const exportLogs = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== "page" && key !== "limit") queryParams.append(key, value);
      });
      queryParams.append("limit", "1000"); // Export more records

      const response = await fetch(`/api/admin/activity-logs?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        // Create CSV content
        const csvContent = [
          ["Timestamp", "Admin", "Action", "Resource", "Resource ID", "IP Address", "Details"],
          ...data.logs.map((log) => [
            formatTimestamp(log.timestamp),
            log.adminName,
            formatActionName(log.action),
            log.resource,
            log.resourceId || "",
            log.ipAddress || "",
            log.details ? JSON.stringify(log.details) : "",
          ]),
        ]
          .map((row) => row.map((field) => `"${field}"`).join(","))
          .join("\n");

        // Download CSV
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `admin-activity-logs-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting logs:", error);
    }
  };

  return (
    <SidebarInset className="text-black">
      {/* HEADER */}
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-white">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-xl font-semibold" style={{ color: THEME.neutral900 }}>
            Admin Activity Logs
          </h1>
        </div>

        {/* Profile Section */}
        <div className="ml-auto flex items-center gap-4 px-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchActivityLogs(true)}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportLogs} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
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
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Activities</p>
                    <p className="text-2xl font-semibold">{stats.totalActivities}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Last 24 Hours</p>
                    <p className="text-2xl font-semibold">{stats.recentActivity}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Active Admins</p>
                    <p className="text-2xl font-semibold">{stats.adminBreakdown.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Top Action</p>
                    <p className="text-lg font-semibold">
                      {stats.actionBreakdown[0]?.action ? formatActionName(stats.actionBreakdown[0].action) : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search action..."
                  value={filters.action}
                  onChange={(e) => handleFilterChange("action", e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                value={filters.resource || "all"}
                onValueChange={(value) => handleFilterChange("resource", value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Resource type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="Start date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />

              <Input
                type="date"
                placeholder="End date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />

              <Select
                value={filters.limit.toString()}
                onValueChange={(value) => handleFilterChange("limit", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activity Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Activity Logs</CardTitle>
              <Badge variant="secondary">{pagination.totalCount} total activities</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Resource ID</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          Loading activity logs...
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading && logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-center">
                          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No activity logs found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading &&
                    logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">{formatTimestamp(log.timestamp)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">
                                {log.adminName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium">{log.adminName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionColor(log.action)}>
                            <div className="flex items-center gap-1">
                              {getActionIcon(log.action)}
                              {formatActionName(log.action)}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getResourceColor(log.resource)}>
                            {log.resource}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.resourceId || "-"}</TableCell>
                        <TableCell className="font-mono text-sm">{log.ipAddress || "-"}</TableCell>
                        <TableCell>
                          {log.details ? (
                            <details className="cursor-pointer">
                              <summary className="text-sm text-blue-600 hover:text-blue-800">View Details</summary>
                              <pre className="text-xs mt-2 p-2 bg-gray-50 rounded overflow-auto max-w-xs">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount}{" "}
                  activities
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrev}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-2 px-3 py-1 border rounded-md bg-muted/50">
                    <span className="text-sm font-medium">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNext}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
