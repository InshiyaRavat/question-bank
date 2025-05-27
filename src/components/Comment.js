import { useUser, getUser } from "@clerk/nextjs";
import React, { useState, useEffect } from 'react'
import Image from "next/image";
import downvote from '../assets/downvote.svg';
import upvote from '../assets/upvote.svg';

const Comment = (props) => {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [reply, setReply] = useState('')
  const [replyBoxVisible, setReplyBoxVisible] = useState(null)
  const [showRepliesFor, setShowRepliesFor] = useState(null)
  const [replies, setReplies] = useState({})
  const { isLoaded, isSignedIn, user } = useUser()
  const [showComments, setShowComments] =  useState(false)
  const userEmail = isLoaded && user ? user.emailAddresses[0]?.emailAddress : null

  const fetchComments = () => {
    fetch('http://localhost:4000/comments')
      .then((response) => response.json())
      .then((data) => setComments(data))
  }

  // Fetch comments when the component mounts
  useEffect(() => {
    fetchComments()
  }, [])


  useEffect(() => {
    console.log("Updated comment data:", comments); // This will log when `comments` updates
  }, [comments]);

  const handleAddComment = () => {
    const newCommentObj = {
      userid: user.id, 
      username : user.username,
      questionid: props.questionid, 
      comment: newComment,
    }

    fetch('http://localhost:4000/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newCommentObj),
    })
    .then(() => {
      setNewComment('');
      fetchComments(); 
    })
  }

  const handleAddReply = (commentId) => {

    console.log(commentId);
    const newReply = {
      userid: user.id,
      username : user.username, 
      commentid: commentId,
      reply: reply,
      upvote: 0,
      downvote:0,
    }

    fetch('http://localhost:4000/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newReply),
    }).then(() => {
      fetchRepliesForComment(commentId)
      setReply('')
      setReplyBoxVisible(null)
      sendNotification()
    })
  }

  const sendNotification = async() =>{
    console.log('sending email to(payform): ', user.emailAddresses[0].emailAddress)
    const response = await fetch('/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: userEmail, html: `
    <h1>Another Reply Added!</h1>
    <p>Soemone just added a reply to your comment</p>
    <ul>
        <li>Username:${user.username} </li>
      <li>Reply: ${reply}</li>
    </ul>
  `, subject: 'Someone replied on your comment. Check it out!' }), 
    })
    console.log(response)
        if(!response.ok){
          console.log("failed to send email")
        }
        else{
          console.log("email sent successfullly! ")
        }
  }

  const fetchRepliesForComment = (commentId) => {
    fetch(`http://localhost:4000/reply?commentid=${commentId}`)
      .then((response) => response.json())
      .then((data) => {
        setReplies((prevReplies) => ({ ...prevReplies, [commentId]: data }))
      })
  }

  const handleShowReplies = (commentId) => {
    if (showRepliesFor === commentId) {
      setShowRepliesFor(null)
    } else {
      setShowRepliesFor(commentId)
      fetchRepliesForComment(commentId)
    }
  }

  const handleShowComment = () =>{
    setShowComments(!showComments)
  }

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
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ upvote: newUpvoteCount }),
      });
      console.log("Upvote updated successfully!");
      fetchRepliesForComment(currentReply.commentid)
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
      isFinite
        const newDownvoteCount = currentReply.downvote + 1;
    
        await fetch(`http://localhost:4000/reply/${currentReply.id}`, {  
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ downvote: newDownvoteCount }),
        });
        console.log("downvote updated successfully!");
        fetchRepliesForComment(currentReply.commentid)
      
    } catch (error) {
      console.error("Error downvoting:", error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-100 rounded-lg shadow-md">
      {/* Add a new comment */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-grow p-3 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300"
          />
          <button
            onClick={handleAddComment}
            className="px-4 py-2 bg-blue-500 text-white font-medium rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300"
          >
            Add
          </button>
        </div>
        <div className="mt-4">
          <button
            onClick={handleShowComment}
            className="w-full px-4 py-2 bg-gray-100 text-blue-500 font-medium rounded-md shadow-md hover:bg-gray-200 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300"
          >
            Show Comments
          </button>
        </div>
      </div>


      {/* Display comments */} 
      {showComments && (
        <div>
        {comments.map((comment) => (
            props.questionid === comment.questionid ? (
                <div
                    key={comment.id}
                    className="bg-white p-4 mb-4 rounded-lg shadow-md"
                >
                    <p className="text-gray-900 font-semibold text-lg">
      
                    {comment.username || "Anonymous"}
                    </p>
                    <p className="text-gray-700">{comment.comment}</p>
                    <button
                    onClick={() => setReplyBoxVisible(comment.id)}
                    className="mt-2 text-blue-500 hover:underline"
                    >
                    Reply
                    </button>

                    <button
                    onClick={() => handleShowReplies(comment.id)}
                    className="mt-2 ml-4 text-green-500 hover:underline"
                    >
                    {showRepliesFor === comment.id ? 'Hide Replies' : 'Show Replies'}
                    </button>

                    {/* Reply box */}
                    {replyBoxVisible === comment.id && (
                    <div className="mt-4">
                        <input
                        type="text"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Add a reply..."
                        className="w-full p-2 border text-gray-700 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <button
                        onClick={() => handleAddReply(comment.id)}
                        className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-300"
                        >
                        Add Reply
                        </button>
                    </div>
                    )}

                    {/* Replies */}
                    {showRepliesFor === comment.id && replies[comment.id] && (
                    <div className="mt-4 ml-4">
                        {replies[comment.id].map((reply) => (
                        <div key={reply.id} className="bg-gray-100 p-2 mb-2 rounded-md">
                            <p className="text-gray-900 font-semibold text-lg">
                              {reply.username || "Anonymous"}
                            </p>
                            <div>
                              <p className="text-gray-600">{reply.reply}</p>
                              <span className="flex items-center space-x-4">
                                <div className="flex items-center text-black space-x-1">
                                  <button onClick={()=>handleUpVote(reply.id)}><Image width={20} height={20} src={upvote} alt="upvote" /></button> 
                                  <p>{reply.upvote}</p> 
                                </div>

                                <div className="flex items-center text-black space-x-1">
                                  <button onClick={()=>handleDownVote(reply.id)}><Image width={20} height={20} src={downvote} alt="downvote" /></button>
                                  <p>{reply.downvote}</p>
                                </div>
                              </span>
                            </div>
                        </div>
                        ))}
                    </div>
                    )}
                </div>
            ) :null
        ))}
      </div>
      )}
    </div>
  )
}

export default Comment
