'use client';

import React from 'react';

const QuestionPalette = ({
  questions,
  currentIndex,
  onQuestionClick,
  markForReview,
}) => {
  return (
    <div className="bg-[#fefefe] shadow-md rounded-2xl p-4 w-full max-w-sm border border-[#94D2BD]">
      <h2 className="text-lg font-semibold text-[#005F73] mb-3">Question Palette</h2>
      <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
        {questions.map((question, index) => {
          let bgColor = 'bg-[#E9D8A6] text-[#001219]'; // default = not attempted
          if (question.isAttempted === 'true') {
            bgColor = 'bg-[#0A9396] text-white'; // attempted
          } else if (question.isMarkedForReview) {
            bgColor = 'bg-[#EE9B00] text-white'; // marked for review
          }

          const isCurrent =
            index === currentIndex
              ? 'ring-2 ring-offset-2 ring-[#005F73]'
              : '';

          return (
            <button
              key={index}
              className={`w-10 h-10 rounded-full font-semibold flex items-center justify-center transition duration-200 ease-in-out ${bgColor} ${isCurrent}`}
              onClick={() => onQuestionClick(index)}
              onContextMenu={(e) => {
                e.preventDefault();
                markForReview(index);
              }}
              title={`Question ${index + 1}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionPalette;
