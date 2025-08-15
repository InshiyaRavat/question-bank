"use client";
import React, { useEffect, useState } from 'react'
import { UserButton, useUser } from "@clerk/nextjs";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { THEME } from "@/theme";
import { Search, ChevronDown, ChevronUp, Book, FileText, Plus, Edit, Trash2 } from "lucide-react";

export default function AdminSubjects() {
    const { isLoaded, isSignedIn, user } = useUser();
    const [username, setUsername] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [subjects, setSubjects] = useState([]);
    const [expandedTopics, setExpandedTopics] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isLoaded && isSignedIn && user) {
            setUsername(user.username || "");
        }
    }, [isLoaded, user, isSignedIn]);

    useEffect(() => {
        fetchSubjectsWithTopicsAndQuestions();
    }, []);

    const fetchSubjectsWithTopicsAndQuestions = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/subjects-with-questions');
            if (!response.ok) {
                throw new Error('Failed to fetch subjects');
            }
            const data = await response.json();
            setSubjects(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleTopicExpansion = (topicId) => {
        const newExpanded = new Set(expandedTopics);
        if (newExpanded.has(topicId)) {
            newExpanded.delete(topicId);
        } else {
            newExpanded.add(topicId);
        }
        setExpandedTopics(newExpanded);
    };

    const getCorrectOptionText = (question) => {
        return question.options[question.correctOptionIdx] || "N/A";
    };

    // Filter subjects and topics based on search term
    const filteredSubjects = subjects.map(subject => {
        const filteredTopics = subject.topics.filter(topic =>
            topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            topic.questions.some(q =>
                q.questionText.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );

        if (filteredTopics.length > 0 || subject.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            return { ...subject, topics: filteredTopics };
        }
        return null;
    }).filter(Boolean);

    if (loading) {
        return (
            <SidebarInset className="text-black">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p style={{ color: THEME.textSecondary }}>Loading subjects and questions...</p>
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
                            onClick={fetchSubjectsWithTopicsAndQuestions}
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
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-white">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <h1 className="text-xl font-semibold" style={{ color: THEME.neutral900 }}>
                        Questions by Topic
                    </h1>
                </div>

                {/* Search and Profile Section */}
                <div className="ml-auto flex items-center gap-4 px-4">
                    {/* Search Input */}
                    <div className="relative w-full max-w-sm">
                        <Search
                            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                            style={{ color: THEME.textSecondary }}
                        />
                        <input
                            type="search"
                            placeholder="Search topics or questions..."
                            className="w-full pl-10 pr-4 py-2 text-sm border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            style={{
                                borderColor: THEME.neutral300,
                                backgroundColor: "white",
                                color: THEME.textPrimary,
                            }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Profile */}
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
                <div className="min-h-[100vh] flex-1 rounded-xl md:min-h-min p-6" style={{ backgroundColor: THEME.neutral50 }}>
                    {filteredSubjects.length === 0 ? (
                        <div className="text-center py-12">
                            <Book className="h-12 w-12 mx-auto mb-4" style={{ color: THEME.textSecondary }} />
                            <h3 className="text-lg font-medium mb-2" style={{ color: THEME.neutral900 }}>
                                {searchTerm ? "No matching results" : "No subjects found"}
                            </h3>
                            <p style={{ color: THEME.textSecondary }}>
                                {searchTerm ? "Try adjusting your search terms" : "Start by adding some subjects and topics"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {filteredSubjects.map((subject) => (
                                <div key={subject.id} className="bg-white rounded-lg border shadow-sm" style={{ borderColor: THEME.neutral300 }}>
                                    {/* Subject Header */}
                                    <div className="p-4 border-b" style={{ borderColor: THEME.neutral200 }}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Book className="h-5 w-5" style={{ color: THEME.primary600 }} />
                                                <h2 className="text-lg font-semibold" style={{ color: THEME.neutral900 }}>
                                                    {subject.name}
                                                </h2>
                                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100" style={{ color: THEME.textSecondary }}>
                                                    {subject.topics.length} topic{subject.topics.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Topics */}
                                    <div className="divide-y" style={{ borderColor: THEME.neutral200 }}>
                                        {subject.topics.map((topic) => (
                                            <div key={topic.id}>
                                                {/* Topic Header */}
                                                <div
                                                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                                    onClick={() => toggleTopicExpansion(topic.id)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <FileText className="h-4 w-4" style={{ color: THEME.textSecondary }} />
                                                            <span className="font-medium" style={{ color: THEME.neutral900 }}>
                                                                {topic.name}
                                                            </span>
                                                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                                                {topic.questions.length} question{topic.questions.length !== 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {expandedTopics.has(topic.id) ? (
                                                                <ChevronUp className="h-4 w-4" style={{ color: THEME.textSecondary }} />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4" style={{ color: THEME.textSecondary }} />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Questions List */}
                                                {expandedTopics.has(topic.id) && (
                                                    <div className="bg-gray-50 border-t" style={{ borderColor: THEME.neutral200 }}>
                                                        {topic.questions.length === 0 ? (
                                                            <div className="p-4 text-center">
                                                                <p style={{ color: THEME.textSecondary }}>No questions in this topic yet</p>
                                                            </div>
                                                        ) : (
                                                            <div className="divide-y" style={{ borderColor: THEME.neutral200 }}>
                                                                {topic.questions.map((question, index) => (
                                                                    <div key={question.id} className="p-4">
                                                                        <div className="flex items-start justify-between gap-4">
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center gap-2 mb-2">
                                                                                    <span className="text-sm font-medium text-blue-600">
                                                                                        Q{index + 1}
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-sm mb-3" style={{ color: THEME.neutral900 }}>
                                                                                    {question.questionText}
                                                                                </p>

                                                                                {/* Options */}
                                                                                <div className="space-y-1 mb-3">
                                                                                    {question.options.map((option, optIndex) => (
                                                                                        <div
                                                                                            key={optIndex}
                                                                                            className={`text-xs p-2 rounded ${optIndex === question.correctOptionIdx
                                                                                                    ? 'bg-green-100 text-green-800 font-medium'
                                                                                                    : 'bg-white'
                                                                                                }`}
                                                                                            style={optIndex !== question.correctOptionIdx ? { color: THEME.textSecondary } : {}}
                                                                                        >
                                                                                            <span className="font-medium mr-2">
                                                                                                {String.fromCharCode(65 + optIndex)}:
                                                                                            </span>
                                                                                            {option}
                                                                                            {optIndex === question.correctOptionIdx && (
                                                                                                <span className="ml-2 text-green-600">✓ Correct</span>
                                                                                            )}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>

                                                                                {/* Explanation */}
                                                                                {question.explanation && (
                                                                                    <div className="text-xs p-2 bg-blue-50 rounded" style={{ color: THEME.textSecondary }}>
                                                                                        <span className="font-medium">Explanation: </span>
                                                                                        {question.explanation}
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Action buttons */}
                                                                            <div className="flex gap-1">
                                                                                <button className="p-1 hover:bg-gray-200 rounded">
                                                                                    <Edit className="h-4 w-4" style={{ color: THEME.textSecondary }} />
                                                                                </button>
                                                                                <button className="p-1 hover:bg-red-100 rounded">
                                                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </SidebarInset>
    );
}