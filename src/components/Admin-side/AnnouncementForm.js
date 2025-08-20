"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
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

export default function AnnouncementForm({ announcement, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "info",
    priority: "medium",
    isActive: true,
    targetRole: "all",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title || "",
        content: announcement.content || "",
        type: announcement.type || "info",
        priority: announcement.priority || "medium",
        isActive: announcement.isActive !== undefined ? announcement.isActive : true,
        targetRole: announcement.targetRole || "all",
        startDate: announcement.startDate ? new Date(announcement.startDate).toISOString().slice(0, 16) : "",
        endDate: announcement.endDate ? new Date(announcement.endDate).toISOString().slice(0, 16) : "",
      });
    }
  }, [announcement]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    } else if (formData.content.length > 2000) {
      newErrors.content = "Content must be less than 2000 characters";
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (startDate > endDate) {
        newErrors.endDate = "End date cannot be before start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const url = announcement ? `/api/admin/announcements/${announcement.id}` : "/api/admin/announcements";

      const method = announcement ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Announcement ${announcement ? "updated" : "created"} successfully`,
        });
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: data.error || `Failed to ${announcement ? "update" : "create"} announcement`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast({
        title: "Error",
        description: `Failed to ${announcement ? "update" : "create"} announcement`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const TypeIcon = typeIcons[formData.type];

  return (
    <Dialog open={true} onOpenChange={() => !loading && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{announcement ? "Edit Announcement" : "Create New Announcement"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Preview Card */}
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-2">Preview:</div>
              <div className="flex items-start gap-3">
                <TypeIcon className="h-5 w-5 mt-1 text-gray-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{formData.title || "Announcement Title"}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={typeColors[formData.type]}>{formData.type}</Badge>
                    <Badge className={priorityColors[formData.priority]}>{formData.priority} priority</Badge>
                    <Badge variant={formData.isActive ? "default" : "secondary"}>
                      {formData.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      {formData.targetRole === "all"
                        ? "All Users"
                        : formData.targetRole === "student"
                        ? "Students"
                        : "Admins"}
                    </Badge>
                  </div>
                  <p className="text-gray-700 mb-3">{formData.content || "Announcement content will appear here..."}</p>
                  {(formData.startDate || formData.endDate) && (
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {formData.startDate && <span>Start: {new Date(formData.startDate).toLocaleDateString()}</span>}
                      {formData.endDate && <span>End: {new Date(formData.endDate).toLocaleDateString()}</span>}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter announcement title"
                className={errors.title ? "border-red-500" : ""}
                maxLength={200}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              <p className="text-gray-500 text-sm mt-1">{formData.title.length}/200 characters</p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                placeholder="Enter announcement content"
                className={errors.content ? "border-red-500" : ""}
                rows={4}
                maxLength={2000}
              />
              {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
              <p className="text-gray-500 text-sm mt-1">{formData.content.length}/2000 characters</p>
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="targetRole">Target Audience</Label>
              <Select value={formData.targetRole} onValueChange={(value) => handleInputChange("targetRole", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="student">Students Only</SelectItem>
                  <SelectItem value="admin">Admins Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="isActive">Status</Label>
              <Select
                value={formData.isActive.toString()}
                onValueChange={(value) => handleInputChange("isActive", value === "true")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date (Optional)</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                className={errors.endDate ? "border-red-500" : ""}
              />
              {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {announcement ? "Updating..." : "Creating..."}
                </>
              ) : announcement ? (
                "Update Announcement"
              ) : (
                "Create Announcement"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
