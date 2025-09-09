"use client";
import React, { useState, useEffect, useContext } from "react";
import { useUser } from "@clerk/nextjs";
import { SelectedTopicsContext } from "@/context/SelectedTopicsContext";
import CountdownTimer from "../Timer/CountdownTimer";
import Stopwatch from "../Timer/Stopwatch";
import QuestionPalette from "./QuestionPalette";
import Comment from "../Comment/Comment";
import FlagQuestion from "./FlagQuestion";
import { useRouter } from "next/navigation";
import ReportIssueModal from "@/components/Feedback/ReportIssueModal";
import { useSearchParams } from "next/navigation";

const Question = (props) => {
  const [questions, setQuestions] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [type, setType] = useState();
  const [stopwatch, setStopwatch] = useState();
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [correctQuestions, setCorrectQuestions] = useState([]);
  const [incorrectQuestions, setIncorrectQuestions] = useState([]);
  const { isLoaded, isSignedIn, user } = useUser();
  const { selectedTopics } = useContext(SelectedTopicsContext);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isRetest, setIsRetest] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const router = useRouter();
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    const topicIds = Object.keys(selectedTopics).filter((id) => selectedTopics[id]);

    if (!isRetest) {
      const queryParams = new URLSearchParams();
      queryParams.append("userId", user.id);
      topicIds.forEach((id) => queryParams.append("topicId", id));

      const queryString = queryParams.toString();

      fetch(`/api/question?${queryString}`)
        .then((res) => res.json())
        .then((data) => {
          const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, 50);
          setQuestions(shuffled);

          // Create a new test session for non-practice modes
          if (type !== "practice") {
            const questionIds = shuffled.map((q) => q.id);
            createTestSession(questionIds);
          }
        })
        .catch((err) => console.error("Error fetching questions:", err));
    }
  }, [isLoaded, isSignedIn, user, selectedTopics, isRetest, type]);

  const searchParams = useSearchParams();

  useEffect(() => {
    const queryType = searchParams.get("type");
    const sw = searchParams.get("stopwatch");
    const sessionId = searchParams.get("sessionId");

    setType(queryType);
    setStopwatch(sw);

    if (sessionId) {
      setIsRetest(true);
      setCurrentSessionId(sessionId);
      handleRetestSession(sessionId);
    }
  }, [searchParams]);

  // Helper function to create a new test session
  const createTestSession = async (questionIds) => {
    try {
      const response = await fetch("/api/test-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testType: type,
          questionIds,
          totalQuestions: questionIds.length,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSessionId(data.session.sessionId);
        console.log("Test session created:", data.session.sessionId);
      }
    } catch (error) {
      console.error("Error creating test session:", error);
    }
  };

  // Helper function to handle retest session
  const handleRetestSession = async (sessionId) => {
    try {
      const response = await fetch(`/api/test-session/${sessionId}/retest`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        const questionIds = data.session.questionIds;

        // Fetch questions by IDs
        const questionsResponse = await fetch(`/api/question-by-ids`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: questionIds }),
        });

        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json();
          setQuestions(questionsData);
          setCurrentSessionId(data.session.sessionId);
        }
      }
    } catch (error) {
      console.error("Error handling retest session:", error);
    }
  };

  // Helper function to update test session
  const updateTestSession = async (score, correctCount, incorrectCount, status = "completed") => {
    if (!currentSessionId) return;

    try {
      await fetch("/api/test-session", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSessionId,
          score,
          correctCount,
          incorrectCount,
          status,
        }),
      });
    } catch (error) {
      console.error("Error updating test session:", error);
    }
  };

  if (!questions) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#E9D8A6]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#0A9396]"></div>
      </div>
    );
  }

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
      setHasSubmitted(false);
      setShowExplanation(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedOption(null);
      setIsCorrect(null);
      setHasSubmitted(false);
      setShowExplanation(false);
    }
  };

  const handleOptionChange = (event) => {
    setSelectedOption(parseInt(event.target.value));
  };

  const handleSubmit = async () => {
    const correctIndex = questions[currentIndex].correctOptionIdx;
    const isAnswerCorrect = selectedOption === correctIndex;
    setIsCorrect(isAnswerCorrect);
    setHasSubmitted(true);

    if (isAnswerCorrect) {
      setScore((prev) => prev + 1);
      setCorrectCount((prev) => prev + 1);
      setCorrectQuestions((prev) => [...prev, questions[currentIndex].questionText]);
    } else {
      setIncorrectCount((prev) => prev + 1);
      setIncorrectQuestions((prev) => [...prev, questions[currentIndex].questionText]);
    }

    await fetch(`/api/solved-question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        questionId: questions[currentIndex].id,
        isCorrect: isAnswerCorrect,
      }),
    });

    const updatedQuestions = [...questions];
    updatedQuestions[currentIndex].isAttempted = "true";
    setQuestions(updatedQuestions);

    await fetch("/api/attempted-question", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        topicId: questions[currentIndex].topicId,
      }),
    });
  };

  const toggleExplanation = () => setShowExplanation((prev) => !prev);

  const handleQuestionClick = (index) => {
    setCurrentIndex(index);
    setSelectedOption(null);
    setIsCorrect(null);
    setHasSubmitted(false);
    setShowExplanation(false);
  };

  const markForReview = (index) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].isMarkedForReview = true;
    setQuestions(updatedQuestions);
  };

  if (type === "practice" && currentIndex >= questions.length) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#E9D8A6]">
        <h2 className="text-xl font-semibold text-[#001219]">
          Practice session completed! You attempted all questions.
        </h2>
      </div>
    );
  }

  const currentQuestion = questions && questions.length > 0 ? questions[currentIndex] : null;

  if (!currentQuestion) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#E9D8A6]">
        <div className="text-[#005F73] text-lg">Loading question...</div>
      </div>
    );
  }

  function endTest() {
    // Update the test session if it exists
    if (currentSessionId && type !== "practice") {
      updateTestSession(score, correctCount, incorrectCount, "completed");
    }

    localStorage.setItem("correctQuestions", correctQuestions);
    localStorage.setItem("incorrectQuestions", incorrectQuestions);

    const params = new URLSearchParams({
      score: score.toString(),
      incorrectCount: incorrectCount.toString(),
      correctCount: correctCount.toString(),
      type: type,
    });

    if (currentSessionId) {
      params.append("sessionId", currentSessionId);
    }

    router.push(`/result?${params.toString()}`);
  }

  return (
    <div className="flex flex-col text-[#001219]">
      <header className="flex justify-between items-center bg-[#0A9396] text-white px-6 py-4 shadow mb-4">
        <h1 className="text-xl font-bold">{type === "practice" ? "Practice Mode" : "Test Mode"}</h1>
        <button
          className="bg-[#AE2012] hover:bg-[#9B2226] text-white font-semibold py-2 px-4 rounded-lg"
          onClick={endTest}
        >
          End {type === "practice" ? "Practice" : "Test"}
        </button>
      </header>

      {(type === "timed" || (type === "practice" && stopwatch === "on")) && (
        <div className="w-full flex justify-center py-4">
          {type === "timed" ? (
            <CountdownTimer
              correctCount={correctCount}
              incorrectCount={incorrectCount}
              correctQuestions={correctQuestions}
              incorrectQuestions={incorrectQuestions}
              score={score}
              initialTimer={100}
            />
          ) : (
            <Stopwatch />
          )}
        </div>
      )}

      <main className="flex flex-grow flex-col items-center px-4">
        <div className="flex flex-col lg:flex-row w-full max-w-6xl gap-6">
          <div className="bg-white shadow-lg rounded-xl p-6 flex-grow w-full lg:w-3/4">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-xl font-semibold text-[#005F73] flex-grow">{currentQuestion.questionText}</h4>
              <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                <button
                  className="bg-[#9B2226] text-white font-semibold py-1.5 px-3 rounded-md hover:bg-[#AE2012]"
                  onClick={() => setReportOpen(true)}
                >
                  Report Issue
                </button>
                <FlagQuestion questionId={currentQuestion.id} />
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedOption === index;
                const isAnswer = index === currentQuestion.correctOptionIdx;
                const isIncorrect = hasSubmitted && !isAnswer && isSelected;
                const isCorrectAnswer = isAnswer && hasSubmitted;
                const isTestMode = type === "timed" || type === "untimed";

                const bgClass = isSelected
                  ? !isTestMode && isCorrectAnswer
                    ? "bg-[#94D2BD] border-[#0A9396]"
                    : !isTestMode && isIncorrect
                    ? "bg-[#EE9B00] border-[#CA6702]"
                    : "bg-[#E9D8A6] border-[#BB3E03]"
                  : !isTestMode && isAnswer && hasSubmitted
                  ? "bg-[#94D2BD] border-[#0A9396]"
                  : "bg-white border-gray-300";

                return (
                  <label
                    key={index}
                    className={`block p-4 border rounded-lg cursor-pointer transition-all duration-200 ${bgClass} hover:bg-[#f4f4f4]`}
                  >
                    <input
                      type="radio"
                      name="options"
                      value={index}
                      className="mr-3 hidden"
                      onChange={handleOptionChange}
                      checked={selectedOption === index}
                      disabled={hasSubmitted}
                    />
                    {option}
                  </label>
                );
              })}
            </div>

            <div className="flex flex-wrap justify-between items-center gap-4">
              <button
                className={`bg-[#005F73] text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-transform hover:scale-105 ${
                  selectedOption === null && "bg-opacity-50 cursor-not-allowed"
                }`}
                onClick={handleSubmit}
                disabled={selectedOption === null || hasSubmitted}
              >
                Submit
              </button>

              <div className="flex flex-wrap gap-3">
                {type === "practice" && (
                  <button
                    onClick={toggleExplanation}
                    className="bg-[#CA6702] text-white font-semibold py-2 px-4 rounded-lg hover:bg-[#BB3E03]"
                  >
                    {showExplanation ? "Hide Explanation" : "Show Explanation"}
                  </button>
                )}

                {(type === "timed" || type === "untimed") && (
                  <button
                    className="bg-[#EE9B00] text-white font-semibold py-2 px-4 rounded-lg hover:bg-[#CA6702]"
                    onClick={() => markForReview(currentIndex)}
                  >
                    Mark for Review
                  </button>
                )}

                <button
                  className="bg-[#94D2BD] text-[#001219] font-semibold py-2 px-4 rounded-lg hover:bg-[#e0f7f5]"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  Previous
                </button>

                <button
                  className="bg-[#94D2BD] text-[#001219] font-semibold py-2 px-4 rounded-lg hover:bg-[#e0f7f5]"
                  onClick={handleNext}
                >
                  Next Question
                </button>
              </div>
            </div>

            {showExplanation && type === "practice" && (
              <div className="mt-6 p-4 bg-[#f9f9f9] rounded-lg text-[#001219] border-l-4 border-[#0A9396]">
                <p>{currentQuestion.explanation}</p>
              </div>
            )}
          </div>

          <aside className="w-full lg:w-1/3">
            {type !== "practice" ? (
              <div>
                <QuestionPalette
                  questions={questions}
                  currentIndex={currentIndex}
                  onQuestionClick={handleQuestionClick}
                  markForReview={markForReview}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-4">
                <Comment questionid={questions[currentIndex].id} />
              </div>
            )}
          </aside>
        </div>
      </main>

      <ReportIssueModal
        questionId={currentQuestion?.id}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </div>
  );
};

export default Question;
