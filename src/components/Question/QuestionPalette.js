'use client';

import React from 'react';

const QuestionPalette = ({
  questions,
  currentIndex,
  onQuestionClick,
  markForReview,
}) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-4 w-full max-w-sm">
      <div className="grid grid-cols-5 gap-2">
        {questions.map((question, index) => {
          let bgColor = 'bg-gray-400'; 

          if (question.isAttempted === 'true') {
            bgColor = 'bg-green-500'; 
          } else if (question.isMarkedForReview) {
            bgColor = 'bg-yellow-500';
          }

          const isCurrent = index === currentIndex ? 'border-2 border-blue-500' : '';

          return (
            <button
              key={index}
              className={`w-10 h-10 text-white rounded-full font-bold flex items-center justify-center ${bgColor} ${isCurrent}`}
              onClick={() => onQuestionClick(index)}
              onContextMenu={(e) => {
                e.preventDefault();
                markForReview(index);
              }}
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
