"use client";
import { THEME } from "@/theme";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import EndTestFeedback from "@/components/Feedback/EndTestFeedback";

export default function Result() {
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [correctQuestions, setCorrectQuestions] = useState([]);
  const [incorrectQuestions, setIncorrectQuestions] = useState([]);
  const [retestOption, setRetestOption] = useState(false);
  const [type, setType] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [testSession, setTestSession] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setScore(parseInt(params.get("score") || "0"));
    setCorrect(parseInt(params.get("correctCount") || "0"));
    setIncorrect(parseInt(params.get("incorrectCount") || "0"));
    setType(params.get("type"));
    setSessionId(params.get("sessionId") || "");

    setCorrectQuestions(() => {
      const stored = localStorage.getItem("correctQuestions");
      return stored ? stored.split(",") : [];
    });

    setIncorrectQuestions(() => {
      const stored = localStorage.getItem("incorrectQuestions");
      return stored ? stored.split(",") : [];
    });

    // Fetch test session details if sessionId is available
    const fetchSessionDetails = async () => {
      const sessionIdParam = params.get("sessionId");
      if (sessionIdParam) {
        try {
          const response = await fetch(`/api/test-session?sessionId=${sessionIdParam}`);
          if (response.ok) {
            const data = await response.json();
            if (data.sessions && data.sessions.length > 0) {
              setTestSession(data.sessions[0]);
            }
          }
        } catch (error) {
          console.error("Error fetching session details:", error);
        }
      }
    };

    fetchSessionDetails();
  }, []);

  const totalQuestions = testSession ? testSession.totalQuestions : (correct + incorrect);
  const percentage = totalQuestions > 0 ? ((score / totalQuestions) * 100).toFixed(2) : 0;

  const handleRetest = () => {
    if (sessionId) {
      router.push(`/questions?type=${type}&sessionId=${sessionId}`);
    } else {
      // Fallback to old system
      router.push(`/questions?type=${type}&retest=true`);
    }
  };

  return (
    <div className={`flex items-center justify-center min-h-screen bg-blue-200 p-6`}>
      <div className={`bg-[#F9F6F1] shadow-2xl rounded-2xl p-10 max-w-2xl w-full text-center space-y-6 border`}>
        <h1 className={`text-3xl font-extrabold`} style={{ color: THEME.textPrimary }}>
          🎉 Quiz Completed!
        </h1>

        {testSession && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <strong>Test Type:</strong> {testSession.testType}
              </p>
              <p>
                <strong>Started:</strong> {new Date(testSession.startedAt).toLocaleString()}
              </p>
              {testSession.completedAt && (
                <p>
                  <strong>Completed:</strong> {new Date(testSession.completedAt).toLocaleString()}
                </p>
              )}
              {testSession.retestCount > 0 && (
                <p>
                  <strong>Attempt:</strong> #{testSession.retestCount + 1}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-4">
          <div className={`text-4xl font-bold`} style={{ color: THEME.textPrimary }}>
            ⭐ {score} / {totalQuestions}
          </div>
          <p className={`text-lg font-medium`} style={{ color: THEME.textSecondary }}>
            Total Score
          </p>

          <div className="w-full flex justify-around mt-4">
            <div className={`bg-green-100 rounded-xl px-4 py-2 shadow font-semibold`} style={{ color: THEME.success }}>
              ✅ Correct: {correct}
            </div>
            <div className={`bg-red-100 rounded-xl px-4 py-2 shadow font-semibold`} style={{ color: THEME.error }}>
              ❌ Incorrect: {incorrect}
            </div>
            <div className={`bg-amber-100 rounded-xl px-4 py-2 shadow font-semibold`} style={{ color: THEME.warning }}>
              ❓ Unattempted: {totalQuestions - (correct + incorrect)}
            </div>
          </div>

          <div className={`mt-4 text-sm font-semibold`} style={{ color: THEME.textPrimary }}>
            Accuracy: <span style={{ color: THEME.textPrimary }}>{percentage}%</span>
          </div>
        </div>

        {correctQuestions.length > 0 && (
          <div className="mt-8 text-left">
            <h2 className={`text-lg font-semibold mb-2`} style={{ color: THEME.textPrimary }}>
              ✅ Correct Questions:
            </h2>
            <div className="flex flex-wrap gap-2">
              {correct > 0 ? (
                correctQuestions.map((q, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1 rounded-full text-sm font-medium shadow`}
                    style={{ color: THEME.textPrimary }}
                  >
                    {q}
                  </span>
                ))
              ) : (
                <span
                  className={`px-3 py-1 bg-red-100 rounded-full text-sm font-medium shadow`}
                  style={{ color: THEME.error }}
                >
                  No correct questions
                </span>
              )}
            </div>
          </div>
        )}

        {incorrectQuestions.length > 0 && (
          <div className="mt-6 text-left">
            <h2 className={`text-lg font-semibold mb-2`} style={{ color: THEME.error }}>
              ❌ Incorrect Questions:
            </h2>
            <div className="flex flex-wrap gap-2">
              {incorrect > 0 ? (
                incorrectQuestions.map((q, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1 bg-red-100 rounded-full text-sm font-medium shadow`}
                    style={{ color: THEME.error }}
                  >
                    {q}
                  </span>
                ))
              ) : (
                <span className={`px-3 py-1 rounded-full text-sm font-medium shadow`} style={{ color: THEME.warning }}>
                  No incorrect questions
                </span>
              )}
            </div>
          </div>
        )}

        <button
          className={`mt-10 px-6 py-3 bg-blue-200 text-black cursor-pointer rounded-lg font-semibold hover:bg-blue-400 transition shadow-md`}
          onClick={() => (window.location.href = "/question-topic")}
        >
          Go to Home
        </button>

        {type != "practice" && (
          <button
            className={`mt-4 px-6 py-3 bg-[${THEME.secondary_5}] text-white rounded-lg font-semibold hover:bg-[${THEME.secondary_6}] transition shadow-md`}
            onClick={handleRetest}
          >
            Retest
          </button>
        )}

        <div className="mt-8 text-left">
          <h3 className="text-lg font-semibold mb-2">Share feedback (optional)</h3>
          <EndTestFeedback />
        </div>
      </div>
    </div>
  );
}
