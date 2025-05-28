"use client";
import Topics from "@/components/TopicList/Topics";
import Header from "@/components/Header/Header";
import React, { useContext } from "react";
import { AttemptedQuestionContext } from "@/context/AttemptedQuestionContext";
import Mode from "@/components/TopicList/Mode";
import { UserButton } from "@clerk/nextjs";

export default function QuestionTopic() {
  const { totalQuestions } = useContext(AttemptedQuestionContext);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#E9D8A6] text-[#001219]">
      {/* Sidebar Header - Desktop */}
      <div className="hidden lg:block w-1/4 bg-[#001219] text-white shadow-xl">
        <Header />
      </div>

      {/* Main Content */}
      <div className="w-full lg:flex-1 p-6 sm:p-8 bg-[#fefcf3] shadow-inner min-h-screen flex flex-col">
        {/* Mobile Header */}
        <div className="block lg:hidden mb-6">
          <Header />
        </div>

        <div className="bg-[#94D2BD] p-4 flex justify-between rounded-xl shadow text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-[#001219]">
            🎯 Total Questions Attempted:
            <span className="text-[#005F73] ml-2">{totalQuestions}</span>
          </h2>
          <UserButton />
        </div>

        <div className="flex flex-col lg:flex-col flex-grow gap-8 py-8">
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
