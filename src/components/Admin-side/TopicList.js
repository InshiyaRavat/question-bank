"use client";
import React, { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Trash2, AlertTriangle } from "lucide-react";
import QuestionList from "./QuestionList";
import { THEME } from "@/theme";

export default function TopicList({
    topics,
    expandedTopics,
    toggleTopicExpansion,
    onTopicDeleted, // New prop to handle topic deletion
}) {
    const [deletingTopicId, setDeletingTopicId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    const handleDeleteTopic = async (topicId, topicName) => {
        if (deletingTopicId) return; // Prevent multiple simultaneous deletions

        setDeletingTopicId(topicId);

        try {
            const response = await fetch(`/api/admin/topics/${topicId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete topic');
            }

            // Call the parent component's callback to update the state
            if (onTopicDeleted) {
                onTopicDeleted(topicId);
            }

            setShowDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting topic:', error);
            alert(`Failed to delete topic: ${error.message}`);
        } finally {
            setDeletingTopicId(null);
        }
    };

    const DeleteConfirmModal = ({ topic, onConfirm, onCancel }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                    <h3 className="text-lg font-semibold text-red-600">
                        Delete Topic
                    </h3>
                </div>
                <p className="text-gray-700 mb-4">
                    Are you sure you want to delete the topic{" "}
                    <strong>&quot;{topic.name}&quot;</strong>?
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                    <p className="text-yellow-800 text-sm">
                        <strong>Warning:</strong> This action will permanently delete:
                    </p>
                    <ul className="text-yellow-800 text-sm mt-2 list-disc list-inside">
                        <li>{topic.questions.length} question(s)</li>
                        <li>All associated comments and replies</li>
                        <li>All user progress for this topic</li>
                    </ul>
                    <p className="text-yellow-800 text-sm mt-2 font-medium">
                        This action cannot be undone.
                    </p>
                </div>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        disabled={deletingTopicId === topic.id}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(topic.id, topic.name)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={deletingTopicId === topic.id}
                    >
                        {deletingTopicId === topic.id ? "Deleting..." : "Delete Topic"}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className="divide-y" style={{ borderColor: THEME.neutral200 }}>
                {topics.map((topic) => (
                    <div key={topic.id}>
                        {/* Topic Header */}
                        <div className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div
                                    className="flex items-center gap-3 cursor-pointer flex-1"
                                    onClick={() => toggleTopicExpansion(topic.id)}
                                >
                                    <FileText className="h-4 w-4" style={{ color: THEME.textSecondary }} />
                                    <span className="font-medium" style={{ color: THEME.neutral900 }}>
                                        {topic.name}
                                    </span>
                                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                        {topic.questions.length} question
                                        {topic.questions.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowDeleteConfirm(topic);
                                        }}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        title={`Delete topic: ${topic.name}`}
                                        disabled={deletingTopicId === topic.id}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                    <div
                                        className="cursor-pointer p-1"
                                        onClick={() => toggleTopicExpansion(topic.id)}
                                    >
                                        {expandedTopics.has(topic.id) ? (
                                            <ChevronUp className="h-4 w-4" style={{ color: THEME.textSecondary }} />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" style={{ color: THEME.textSecondary }} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Questions */}
                        {expandedTopics.has(topic.id) && (
                            <QuestionList questions={topic.questions} />
                        )}
                    </div>
                ))}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <DeleteConfirmModal
                    topic={showDeleteConfirm}
                    onConfirm={handleDeleteTopic}
                    onCancel={() => setShowDeleteConfirm(null)}
                />
            )}
        </>
    );
}