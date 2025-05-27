'use client'
import Topics from "@/components/Topics";
import Header from "@/components/Header";
import React, { useContext } from "react";
import { AttemptedQuestionContext } from '@/context/AttemptedQuestionContext'
import Mode from "@/components/Mode";

export default function QuestionTopic() {
  const { totalQuestions } = useContext(AttemptedQuestionContext);

  return (
    <div className="flex flex-col lg:flex-row items-start gap-6 bg-gray-50 min-h-screen p-6">
      
      {/* Sidebar Header - shown only on large screens */}
      <div className="hidden lg:block w-1/4 h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg shadow-xl p-5">
        <Header />
      </div>

      {/* Main Content */}
      <div className="w-full lg:flex-1 bg-white rounded-lg shadow-md p-8">
        
        {/* Mobile & Tablet Header */}
        <div className="block lg:hidden mb-6">
          <Header />
        </div>

        <h2 className="text-center text-2xl font-semibold text-gray-700 mb-6">
          🎯 Total Questions Attempted:
          <span className="text-blue-600 font-bold"> {totalQuestions}</span>
        </h2>

        <Topics />
        <Mode />
      </div>
    </div>
  );
}
