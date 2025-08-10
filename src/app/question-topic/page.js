"use client";
import Topics from "@/components/TopicList/Topics";
import React, { useContext, useState } from "react";
import { AttemptedQuestionContext } from "@/context/AttemptedQuestionContext";
import Mode from "@/components/TopicList/Mode";
import UserSidebar from "@/components/UserSidebar";

export default function QuestionTopic() {
  const { totalQuestions } = useContext(AttemptedQuestionContext);
  const [activeTab, setActiveTab] = useState(null);

  return (
    <div className="flex h-screen bg-white w-full">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 h-full">
        <UserSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      {/* Main Content Area */}
      <div className="flex-1 min-h-screen flex flex-col">
        {/* Attempted Questions Card */}
        <div className="p-4 flex justify-between items-center rounded-xl shadow text-center mt-8 mx-8 bg-blue-50">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-900">
            🎯 Total Questions Attempted:
            <span className="text-blue-700 ml-2">{totalQuestions}</span>
          </h2>
        </div>
        {/* Content Sections */}
        <div className="flex flex-col gap-8 py-8 px-8">
          <div className="w-full">
            <Mode />
          </div>
          <div className="w-full">
            <Topics />
          </div>
        </div>
      </div>
    </div>
  );
}
