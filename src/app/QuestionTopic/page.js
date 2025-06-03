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
    <div className={`flex flex-col lg:flex-row h-screen bg-[${THEME.secondary_1}] text-[${THEME.primary_4}]`}>
      {/* Sidebar Header - Desktop (Fixed) */}
      <div className={`hidden lg:block fixed top-0 left-0 h-full w-1/4 bg-[${THEME.primary_4}] text-white shadow-xl z-10`}>
        <Header />
      </div>

      {/* Main Content Area */}
      <div className="lg:ml-[25%] w-full lg:w-3/4 flex flex-col h-full">
        {/* Mobile Header */}
        <div className="block lg:hidden">
          <Header />
        </div>

        {/* Scrollable content only */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto bg-[#fefcf3] shadow-inner">
          <div className={`bg-[${THEME.primary_1}] p-4 flex justify-between items-center rounded-xl shadow text-center`}>
            <h2 className={`text-xl sm:text-2xl font-bold text-[${THEME.primary_4}]`}>
              🎯 Total Questions Attempted:
              <span className={`text-[${THEME.primary_3}] ml-2`}>{totalQuestions}</span>
            </h2>
            <UserButton />
          </div>

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
