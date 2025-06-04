'use client';
import { THEME } from '@/theme';
import React, { useEffect, useState } from 'react';

export default function Result() {
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [correctQuestions, setCorrectQuestions] = useState([]);
  const [incorrectQuestions, setIncorrectQuestions] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setScore(parseInt(params.get('score') || '0'));
    setCorrect(parseInt(params.get('correctCount') || '0'));
    setIncorrect(parseInt(params.get('incorrectCount') || '0'));

    setCorrectQuestions(() => {
      const stored = localStorage.getItem('correctQuestions');
      return stored ? stored.split(',') : [];
    });

    setIncorrectQuestions(() => {
      const stored = localStorage.getItem('incorrectQuestions');
      return stored ? stored.split(',') : [];
    });
  }, []);

  const percentage = ((score / 50) * 100).toFixed(2);

  return (
    <div className={`flex items-center justify-center min-h-screen bg-gradient-to-br from-[${THEME.primary_1}] via-[${THEME.secondary_1}] to-[${THEME.secondary_2}] p-6`}>
      <div className={`bg-[#F9F6F1] shadow-2xl rounded-2xl p-10 max-w-2xl w-full text-center space-y-6 border border-[${THEME.secondary_3}]`}>
        <h1 className={`text-3xl font-extrabold text-[${THEME.primary_3}]`}>🎉 Quiz Completed!</h1>

        <div className="flex flex-col items-center gap-4">
          <div className={`text-4xl font-bold text-[${THEME.secondary_6}]`}>
            ⭐ {score} / 50
          </div>
          <p className={`text-lg text-[${THEME.primary_4}] font-medium`}>Total Score</p>

          <div className="w-full flex justify-around mt-4">
            <div className={`bg-[${THEME.primary_1}] text-[${THEME.primary_4}] rounded-xl px-4 py-2 shadow font-semibold`}>
              ✅ Correct: {correct}
            </div>
            <div className={`bg-[${THEME.secondary_2}] text-[${THEME.primary_4}] rounded-xl px-4 py-2 shadow font-semibold`}>
              ❌ Incorrect: {incorrect}
            </div>
            <div className={`bg-[${THEME.secondary_1}] text-[${THEME.primary_4}] rounded-xl px-4 py-2 shadow font-semibold`}>
              ❓ Unattempted: {50 - (correct + incorrect)}
            </div>
          </div>

          <div className={`mt-4 text-sm text-[${THEME.primary_3}] font-semibold`}>
            Accuracy: <span className={`text-[${THEME.secondary_5}]`}>{percentage}%</span>
          </div>
        </div>

        {correctQuestions.length > 0 && (
          <div className="mt-8 text-left">
            <h2 className={`text-lg font-semibold text-[${THEME.primary_2}] mb-2`}>✅ Correct Questions:</h2>
            <div className="flex flex-wrap gap-2">
              {correct > 0 ? correctQuestions.map((q, idx) => (
                <span
                  key={idx}
                  className={`px-3 py-1 bg-[${THEME.primary_1}] text-[${THEME.primary_4}] rounded-full text-sm font-medium shadow`}
                >
                  {q}
                </span>
              )) : (
                <span className={`px-3 py-1 bg-[${THEME.secondary_1}] text-[${THEME.primary_4}] rounded-full text-sm font-medium shadow`}>
                  No correct questions
                </span>
              )}
            </div>
          </div>
        )}

        {incorrectQuestions.length > 0 && (
          <div className="mt-6 text-left">
            <h2 className={`text-lg font-semibold text-[${THEME.secondary_3}] mb-2`}>❌ Incorrect Questions:</h2>
            <div className="flex flex-wrap gap-2">
              {incorrect > 0 ? incorrectQuestions.map((q, idx) => (
                <span
                  key={idx}
                  className={`px-3 py-1 bg-[${THEME.secondary_2}] text-[${THEME.primary_4}] rounded-full text-sm font-medium shadow`}
                >
                  {q}
                </span>
              )) : (
                <span className={`px-3 py-1 bg-[${THEME.secondary_1}] text-[${THEME.primary_4}] rounded-full text-sm font-medium shadow`}>
                  No incorrect questions
                </span>
              )}
            </div>
          </div>
        )}

        <button
          className={`mt-10 px-6 py-3 bg-[${THEME.primary_2}] text-white rounded-lg font-semibold hover:bg-[${THEME.primary_3}] transition shadow-md`}
          onClick={() => window.location.href = '/QuestionTopic'}
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}
