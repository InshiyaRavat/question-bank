"use client";
import React, { useState } from "react";
import { X, Plus, AlertCircle } from "lucide-react";
import { THEME } from "@/theme";

export default function CreateTopicModal({ isOpen, onClose, onTopicCreated, subject }) {
    const [topicName, setTopicName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        // Validation
        const trimmedName = topicName.trim();
        if (!trimmedName) {
            setError("Topic name is required");
            return;
        }

        if (trimmedName.length < 2) {
            setError("Topic name must be at least 2 characters long");
            return;
        }

        if (trimmedName.length > 100) {
            setError("Topic name must be less than 100 characters");
            return;
        }

        // Check for duplicates within the same subject (case-insensitive)
        const isDuplicate = subject.topics.some(
            topic => topic.name.toLowerCase() === trimmedName.toLowerCase()
        );

        if (isDuplicate) {
            setError("A topic with this name already exists in this subject");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch('/api/admin/topics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: trimmedName,
                    subjectId: subject.id,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create topic');
            }

            const newTopic = await response.json();

            // Call parent callback to update state
            onTopicCreated(subject.id, newTopic);

            // Reset form and close modal
            setTopicName("");
            setError("");
            onClose();

        } catch (error) {
            console.error('Error creating topic:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setTopicName("");
        setError("");
        onClose();
    };

    if (!isOpen || !subject) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Plus className="h-6 w-6" style={{ color: THEME.primary600 }} />
                        <h3 className="text-lg font-semibold" style={{ color: THEME.neutral900 }}>
                            Add Topic to {subject.name}
                        </h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={loading}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Subject Info */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-700">
                        Creating topic for: <strong>{subject.name}</strong>
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label
                            htmlFor="topicName"
                            className="block text-sm font-medium mb-2"
                            style={{ color: THEME.neutral700 }}
                        >
                            Topic Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="topicName"
                            type="text"
                            value={topicName}
                            onChange={(e) => setTopicName(e.target.value)}
                            placeholder="Enter topic name..."
                            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{
                                borderColor: error ? '#ef4444' : THEME.neutral300,
                                backgroundColor: "white",
                                color: THEME.textPrimary,
                            }}
                            disabled={loading}
                            maxLength={100}
                        />
                        <div className="mt-1 text-xs" style={{ color: THEME.textSecondary }}>
                            {topicName.length}/100 characters
                        </div>
                    </div>

                    {/* Existing Topics Info */}
                    {subject.topics.length > 0 && (
                        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                            <p className="text-sm font-medium mb-2" style={{ color: THEME.neutral700 }}>
                                Existing topics in {subject.name}:
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {subject.topics.map((topic) => (
                                    <span
                                        key={topic.id}
                                        className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded"
                                    >
                                        {topic.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading || !topicName.trim()}
                        >
                            {loading ? "Creating..." : "Create Topic"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}