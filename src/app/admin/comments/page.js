"use client";
import React, { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { THEME } from "@/theme";
import { MessageSquare, Reply, Search, Trash2 } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminCommentsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [username, setUsername] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [deletingComment, setDeletingComment] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setUsername(user.username || "");
    }
  }, [isLoaded, user, isSignedIn]);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/comment");
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminReply = async (commentId) => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    try {
      const response = await fetch("/api/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          username: user.username,
          commentId: commentId,
          reply: replyText.trim(),
        }),
      });

      if (response.ok) {
        toast.success("Admin reply added successfully!");
        setReplyText("");
        setReplyingTo(null);
        fetchComments(); // Refresh to show new reply
      } else {
        toast.error("Failed to add reply");
      }
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Failed to add reply");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      setDeletingComment(commentId);
      const response = await fetch(`/api/comment/${commentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminUserId: user.id,
          adminUsername: user.username,
        }),
      });

      if (response.ok) {
        toast.success("Comment deleted successfully!");
        fetchComments(); // Refresh to remove deleted comment
        setDeleteDialogOpen(false);
        setCommentToDelete(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    } finally {
      setDeletingComment(null);
    }
  };

  const openDeleteDialog = (comment) => {
    setCommentToDelete(comment);
    setDeleteDialogOpen(true);
  };

  const filteredComments = comments.filter(
    (comment) =>
      comment.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SidebarInset className="text-black">
      {/* HEADER */}
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-white">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-xl font-semibold" style={{ color: THEME.neutral900 }}>
            Comments & Replies Management
          </h1>
        </div>

        {/* Profile Section */}
        <div className="ml-auto flex items-center gap-4 px-4">
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
        {/* Search and Stats */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">
              <MessageSquare className="h-3 w-3 mr-1" />
              {filteredComments.length} Comments
            </Badge>
            <Button onClick={fetchComments} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[100vh] flex-1 rounded-xl" style={{ backgroundColor: THEME.neutral50 }}>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading comments...</p>
              </div>
            ) : filteredComments.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? "No comments found matching your search." : "No comments yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredComments.map((comment) => (
                  <Card key={comment.id} className="w-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <span>{comment.username || "Anonymous"}</span>
                            {comment.username === "admin" && (
                              <Badge variant="destructive" className="text-xs">
                                Admin
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            Question ID: {comment.questionId} • {formatDate(comment.createdAt)}
                          </p>
                        </div>
                        {/* Delete Button */}
                        <Button
                          onClick={() => openDeleteDialog(comment)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={deletingComment === comment.id}
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingComment === comment.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-800 mb-4">{comment.comment}</p>

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="border-l-2 border-blue-200 pl-4 mb-4 space-y-3">
                          <h4 className="font-medium text-sm text-gray-600">Replies:</h4>
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="bg-gray-50 p-3 rounded-md">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{reply.username}</span>
                                {reply.username === "admin" && (
                                  <Badge variant="destructive" className="text-xs">
                                    Admin
                                  </Badge>
                                )}
                                <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                              </div>
                              <p className="text-sm text-gray-700">{reply.reply}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>👍 {reply.upvote}</span>
                                <span>👎 {reply.downvote}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Admin Reply Section */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setReplyingTo(replyingTo === comment.id ? null : comment.id);
                            setReplyText("");
                          }}
                          variant="outline"
                          size="sm"
                          className="text-blue-600"
                        >
                          <Reply className="h-4 w-4 mr-1" />
                          {replyingTo === comment.id ? "Cancel" : "Reply as Admin"}
                        </Button>
                      </div>

                      {/* Reply Input */}
                      {replyingTo === comment.id && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-600 mb-2">Replying as Admin</p>
                          <Textarea
                            placeholder="Enter your admin reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="mb-3"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleAdminReply(comment.id)}
                              className="bg-red-500 hover:bg-red-600"
                              size="sm"
                            >
                              Send Admin Reply
                            </Button>
                            <Button
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText("");
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment by{" "}
              <span className="font-semibold">
                {commentToDelete?.username || "Anonymous"}
              </span>
              ? This action cannot be undone and will also delete all replies to this comment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 p-3 bg-gray-50 rounded-md border-l-4 border-red-500">
            <p className="text-sm text-gray-700 line-clamp-3">
              "{commentToDelete?.comment}"
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setCommentToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteComment(commentToDelete?.id)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={deletingComment === commentToDelete?.id}
            >
              {deletingComment === commentToDelete?.id ? "Deleting..." : "Delete Comment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ToastContainer />
    </SidebarInset>
  );
}