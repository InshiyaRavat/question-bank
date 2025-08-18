import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import downvote from "../../assets/downvote.svg";
import upvote from "../../assets/upvote.svg";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { THEME } from "@/theme";

const Comment = (props) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [reply, setReply] = useState("");
  const [replyBoxVisible, setReplyBoxVisible] = useState(null);
  const [showRepliesFor, setShowRepliesFor] = useState(null);
  const [replies, setReplies] = useState({});
  const { isLoaded, user } = useUser();
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const userEmail = isLoaded && user ? user.emailAddresses[0]?.emailAddress : null;
  const isAdmin = user?.username === "admin";

  const fetchComments = () => {
    setLoading(true);
    fetch(`/api/comment?questionId=${props.questionid}`)
      .then((response) => response.json())
      .then((data) => setComments(data))
      .finally(() => setLoading(false));
  };

  // Fetch comments when the component mounts or questionId changes
  useEffect(() => {
    if (props.questionid) {
      fetchComments();
    }
  }, [props.questionid]);

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    const newCommentObj = {
      userId: user.id,
      username: user.username,
      questionId: props.questionid,
      comment: newComment.trim(),
    };

    fetch("/api/comment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newCommentObj),
    })
      .then((response) => {
        if (response.ok) {
          setNewComment("");
          fetchComments();
          toast.success(isAdmin ? "Admin comment added!" : "Comment added!");
        } else {
          toast.error("Failed to add comment");
        }
      })
      .catch(() => {
        toast.error("Failed to add comment");
      });
  };

  const handleAddReply = (commentId) => {
    if (!reply.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    const newReply = {
      userId: user.id,
      username: user.username,
      commentId: commentId,
      reply: reply.trim(),
      upvote: 0,
      downvote: 0,
    };

    fetch("/api/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newReply),
    })
      .then((response) => {
        if (response.ok) {
          fetchRepliesForComment(commentId);
          setReply("");
          setReplyBoxVisible(null);
          toast.success(isAdmin ? "Admin reply added!" : "Reply added!");
          sendNotification();
        } else {
          toast.error("Failed to add reply");
        }
      })
      .catch(() => {
        toast.error("Failed to add reply");
      });
  };

  const sendNotification = async () => {
    const response = await fetch("/api/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userEmail,
        html: `
    <h1>Another Reply Added!</h1>
    <p>Soemone just added a reply to your comment</p>
    <ul>
        <li>Username:${user.username} </li>
      <li>Reply: ${reply}</li>
    </ul>
  `,
        subject: "Someone replied on your comment. Check it out!",
      }),
    });
    if (!response.ok) {
      toast.error("failed to send email");
    } else {
      toast.success("email sent successfullly!");
    }
  };

  const fetchRepliesForComment = (commentId) => {
    fetch(`/api/reply?commentid=${commentId}`)
      .then((response) => response.json())
      .then((data) => {
        setReplies((prevReplies) => ({ ...prevReplies, [commentId]: data }));
      });
  };

  const handleShowReplies = (commentId) => {
    if (showRepliesFor === commentId) {
      setShowRepliesFor(null);
    } else {
      setShowRepliesFor(commentId);
      fetchRepliesForComment(commentId);
    }
  };

  const handleShowComment = () => {
    setShowComments(!showComments);
  };

  const handleUpVote = async (id) => {
    try {
      const response = await fetch(`/api/reply/${id}`);
      const data = await response.json();

      if (data.length === 0) {
        return;
      }

      const currentReply = data[0];
      const newUpvoteCount = currentReply.upvote + 1;

      await fetch(`/api/reply/${currentReply.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ upvote: newUpvoteCount }),
      });
      fetchRepliesForComment(currentReply.commentId);
    } catch (error) {
      toast.error("Error upvoting");
    }
  };

  const handleDownVote = async (id) => {
    try {
      const response = await fetch(`/api/reply/${id}`);
      const data = await response.json();

      if (data.length === 0) {
        return;
      }

      const currentReply = data[0];
      isFinite;
      const newDownvoteCount = currentReply.downvote + 1;

      await fetch(`/api/reply/${currentReply.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ downvote: newDownvoteCount }),
      });
      fetchRepliesForComment(currentReply.commentId);
    } catch (error) {
      toast.error("Error downvoting");
    }
  };

  return (
    <div className={`max-w-md w-full p-5 bg-white text-[${THEME.primary_4}]`}>
      {/* New Comment Input */}
      <div className="mb-4">
        <div className="flex gap-3">
          <div className="flex-grow">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
              placeholder={isAdmin ? "Add an admin response..." : "Add a comment..."}
              className={`w-full px-4 py-2 rounded-lg border ${
                isAdmin ? "border-red-300 bg-red-50" : "border-gray-300 bg-[#f4f4f4]"
              } text-[${THEME.primary_4}] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[${
                THEME.primary_2
              }]`}
            />
            {isAdmin && <p className="text-xs text-red-600 mt-1">You are commenting as an admin</p>}
          </div>
          <button
            onClick={handleAddComment}
            className={`${
              isAdmin ? "bg-red-500 hover:bg-red-600" : `bg-[${THEME.primary_2}] hover:bg-[${THEME.primary_3}]`
            } text-white px-4 py-2 rounded-lg transition`}
          >
            {isAdmin ? "Reply as Admin" : "Add"}
          </button>
        </div>
        <button
          onClick={handleShowComment}
          className={`mt-3 w-full text-[${THEME.primary_2}] hover:text-[${THEME.secondary_3}] font-medium transition`}
        >
          {showComments ? "Hide Comments" : `Show Comments (${comments.length})`}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-4">
              <p className="text-gray-500">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className={`bg-[#f0fdfa] border border-[${THEME.primary_1}] p-4 rounded-lg`}>
                <div className="flex items-center gap-2 mb-2">
                  <p className={`font-semibold text-[${THEME.primary_3}]`}>{comment.username || "Anonymous"}</p>
                  {comment.username === "admin" && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Admin</span>
                  )}
                </div>
                <p className="text-sm mt-1">{comment.comment}</p>
                <div className={`mt-2 flex gap-4 text-sm text-[${THEME.primary_2}] font-medium`}>
                  <button
                    onClick={() => setReplyBoxVisible(comment.id)}
                    className={`hover:text-[${THEME.secondary_5}]`}
                  >
                    Reply
                  </button>
                  <button onClick={() => handleShowReplies(comment.id)} className={`hover:text-[${THEME.secondary_5}]`}>
                    {showRepliesFor === comment.id ? "Hide Replies" : "Show Replies"}
                  </button>
                </div>

                {/* Reply Input */}
                {replyBoxVisible === comment.id && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddReply(comment.id)}
                      placeholder={isAdmin ? "Your admin reply..." : "Your reply..."}
                      className={`w-full px-4 py-2 rounded-md border ${
                        isAdmin ? "border-red-300 bg-red-50" : "border-gray-300 bg-[#f4f4f4]"
                      } text-[${THEME.primary_4}] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[${
                        THEME.primary_2
                      }]`}
                    />
                    {isAdmin && <p className="text-xs text-red-600 mt-1">Replying as admin</p>}
                    <button
                      onClick={() => handleAddReply(comment.id)}
                      className={`mt-2 ${
                        isAdmin ? "bg-red-500 hover:bg-red-600" : "bg-[#CA6702] hover:bg-[#EE9B00]"
                      } px-3 py-1 text-sm rounded-md text-white transition`}
                    >
                      {isAdmin ? "Reply as Admin" : "Submit"}
                    </button>
                  </div>
                )}

                {/* Replies */}
                {showRepliesFor === comment.id && replies[comment.id] && (
                  <div className={`mt-4 space-y-3 border-l-4 border-[${THEME.primary_2}] pl-4`}>
                    {replies[comment.id].map((reply) => (
                      <div
                        key={reply.id}
                        className={`p-3 rounded-md text-sm ${
                          reply.username === "admin" ? "bg-red-50 border border-red-200" : "bg-[#e0f7f5]"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-semibold text-[${THEME.primary_3}]`}>{reply.username || "Anonymous"}</p>
                          {reply.username === "admin" && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Admin</span>
                          )}
                        </div>
                        <p className="mt-1">{reply.reply}</p>
                        <div className={`flex gap-4 mt-2 items-center text-sm text-[${THEME.primary_3}]`}>
                          <button
                            onClick={() => handleUpVote(reply.id)}
                            className={`flex items-center gap-1 hover:text-[${THEME.primary_2}]`}
                          >
                            <Image width={16} height={16} src={upvote} alt="upvote" />
                            {reply.upvote}
                          </button>
                          <button
                            onClick={() => handleDownVote(reply.id)}
                            className={`flex items-center gap-1 hover:text-[${THEME.secondary_5}]`}
                          >
                            <Image width={16} height={16} src={downvote} alt="downvote" />
                            {reply.downvote}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default Comment;
