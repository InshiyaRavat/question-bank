"use client";
import React from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import QuestionList from "./QuestionList";
import { THEME } from "@/theme";

export default function TopicList({
    topics,
    expandedTopics,
    toggleTopicExpansion,
}) {
    return (
        <div className="divide-y" style={{ borderColor: THEME.neutral200 }}>
            {topics.map((topic) => (
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
                                    {topic.questions.length} question
                                    {topic.questions.length !== 1 ? "s" : ""}
                                </span>
                            </div>
                            {expandedTopics.has(topic.id) ? (
                                <ChevronUp className="h-4 w-4" style={{ color: THEME.textSecondary }} />
                            ) : (
                                <ChevronDown className="h-4 w-4" style={{ color: THEME.textSecondary }} />
                            )}
                        </div>
                    </div>

                    {/* Questions */}
                    {expandedTopics.has(topic.id) && (
                        <QuestionList questions={topic.questions} />
                    )}
                </div>
            ))}
        </div>
    );
}
