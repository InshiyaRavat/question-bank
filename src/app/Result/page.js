'use client';
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

    const parseList = (str) =>
      str
        .split(',')
        .map((item) => parseInt(item.trim()))
        .filter((n) => !isNaN(n));

        setCorrectQuestions(() => {
          const stored = localStorage.getItem('correctQuestions');
          return stored.split(',');
        });
        
        setIncorrectQuestions(() => {
          const stored = localStorage.getItem('incorrectQuestions');
          return stored.split(',');
        });
        
  }, []);

  console.log('Correct Questions:', correctQuestions[0]);
    console.log('Incorrect Questions:', incorrectQuestions);
  const percentage = ((score / 50) * 100).toFixed(2);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-6">
      <div className="bg-white shadow-2xl rounded-2xl p-10 max-w-2xl w-full text-center space-y-6">
        <h1 className="text-3xl font-extrabold text-blue-700">🎉 Quiz Completed!</h1>

        <div className="flex flex-col items-center gap-4">
          <div className="text-4xl font-bold text-purple-600">
            ⭐ {score} / 50
          </div>
          <p className="text-lg text-gray-700">Total Score</p>

          <div className="w-full flex justify-around mt-4">
            <div className="bg-green-100 text-green-700 rounded-xl px-4 py-2 shadow font-semibold">
              ✅ Correct: {correct}
            </div>
            <div className="bg-red-100 text-red-700 rounded-xl px-4 py-2 shadow font-semibold">
              ❌ Incorrect: {incorrect}
            </div>
            <div className="bg-gray-100 text-gray-600 rounded-xl px-4 py-2 shadow font-semibold">
            ❓ Unattempted: {50 - (correct+incorrect)}
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Accuracy: <span className="text-blue-600 font-semibold">{percentage}%</span>
          </div>
        </div>

        {correctQuestions.length > 0 && (
          <div className="mt-8 text-left">
            <h2 className="text-lg font-semibold text-green-700 mb-2">✅ Correct Questions:</h2>
            <div className="flex flex-wrap gap-2">
              {correct > 0? correctQuestions.map((q, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium shadow"
                >
                  {q}
                </span>
              )): (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium shadow">
                  No correct questions
                </span>
              )}
            </div>
          </div>
        )}

        {incorrectQuestions.length > 0 && (
          <div className="mt-6 text-left">
            <h2 className="text-lg font-semibold text-red-700 mb-2">❌ Incorrect Questions:</h2>
            <div className="flex flex-wrap gap-2">
              { incorrect > 0?incorrectQuestions.map((q, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium shadow"
                >
                  {q}
                </span>
              )) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium shadow">
                  No incorrect questions
                </span>
              )}
            </div>
          </div>
        )}

        <button
          className="mt-10 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
          onClick={() => window.location.href = '/QuestionTopic'}
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}
