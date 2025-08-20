"use client";
import React, { useState } from "react";
import { X, Plus, AlertCircle } from "lucide-react";
import { THEME } from "@/theme";

export default function CreateSubjectModal({ isOpen, onClose, onSubjectCreated, existingSubjects }) {
    const [subjectName, setSubjectName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        // Validation
        const trimmedName = subjectName.trim();
        if (!trimmedName) {
            setError("Subject name is required");
            return;
        }

        if (trimmedName.length < 2) {
            setError("Subject name must be at least 2 characters long");
            return;
        }

        if (trimmedName.length > 100) {
            setError("Subject name must be less than 100 characters");
            return;
        }

        // Check for duplicates (case-insensitive)
        const isDuplicate = existingSubjects.some(
            subject => subject.name.toLowerCase() === trimmedName.toLowerCase()
        );

        if (isDuplicate) {
            setError("A subject with this name already exists");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch('/api/admin/subjects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: trimmedName,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create subject');
            }

            const newSubject = await response.json();

            // Call parent callback to update state
            onSubjectCreated(newSubject);

            // Reset form and close modal
            setSubjectName("");
            setError("");
            onClose();

        } catch (error) {
            console.error('Error creating subject:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setSubjectName("");
        setError("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Plus className="h-6 w-6" style={{ color: THEME.primary600 }} />
                        <h3 className="text-lg font-semibold" style={{ color: THEME.neutral900 }}>
                            Create New Subject
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

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label
                            htmlFor="subjectName"
                            className="block text-sm font-medium mb-2"
                            style={{ color: THEME.neutral700 }}
                        >
                            Subject Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="subjectName"
                            type="text"
                            value={subjectName}
                            onChange={(e) => setSubjectName(e.target.value)}
                            placeholder="Enter subject name..."
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
                            {subjectName.length}/100 characters
                        </div>
                    </div>

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
                            disabled={loading || !subjectName.trim()}
                        >
                            {loading ? "Creating..." : "Create Subject"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}