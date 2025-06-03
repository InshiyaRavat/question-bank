import { useUser, getUser } from "@clerk/nextjs";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import downvote from "../../assets/downvote.svg";
import upvote from "../../assets/upvote.svg";
import { toast, ToastContainer } from "react-toastify";
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
  const userEmail =
    isLoaded && user ? user.emailAddresses[0]?.emailAddress : null;

  const fetchComments = () => {
    fetch("/api/comment")
      .then((response) => response.json())
      .then((data) => setComments(data));
  };

  // Fetch comments when the component mounts
  useEffect(() => {
    fetchComments();
  }, []);

  const handleAddComment = () => {
    const newCommentObj = {
      userId: user.id, 
      username : user.username,
      questionId : props.questionid, 
      comment: newComment,
    }

    fetch('/api/comment', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newCommentObj),
    }).then(() => {
      setNewComment("");
      fetchComments();
    });
  };

  const handleAddReply = (commentId) => {
    const newReply = {
      userId: user.id,
      username : user.username, 
      commentId: commentId,
      reply: reply,
      upvote: 0,
      downvote:0,
    }

    fetch('/api/reply', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newReply),
    }).then(() => {
      fetchRepliesForComment(commentId);
      setReply("");
      setReplyBoxVisible(null);
      sendNotification();
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
        setReplies((prevReplies) => ({ ...prevReplies, [commentId]: data }))
      })
  }

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
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className={`flex-grow px-4 py-2 rounded-lg border border-gray-300 bg-[#f4f4f4] text-[${THEME.primary_4}] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[${THEME.primary_2}]`}
          />
          <button
            onClick={handleAddComment}
            className={`bg-[${THEME.primary_2}] text-white px-4 py-2 rounded-lg hover:bg-[${THEME.primary_3}] transition`}
          >
            Add
          </button>
        </div>
        <button
          onClick={handleShowComment}
          className={`mt-3 w-full text-[${THEME.primary_2}] hover:text-[${THEME.secondary_3}] font-medium transition`}
        >
          {showComments ? "Hide Comments" : "Show Comments"}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="space-y-4">
          {comments.map((comment) =>
            props.questionid === comment.questionId ? (
              <div
                key={comment.id}
                className={`bg-[#f0fdfa] border border-[${THEME.primary_1}] p-4 rounded-lg`}
              >
                <p className={`font-semibold text-[${THEME>primary_3}]`}>
                  {comment.username || "Anonymous"}
                </p>
                <p className="text-sm mt-1">{comment.comment}</p>
                <div className={`mt-2 flex gap-4 text-sm text-[${THEME.primary_2}] font-medium`}>
                  <button
                    onClick={() => setReplyBoxVisible(comment.id)}
                    className={`hover:text-[${THEME.secondary_5}]`}
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => handleShowReplies(comment.id)}
                    className={`hover:text-[${THEME.secondary_5}]`}
                  >
                    {showRepliesFor === comment.id
                      ? "Hide Replies"
                      : "Show Replies"}
                  </button>
                </div>

                {/* Reply Input */}
                {replyBoxVisible === comment.id && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Your reply..."
                      className={`w-full px-4 py-2 rounded-md border border-gray-300 bg-[#f4f4f4] text-[${THEME.primary_4}] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[${THEME.primary_2}]`}
                    />
                    <button
                      onClick={() => handleAddReply(comment.id)}
                      className={`mt-2 bg-[${THEME.secondary_3}#CA6702] px-3 py-1 text-sm rounded-md text-white hover:bg-[${THEME.secondary_5}] transition`}
                    >
                      Submit
                    </button>
                  </div>
                )}

                {/* Replies */}
                {showRepliesFor === comment.id && replies[comment.id] && (
                  <div className={`mt-4 space-y-3 border-l-4 border-[${THEME.primary_2}] pl-4`}>
                    {replies[comment.id].map((reply) => (
                      <div
                        key={reply.id}
                        className="bg-[#e0f7f5] p-3 rounded-md text-sm"
                      >
                        <p className={`font-semibold text-[${THEME.primary_3}]`}>
                          {reply.username || "Anonymous"}
                        </p>
                        <p className="mt-1">{reply.reply}</p>
                        <div className={`flex gap-4 mt-2 items-center text-sm text-[${THEME.primary_3}]`}>
                          <button
                            onClick={() => handleUpVote(reply.id)}
                            className={`flex items-center gap-1 hover:text-[${THEME.primary_2}]`}
                          >
                            <Image
                              width={16}
                              height={16}
                              src={upvote}
                              alt="upvote"
                            />
                            {reply.upvote}
                          </button>
                          <button
                            onClick={() => handleDownVote(reply.id)}
                            className={`flex items-center gap-1 hover:text-[${THEME.secondary_5}]`}
                          >
                            <Image
                              width={16}
                              height={16}
                              src={downvote}
                              alt="downvote"
                            />
                            {reply.downvote}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null
          )}
        </div>
      )}
      <ToastContainer/>
    </div>
  );
};

export default Comment;
