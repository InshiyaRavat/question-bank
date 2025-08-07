"use client";
import Topics from "@/components/TopicList/Topics";
import Header from "@/components/Header/Header";
import React, { useContext } from "react";
import { AttemptedQuestionContext } from "@/context/AttemptedQuestionContext";
import Mode from "@/components/TopicList/Mode";
import { UserButton } from "@clerk/nextjs";
import { THEME } from "@/theme";

export default function QuestionTopic() {
  const { totalQuestions } = useContext(AttemptedQuestionContext);

  return (
    <div
      className="flex flex-col lg:flex-row h-screen"
      style={{ backgroundColor: THEME.surface, color: THEME.textPrimary }}
    >
      {/* Sidebar Header - Desktop */}
      <div
        className="hidden lg:block fixed top-0 left-0 h-full w-1/4 shadow-xl z-10"
        style={{ backgroundColor: THEME.neutral900, color: THEME.textPrimary }}
      >
        <Header />
      </div>

      {/* Main Content Area */}
      <div className="lg:ml-[25%] w-full lg:w-3/4 flex flex-col h-full">
        {/* Mobile Header */}
        <div className="block lg:hidden">
          <Header />
        </div>

        {/* Scrollable Content */}
        <div
          className="flex-1 p-6 sm:p-8 overflow-y-auto shadow-inner"
          style={{ backgroundColor: THEME.surface }}
        >
          {/* Attempted Questions Card */}
          <div
            className="p-4 flex justify-between items-center rounded-xl shadow text-center"
            style={{
              backgroundColor: THEME.primaryLight,
              color: THEME.textPrimary,
            }}
          >
            <h2 className="text-xl sm:text-2xl font-bold">
              🎯 Total Questions Attempted:
              <span style={{ color: THEME.primary, marginLeft: "0.5rem" }}>
                {totalQuestions}
              </span>
            </h2>
            <UserButton />
          </div>

          {/* Content Sections */}
          <div className="flex flex-col gap-8 py-8">
            <div className="w-full">
              <Mode />
            </div>
            <div className="w-full">
              <Topics />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
