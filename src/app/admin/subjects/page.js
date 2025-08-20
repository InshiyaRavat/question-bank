"use client";
import React, { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { THEME } from "@/theme";
import { Search, Book, Filter, RefreshCw } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import TopicList from "@/components/Admin-side/TopicList";

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

        // Show success message
        // You could replace this with a toast notification if you have one
        alert("Topic deleted successfully!");
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
                            </div>
                            <TopicList
                                topics={subject.topics}
                                expandedTopics={expandedTopics}
                                toggleTopicExpansion={toggleTopicExpansion}
                                onTopicDeleted={handleTopicDeleted}
                            />
                        </div>
                    ))
                )}
            </div>
        </SidebarInset>
    );
}