"use client";
import React, { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { THEME } from "@/theme";
import { Search, Book, Filter, RefreshCw, Plus, CheckCircle, XCircle, Trash2, AlertTriangle } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import TopicList from "@/components/Admin-side/TopicList";
import CreateSubjectModal from "@/components/Admin-side/CreateSubjectModal";
import CreateTopicModal from "@/components/Admin-side/CreateTopicModal";

export default function AdminSubjects() {
    const { isLoaded, isSignedIn, user } = useUser();
    const [username, setUsername] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [subjects, setSubjects] = useState([]);
    const [expandedTopics, setExpandedTopics] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [difficulty, setDifficulty] = useState("all");
    const [tags, setTags] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    // Modal states
    const [showCreateSubjectModal, setShowCreateSubjectModal] = useState(false);
    const [showCreateTopicModal, setShowCreateTopicModal] = useState(false);
    const [selectedSubjectForTopic, setSelectedSubjectForTopic] = useState(null);
    const [showDeleteSubjectConfirm, setShowDeleteSubjectConfirm] = useState(null);
    const [deletingSubjectId, setDeletingSubjectId] = useState(null);

    // Toast state
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (isLoaded && isSignedIn && user) {
            setUsername(user.username || "");
        }
    }, [isLoaded, user, isSignedIn]);

    useEffect(() => {
        fetchSubjects();
    }, [difficulty, tags]);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (difficulty !== "all") params.set('difficulty', difficulty);
            if (tags) params.set('tags', tags);
            const res = await fetch(`/api/admin/subjects-with-questions?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch subjects");
            setSubjects(await res.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchSubjects();
        setRefreshing(false);
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleSubjectCreated = (newSubject) => {
        setSubjects(prev => [...prev, newSubject]);
        showToast(`Subject "${newSubject.name}" created successfully!`);
    };

    const handleTopicCreated = (subjectId, newTopic) => {
        setSubjects(prev =>
            prev.map(subject =>
                subject.id === subjectId
                    ? { ...subject, topics: [...subject.topics, newTopic] }
                    : subject
            )
        );
        showToast(`Topic "${newTopic.name}" created successfully!`);
    };

    const handleTopicDeleted = (deletedTopicId) => {
        // Remove the deleted topic from the subjects state
        setSubjects(prevSubjects =>
            prevSubjects.map(subject => ({
                ...subject,
                topics: subject.topics.filter(topic => topic.id !== deletedTopicId)
            })).filter(subject => subject.topics.length > 0) // Remove subjects with no topics
        );

        // Remove from expanded topics if it was expanded
        setExpandedTopics(prev => {
            const updated = new Set(prev);
            updated.delete(deletedTopicId);
            return updated;
        });

        showToast("Topic deleted successfully!", 'success');
    };

    const handleDeleteSubject = async (subjectId, subjectName) => {
        if (deletingSubjectId) return; // Prevent multiple simultaneous deletions

        setDeletingSubjectId(subjectId);

        try {
            const response = await fetch(`/api/admin/subjects/${subjectId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete subject');
            }

            // Remove the deleted subject from state
            setSubjects(prev => prev.filter(subject => subject.id !== subjectId));

            // Remove any expanded topics from this subject
            setExpandedTopics(prev => {
                const updated = new Set(prev);
                // Find and remove all topic IDs from this subject
                const subjectToDelete = subjects.find(s => s.id === subjectId);
                if (subjectToDelete) {
                    subjectToDelete.topics.forEach(topic => updated.delete(topic.id));
                }
                return updated;
            });

            setShowDeleteSubjectConfirm(null);
            showToast(`Subject "${subjectName}" deleted successfully!`);

        } catch (error) {
            console.error('Error deleting subject:', error);
            showToast(`Failed to delete subject: ${error.message}`, 'error');
        } finally {
            setDeletingSubjectId(null);
        }
    };

    const handleAddTopicClick = (subject) => {
        setSelectedSubjectForTopic(subject);
        setShowCreateTopicModal(true);
    };

    const toggleTopicExpansion = (topicId) => {
        setExpandedTopics((prev) => {
            const updated = new Set(prev);
            updated.has(topicId) ? updated.delete(topicId) : updated.add(topicId);
            return updated;
        });
    };

    const filteredSubjects = subjects
        .map((subject) => {
            const filteredTopics = subject.topics.filter(
                (topic) =>
                    topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    topic.questions.some((q) =>
                        q.questionText.toLowerCase().includes(searchTerm.toLowerCase())
                    )
            );
            if (
                filteredTopics.length > 0 ||
                subject.name.toLowerCase().includes(searchTerm.toLowerCase())
            ) {
                return { ...subject, topics: filteredTopics };
            }
            return null;
        })
        .filter(Boolean);

    // Delete Subject Confirmation Modal Component
    const DeleteSubjectConfirmModal = ({ subject, onConfirm, onCancel }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                    <h3 className="text-lg font-semibold text-red-600">
                        Delete Subject
                    </h3>
                </div>
                <p className="text-gray-700 mb-4">
                    Are you sure you want to delete the subject{" "}
                    <strong>&quot;{subject.name}&quot;</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                    <p className="text-red-800 text-sm">
                        <strong>⚠️ DANGER:</strong> This action will permanently delete:
                    </p>
                    <ul className="text-red-800 text-sm mt-2 list-disc list-inside">
                        <li><strong>{subject.topics.length}</strong> topic(s)</li>
                        <li><strong>{subject.topics.reduce((sum, topic) => sum + topic.questions.length, 0)}</strong> question(s)</li>
                        <li>All associated comments and replies</li>
                        <li>All user progress for this entire subject</li>
                    </ul>
                    <p className="text-red-800 text-sm mt-2 font-bold">
                        🚨 This action CANNOT be undone! 🚨
                    </p>
                </div>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        disabled={deletingSubjectId === subject.id}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(subject.id, subject.name)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={deletingSubjectId === subject.id}
                    >
                        {deletingSubjectId === subject.id ? "Deleting..." : "Delete Subject"}
                    </button>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <SidebarInset className="text-black">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p style={{ color: THEME.textSecondary }}>
                            Loading subjects and questions...
                        </p>
                    </div>
                </div>
            </SidebarInset>
        );
    }

    if (error) {
        return (
            <SidebarInset className="text-black">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <p className="text-red-500 mb-4">Error: {error}</p>
                        <button
                            onClick={fetchSubjects}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </SidebarInset>
        );
    }

    return (
        <SidebarInset className="text-black">
            {/* HEADER */}
            <header className="flex h-16 items-center gap-2 bg-white">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <h1 className="text-xl font-semibold" style={{ color: THEME.neutral900 }}>
                        Questions by Topic
                    </h1>
                </div>
                <div className="ml-auto flex items-center gap-4 px-4">
                    <button
                        onClick={() => setShowCreateSubjectModal(true)}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Add Subject
                    </button>
                    <button
                        onClick={handleRefresh}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        title="Refresh data"
                        disabled={refreshing}
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="relative w-full max-w-sm">
                        <Search
                            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                            style={{ color: THEME.textSecondary }}
                        />
                        <input
                            type="search"
                            placeholder="Search topics or questions..."
                            className="w-full pl-10 pr-4 py-2 text-sm border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{
                                borderColor: THEME.neutral300,
                                backgroundColor: "white",
                                color: THEME.textPrimary,
                            }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <UserButton />
                        <span className="text-sm font-medium" style={{ color: THEME.neutral900 }}>
                            {username}
                        </span>
                    </div>
                </div>
            </header>

            {/* TOAST NOTIFICATION */}
            {toast && (
                <div className="fixed top-20 right-4 z-50 flex items-center gap-3 p-4 bg-white border rounded-lg shadow-lg">
                    {toast.type === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <p className="text-sm font-medium" style={{ color: THEME.neutral900 }}>
                        {toast.message}
                    </p>
                    <button
                        onClick={() => setToast(null)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XCircle className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* MAIN CONTENT */}
            <div className="p-6 bg-white">
                {/* Filters */}
                <div className="mb-4 p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <Filter className="h-4 w-4" />
                        <span className="text-sm font-semibold">Filters</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Select value={difficulty} onValueChange={setDifficulty}>
                            <SelectTrigger>
                                <SelectValue placeholder="Difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Difficulties</SelectItem>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input placeholder="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
                        <div />
                    </div>
                </div>

                {filteredSubjects.length === 0 ? (
                    <div className="text-center py-12">
                        <Book className="h-12 w-12 mx-auto mb-4" style={{ color: THEME.textSecondary }} />
                        <h3 className="text-lg font-medium mb-2" style={{ color: THEME.neutral900 }}>
                            {searchTerm ? "No matching results" : "No subjects found"}
                        </h3>
                        <p style={{ color: THEME.textSecondary }}>
                            {searchTerm
                                ? "Try adjusting your search terms"
                                : "Start by adding some subjects and topics"}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => setShowCreateSubjectModal(true)}
                                className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mx-auto"
                            >
                                <Plus className="h-4 w-4" />
                                Create Your First Subject
                            </button>
                        )}
                    </div>
                ) : (
                    filteredSubjects.map((subject) => (
                        <div
                            key={subject.id}
                            className="bg-white rounded-lg border shadow-sm mb-6"
                            style={{ borderColor: THEME.neutral300 }}
                        >
                            {/* Subject Header */}
                            <div className="p-4 border-b" style={{ borderColor: THEME.neutral200 }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Book className="h-5 w-5" style={{ color: THEME.primary600 }} />
                                        <h2 className="text-lg font-semibold" style={{ color: THEME.neutral900 }}>
                                            {subject.name}
                                        </h2>
                                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100" style={{ color: THEME.textSecondary }}>
                                            {subject.topics.length} topic
                                            {subject.topics.length !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setShowDeleteSubjectConfirm(subject)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        title={`Delete subject: ${subject.name}`}
                                        disabled={deletingSubjectId === subject.id}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                            <TopicList
                                topics={subject.topics}
                                expandedTopics={expandedTopics}
                                toggleTopicExpansion={toggleTopicExpansion}
                                onTopicDeleted={handleTopicDeleted}
                                onAddTopicClick={handleAddTopicClick}
                                subject={subject}
                            />
                        </div>
                    ))
                )}
            </div>

            {/* MODALS */}
            <CreateSubjectModal
                isOpen={showCreateSubjectModal}
                onClose={() => setShowCreateSubjectModal(false)}
                onSubjectCreated={handleSubjectCreated}
                existingSubjects={subjects}
            />

            <CreateTopicModal
                isOpen={showCreateTopicModal}
                onClose={() => {
                    setShowCreateTopicModal(false);
                    setSelectedSubjectForTopic(null);
                }}
                onTopicCreated={handleTopicCreated}
                subject={selectedSubjectForTopic}
            />

            {/* Delete Subject Confirmation Modal */}
            {showDeleteSubjectConfirm && (
                <DeleteSubjectConfirmModal
                    subject={showDeleteSubjectConfirm}
                    onConfirm={handleDeleteSubject}
                    onCancel={() => setShowDeleteSubjectConfirm(null)}
                />
            )}
        </SidebarInset>
    );
}