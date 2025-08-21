"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { toast, ToastContainer } from "react-toastify";
import { Trash2, RotateCcw, AlertTriangle, FileText, BookOpen, FolderOpen, Calendar, User, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "@/context/ThemeContext";

export default function TrashPage() {
  const { colors } = useTheme();
  const [trashData, setTrashData] = useState({ questions: [], topics: [], subjects: [] });
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [currentTab, setCurrentTab] = useState("all");
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionType, setActionType] = useState(""); // 'restore' or 'delete'
  const [pagination, setPagination] = useState({ page: 1, limit: 50 });

  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    fetchTrashData();
  }, [isLoaded, isSignedIn, user, currentTab, pagination.page]);

  const fetchTrashData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: currentTab === "all" ? "" : currentTab,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/admin/trash?${params}`);
      if (!response.ok) throw new Error("Failed to fetch trash data");

      const data = await response.json();
      setTrashData(data.data);
      setPagination((prev) => ({ ...prev, counts: data.pagination.counts }));
    } catch (error) {
      console.error("Error fetching trash data:", error);
      toast.error("Failed to fetch trash data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (itemId, itemType) => {
    const key = `${itemType}-${itemId}`;
    const newSelected = new Set(selectedItems);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (type) => {
    const items = trashData[type] || [];
    const allKeys = items.map((item) => `${item.type}-${item.id}`);
    const newSelected = new Set(selectedItems);

    const allSelected = allKeys.every((key) => newSelected.has(key));

    if (allSelected) {
      // Unselect all of this type
      allKeys.forEach((key) => newSelected.delete(key));
    } else {
      // Select all of this type
      allKeys.forEach((key) => newSelected.add(key));
    }

    setSelectedItems(newSelected);
  };

  const getSelectedItemsByType = () => {
    const result = { question: [], topic: [], subject: [] };
    selectedItems.forEach((key) => {
      const [type, id] = key.split("-");
      result[type].push(parseInt(id));
    });
    return result;
  };

  const handleBulkAction = (action) => {
    const selectedByType = getSelectedItemsByType();
    const totalSelected = Object.values(selectedByType).reduce((sum, arr) => sum + arr.length, 0);

    if (totalSelected === 0) {
      toast.warning("Please select items to " + action);
      return;
    }

    setActionType(action);
    if (action === "restore") {
      setShowRestoreModal(true);
    } else if (action === "delete") {
      setShowDeleteModal(true);
    }
  };

  const confirmBulkAction = async () => {
    const selectedByType = getSelectedItemsByType();

    try {
      for (const [type, ids] of Object.entries(selectedByType)) {
        if (ids.length === 0) continue;

        const endpoint = actionType === "restore" ? "/api/admin/trash/restore" : "/api/admin/trash/permanent-delete";

        const response = await fetch(endpoint, {
          method: actionType === "restore" ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, ids }),
        });

        if (!response.ok) throw new Error(`Failed to ${actionType} ${type}s`);
      }

      toast.success(`Successfully ${actionType}d selected items`);
      setSelectedItems(new Set());
      fetchTrashData();
    } catch (error) {
      console.error(`Error ${actionType}ing items:`, error);
      toast.error(`Failed to ${actionType} items: ` + error.message);
    } finally {
      setShowRestoreModal(false);
      setShowDeleteModal(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getItemIcon = (type) => {
    switch (type) {
      case "question":
        return <FileText className="h-4 w-4" />;
      case "topic":
        return <FolderOpen className="h-4 w-4" />;
      case "subject":
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const renderTrashItem = (item) => {
    const isSelected = selectedItems.has(`${item.type}-${item.id}`);

    return (
      <div
        key={`${item.type}-${item.id}`}
        className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-surface transition-colors"
        style={{ borderColor: colors.border }}
      >
        <Checkbox checked={isSelected} onCheckedChange={() => handleItemSelect(item.id, item.type)} />

        <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
          {getItemIcon(item.type)}
          <Badge variant="outline" className="text-xs">
            {item.type}
          </Badge>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate" style={{ color: colors.textPrimary }}>
            {item.name || item.questionText || "Unknown"}
          </p>

          {item.type === "question" && (
            <div className="flex items-center space-x-2 text-sm text-muted">
              <span>Topic: {item.topic?.name}</span>
              <span>•</span>
              <span>Subject: {item.topic?.subject?.name}</span>
              {item.difficulty && (
                <>
                  <span>•</span>
                  <Badge variant="secondary" className="text-xs">
                    {item.difficulty}
                  </Badge>
                </>
              )}
            </div>
          )}

          {item.type === "topic" && (
            <div className="flex items-center space-x-2 text-sm text-muted">
              <span>Subject: {item.subject?.name}</span>
              <span>•</span>
              <span>{item.questionsInTrash} questions in trash</span>
            </div>
          )}

          {item.type === "subject" && <div className="text-sm text-muted">{item.topicsInTrash} topics in trash</div>}
        </div>

        <div className="flex items-center space-x-4 text-sm text-muted">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(item.deletedAt)}</span>
          </div>

          <div className="flex items-center space-x-1">
            <User className="h-4 w-4" />
            <span>{item.deletedBy || "Unknown"}</span>
          </div>
        </div>
      </div>
    );
  };

  const getAllItems = () => {
    const allItems = [];
    if (trashData.questions) allItems.push(...trashData.questions);
    if (trashData.topics) allItems.push(...trashData.topics);
    if (trashData.subjects) allItems.push(...trashData.subjects);
    return allItems.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
  };

  const selectedCount = selectedItems.size;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-secondary">Loading trash...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Trash Bin</h1>
          <p className="text-secondary mt-1">Manage soft-deleted questions, topics, and subjects</p>
        </div>

        {selectedCount > 0 && (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-secondary">
              {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
            </span>

            <Button
              onClick={() => handleBulkAction("restore")}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Restore</span>
            </Button>

            <Button
              onClick={() => handleBulkAction("delete")}
              variant="destructive"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Permanently</span>
            </Button>
          </div>
        )}
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className='!text-gray-700'>All ({pagination.counts?.total || 0})</TabsTrigger>
          <TabsTrigger value="questions" className='!text-gray-700'>Questions ({pagination.counts?.questions || 0})</TabsTrigger>
          <TabsTrigger value="topics" className='!text-gray-700'>Topics ({pagination.counts?.topics || 0})</TabsTrigger>
          <TabsTrigger value="subjects" className='!text-gray-700'>Subjects ({pagination.counts?.subjects || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {getAllItems().length === 0 ? (
            <div className="text-center py-12">
              <Trash2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">Trash is empty</h3>
              <p className="text-secondary">No deleted items to display</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => handleSelectAll("all")}>
                  Select All
                </Button>
              </div>

              {getAllItems().map(renderTrashItem)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          {!trashData.questions || trashData.questions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">No deleted questions</h3>
              <p className="text-secondary">No deleted questions to display</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => handleSelectAll("questions")}>
                  Select All Questions
                </Button>
              </div>

              {trashData.questions.map(renderTrashItem)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="topics" className="space-y-4">
          {!trashData.topics || trashData.topics.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">No deleted topics</h3>
              <p className="text-secondary">No deleted topics to display</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => handleSelectAll("topics")}>
                  Select All Topics
                </Button>
              </div>

              {trashData.topics.map(renderTrashItem)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          {!trashData.subjects || trashData.subjects.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">No deleted subjects</h3>
              <p className="text-secondary">No deleted subjects to display</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => handleSelectAll("subjects")}>
                  Select All Subjects
                </Button>
              </div>

              {trashData.subjects.map(renderTrashItem)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Restore Confirmation Modal */}
      <Dialog open={showRestoreModal} onOpenChange={setShowRestoreModal}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <RotateCcw className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle>Confirm Restore</DialogTitle>
                <DialogDescription>
                  Are you sure you want to restore the selected {selectedCount} item{selectedCount !== 1 ? "s" : ""}?
                  This will make them visible and functional again.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmBulkAction}>Restore Items</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <DialogTitle>Confirm Permanent Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to permanently delete the selected {selectedCount} item
                  {selectedCount !== 1 ? "s" : ""}? This action cannot be undone and will remove all associated data.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Warning: This action is irreversible</p>
                <p className="text-sm text-red-700 mt-1">
                  Permanently deleted items cannot be recovered and all related data will be lost.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBulkAction}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ToastContainer position="bottom-right" />
    </div>
  );
}
