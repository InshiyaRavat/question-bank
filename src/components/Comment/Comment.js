import { useUser, getUser } from "@clerk/nextjs";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import downvote from "../../assets/downvote.svg";
import upvote from "../../assets/upvote.svg";

const Comment = (props) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [reply, setReply] = useState("");
  const [replyBoxVisible, setReplyBoxVisible] = useState(null);
  const [showRepliesFor, setShowRepliesFor] = useState(null);
  const [replies, setReplies] = useState({});
  const { isLoaded, isSignedIn, user } = useUser();
  const [showComments, setShowComments] = useState(false);
  const userEmail =
    isLoaded && user ? user.emailAddresses[0]?.emailAddress : null;

  const fetchComments = () => {
    fetch("http://localhost:4000/comments")
      .then((response) => response.json())
      .then((data) => setComments(data));
  };

  // Fetch comments when the component mounts
  useEffect(() => {
    fetchComments();
  }, []);

  useEffect(() => {
    console.log("Updated comment data:", comments); // This will log when `comments` updates
  }, [comments]);

  const handleAddComment = () => {
    const newCommentObj = {
      userid: user.id,
      username: user.username,
      questionid: props.questionid,
      comment: newComment,
    };

    fetch("http://localhost:4000/comments", {
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
    console.log(commentId);
    const newReply = {
      userid: user.id,
      username: user.username,
      commentid: commentId,
      reply: reply,
      upvote: 0,
      downvote: 0,
    };

    fetch("http://localhost:4000/reply", {
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
    console.log(
      "sending email to(payform): ",
      user.emailAddresses[0].emailAddress
    );
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
    console.log(response);
    if (!response.ok) {
      console.log("failed to send email");
    } else {
      console.log("email sent successfullly! ");
    }
  };

  const fetchRepliesForComment = (commentId) => {
    fetch(`http://localhost:4000/reply?commentid=${commentId}`)
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
      const response = await fetch(`http://localhost:4000/reply?id=${id}`);
      const data = await response.json();

      if (data.length === 0) {
        console.error("Reply not found");
        return;
      }

      const currentReply = data[0];
      const newUpvoteCount = currentReply.upvote + 1;

      await fetch(`http://localhost:4000/reply/${currentReply.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ upvote: newUpvoteCount }),
      });
      console.log("Upvote updated successfully!");
      fetchRepliesForComment(currentReply.commentid);
    } catch (error) {
      console.error("Error upvoting:", error);
    }
  };

  const handleDownVote = async (id) => {
    try {
      const response = await fetch(`http://localhost:4000/reply?id=${id}`);
      const data = await response.json();

      if (data.length === 0) {
        console.error("Reply not found");
        return;
      }

      const currentReply = data[0];
      isFinite;
      const newDownvoteCount = currentReply.downvote + 1;

      await fetch(`http://localhost:4000/reply/${currentReply.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ downvote: newDownvoteCount }),
      });
      console.log("downvote updated successfully!");
      fetchRepliesForComment(currentReply.commentid);
    } catch (error) {
      console.error("Error downvoting:", error);
    }
  };

  return (
    <div className="max-w-md w-full p-5 bg-white text-[#001219]">
      {/* New Comment Input */}
      <div className="mb-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-grow px-4 py-2 rounded-lg border border-gray-300 bg-[#f4f4f4] text-[#001219] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0A9396]"
          />
          <button
            onClick={handleAddComment}
            className="bg-[#0A9396] text-white px-4 py-2 rounded-lg hover:bg-[#005F73] transition"
          >
            Add
          </button>
        </div>
        <button
          onClick={handleShowComment}
          className="mt-3 w-full text-[#0A9396] hover:text-[#CA6702] font-medium transition"
        >
          {showComments ? "Hide Comments" : "Show Comments"}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="space-y-4">
          {comments.map((comment) =>
            props.questionid === comment.questionid ? (
              <div
                key={comment.id}
                className="bg-[#f0fdfa] border border-[#94D2BD] p-4 rounded-lg"
              >
                <p className="font-semibold text-[#005F73]">
                  {comment.username || "Anonymous"}
                </p>
                <p className="text-sm mt-1">{comment.comment}</p>
                <div className="mt-2 flex gap-4 text-sm text-[#0A9396] font-medium">
                  <button
                    onClick={() => setReplyBoxVisible(comment.id)}
                    className="hover:text-[#AE2012]"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => handleShowReplies(comment.id)}
                    className="hover:text-[#AE2012]"
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
                      className="w-full px-4 py-2 rounded-md border border-gray-300 bg-[#f4f4f4] text-[#001219] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0A9396]"
                    />
                    <button
                      onClick={() => handleAddReply(comment.id)}
                      className="mt-2 bg-[#CA6702] px-3 py-1 text-sm rounded-md text-white hover:bg-[#AE2012] transition"
                    >
                      Submit
                    </button>
                  </div>
                )}

                {/* Replies */}
                {showRepliesFor === comment.id && replies[comment.id] && (
                  <div className="mt-4 space-y-3 border-l-4 border-[#0A9396] pl-4">
                    {replies[comment.id].map((reply) => (
                      <div
                        key={reply.id}
                        className="bg-[#e0f7f5] p-3 rounded-md text-sm"
                      >
                        <p className="font-semibold text-[#005F73]">
                          {reply.username || "Anonymous"}
                        </p>
                        <p className="mt-1">{reply.reply}</p>
                        <div className="flex gap-4 mt-2 items-center text-sm text-[#005F73]">
                          <button
                            onClick={() => handleUpVote(reply.id)}
                            className="flex items-center gap-1 hover:text-[#0A9396]"
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
                            className="flex items-center gap-1 hover:text-[#AE2012]"
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
    </div>
  );
};

export default Comment;
