"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Eye,
  CheckCircle,
  X,
  Flag,
  Calendar,
  User,
  MessageSquare,
  FileQuestion,
  TrendingUp,
} from "lucide-react";
import { THEME } from "@/theme";

export default function FlaggedQuestionsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  // const [username, setUsername] = useState("");
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({});
  const [pagination, setPagination] = useState({});

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // useEffect(() => {
  //   if (isLoaded && isSignedIn && user) {
  //     setUsername(user.username || "");
  //   }
  // }, [isLoaded, user, isSignedIn]);

  const fetchFlaggedQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        status: statusFilter,
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/admin/flagged-questions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFlaggedQuestions(data.flags);
        setStatistics(data.statistics);
        setPagination(data.pagination);
      } else {
        console.error("Failed to fetch flagged questions");
      }
    } catch (error) {
      console.error("Error fetching flagged questions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchFlaggedQuestions();
    }
  }, [isLoaded, isSignedIn, statusFilter, sortBy, sortOrder, currentPage]);

  const handleAdminAction = async (action, flagId) => {
    try {
      setActionLoading(true);
      const response = await fetch("/api/admin/flagged-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          flagId,
          adminNotes: adminNotes.trim() || null,
        }),
      });

      if (response.ok) {
        await fetchFlaggedQuestions(); // Refresh the list
        setModalOpen(false);
        setSelectedFlag(null);
        setAdminNotes("");
        alert(`Flag ${action}ed successfully`);
      } else {
        const data = await response.json();
        alert(data.error || `Failed to ${action} flag`);
      }
    } catch (error) {
      console.error(`Error ${action}ing flag:`, error);
      alert(`Failed to ${action} flag`);
    } finally {
      setActionLoading(false);
    }
  };

  const openActionModal = (flag) => {
    setSelectedFlag(flag);
    setAdminNotes(flag.adminNotes || "");
    setModalOpen(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { variant: "destructive", icon: AlertTriangle, text: "Pending" },
      dismissed: { variant: "secondary", icon: X, text: "Dismissed" },
      resolved: { variant: "default", icon: CheckCircle, text: "Resolved" },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && flaggedQuestions.length === 0) {
    return (
      <SidebarInset className="text-black">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading flagged questions...</p>
          </div>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset className="text-black">
      {/* HEADER */}
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-white">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-xl font-semibold" style={{ color: THEME.neutral900 }}>
            Flagged Questions
          </h1>
        </div>

        {/* Profile Section */}
        {/* <div className="ml-auto flex items-center gap-4 px-4">
          <div className="flex items-center gap-3">
            <UserButton />
            <span className="text-sm font-medium" style={{ color: THEME.neutral900 }}>
              {username}
            </span>
          </div>
        </div> */}
      </header>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-white">
        <div className="min-h-[100vh] flex-1 rounded-xl md:min-h-min" style={{ backgroundColor: THEME.neutral50 }}>
          <div className="p-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Flags</CardTitle>
                  <Flag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statistics.byStatus?.reduce((sum, item) => sum + item._count.id, 0) || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {statistics.byStatus?.find((item) => item.status === "pending")?._count.id || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {statistics.byStatus?.find((item) => item.status === "resolved")?._count.id || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Most Flagged</CardTitle>
                  <TrendingUp className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{statistics.mostFlagged?.[0]?.flagCount || 0}</div>
                  <p className="text-xs text-muted-foreground">flags on one question</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="reviewedAt">Date Reviewed</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="reason">Reason</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Flagged Questions List */}
            <div className="space-y-4">
              {flaggedQuestions.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Flag className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No flagged questions found</h3>
                    <p className="text-gray-500 text-center max-w-md">
                      {statusFilter === "all"
                        ? "There are currently no flagged questions in the system."
                        : `No flagged questions with status "${statusFilter}" found.`}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                flaggedQuestions.map((flag) => (
                  <Card key={flag.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2 flex items-center gap-2">
                            <FileQuestion className="h-5 w-5 text-blue-600" />
                            Question #{flag.questionId}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {flag.question?.questionText?.substring(0, 150)}
                            {flag.question?.questionText?.length > 150 && "..."}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(flag.status)}
                          <Badge variant="outline" className="text-xs">
                            {flag.reason.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span>Reported by: {flag.username || flag.userId}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>Flagged: {formatDate(flag.createdAt)}</span>
                          </div>
                          {flag.reviewedAt && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>Reviewed: {formatDate(flag.reviewedAt)}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Subject:</span>{" "}
                            {flag.question?.topic?.subject?.name}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Topic:</span> {flag.question?.topic?.name}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Difficulty:</span>{" "}
                            {flag.question?.difficulty || "N/A"}
                          </div>
                        </div>
                      </div>

                      {flag.details && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Additional Details:</span>
                          </div>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{flag.details}</p>
                        </div>
                      )}

                      {flag.adminNotes && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Eye className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">Admin Notes:</span>
                          </div>
                          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">{flag.adminNotes}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openActionModal(flag)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        {flag.status === "pending" && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAdminAction("resolve", flag.id)}
                              disabled={actionLoading}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleAdminAction("dismiss", flag.id)}
                              disabled={actionLoading}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Dismiss
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  disabled={currentPage === pagination.pages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Flag</DialogTitle>
            <DialogDescription>Take action on this flagged question and add admin notes.</DialogDescription>
          </DialogHeader>

          {selectedFlag && (
            <div className="space-y-4">
              <div className="text-sm">
                <strong>Question:</strong> {selectedFlag.question?.questionText?.substring(0, 100)}...
              </div>
              <div className="text-sm">
                <strong>Reason:</strong> {selectedFlag.reason}
              </div>
              {selectedFlag.details && (
                <div className="text-sm">
                  <strong>Details:</strong> {selectedFlag.details}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Admin Notes</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            {selectedFlag?.status === "pending" && (
              <>
                <Button onClick={() => handleAdminAction("resolve", selectedFlag.id)} disabled={actionLoading}>
                  Resolve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleAdminAction("dismiss", selectedFlag.id)}
                  disabled={actionLoading}
                >
                  Dismiss
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarInset>
  );
}
