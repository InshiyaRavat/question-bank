'use client'
import React, { useState, useEffect, useContext } from 'react'
import { useUser } from '@clerk/nextjs'
import { SelectedTopicsContext } from '@/context/SelectedTopicsContext'
import CountdownTimer from './CountdownTimer'
import Stopwatch from './Stopwatch'
import QuestionPalette from './QuestionPalette'
import Comment from './Comment'
import { useRouter } from 'next/navigation';

const Question = (props) => {
  const [questions, setQuestions] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [type, setType] = useState()
  const [stopwatch, setStopwatch] = useState()
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const [correctQuestions, setCorrectQuestions] = useState([])
  const [incorrectQuestions, setIncorrectQuestions] = useState([])
  const { isLoaded, isSignedIn, user } = useUser()
  const { selectedTopics } = useContext(SelectedTopicsContext)
  const [showExplanation, setShowExplanation] = useState(false)
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    console.log("selectedTopics:", selectedTopics); 
    const topicIds = Object.keys(selectedTopics).filter(id => selectedTopics[id]);
    console.log("Filtered topicIds:", topicIds);
    const queryParams = new URLSearchParams();
    queryParams.append('userId', user.id);
    topicIds.forEach(id => queryParams.append('topicId', id));

    const queryString = queryParams.toString();

    fetch(`/api/question?${queryString}`)
      .then(res => res.json())
      .then(data => {
        setQuestions(data);
      })
      .catch(err => console.error("Error fetching questions:", err));
  }, [isLoaded, isSignedIn, user, selectedTopics]);


  console.log("Questions:", questions);

  if (!questions) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    )
  }

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1)
      setSelectedOption(null)
      setIsCorrect(null)
      setHasSubmitted(false)
      setShowExplanation(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setSelectedOption(null)
      setIsCorrect(null)
      setHasSubmitted(false)
      setShowExplanation(false)
    }
  }

  const handleOptionChange = (event) => {
    setSelectedOption(parseInt(event.target.value))
  }

  const handleSubmit = async () => {
    const correctIndex = questions[currentIndex].correctOptionIdx
    const isAnswerCorrect = selectedOption === correctIndex
    setIsCorrect(isAnswerCorrect)
    setHasSubmitted(true)

    if (isAnswerCorrect) {
      setScore(prev => prev + 1)
      setCorrectCount(prev => prev + 1)
      setCorrectQuestions(prev => [...prev, questions[currentIndex].questionText])
    } else {
      setIncorrectCount(prev => prev + 1)
      setIncorrectQuestions(prev => [...prev, questions[currentIndex].questionText])
    }

    await fetch(`/api/solved-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        questionId: questions[currentIndex].id,
        isCorrect: isAnswerCorrect,
      }),
    })

    const updatedQuestions = [...questions];
    updatedQuestions[currentIndex].isAttempted = 'true';
    setQuestions(updatedQuestions);

    // Increment the questionsAttempted count for this topic and user
    await fetch('/api/attempted-question', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        topicId: questions[currentIndex].topicId, // Ensure this is a number
      }),
    });
    // handleNext();
  }

  const toggleExplanation = () => setShowExplanation(prev => !prev)

  const handleQuestionClick = (index) => {
    setCurrentIndex(index)
    setSelectedOption(null)
    setIsCorrect(null)
    setHasSubmitted(false)
    setShowExplanation(false)
  }

  const markForReview = (index) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index].isMarkedForReview = true
    setQuestions(updatedQuestions)
  }

  if (type === 'practice' && currentIndex >= questions.length) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-700">
          Practice session completed! You attempted all 50 questions.
        </h2>
      </div>
    )
  }

  const currentQuestion = questions && questions.length > 0 ? questions[currentIndex] : null;

  if (!currentQuestion) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-gray-700 text-lg">Loading question...</div>
      </div>
    );
  }

  function endTest() {
    localStorage.setItem('correctQuestions', correctQuestions);
    localStorage.setItem('incorrectQuestions', incorrectQuestions);
    router.push(`/Result?score=${score}&incorrectCount=${incorrectCount}&correctCount=${correctCount}`);
  }
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex justify-between items-center bg-blue-600 text-white px-6 py-4 shadow-md">
        <h1 className="text-xl font-bold">
          {type === 'practice' ? 'Practice Mode' : 'Test Mode'}
        </h1>
        <button
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-transform duration-200 transform hover:scale-105 focus:ring-2 focus:ring-red-300"
          onClick={endTest}
        >
          End {type === 'practice' ? 'Practice' : 'Test'}
        </button>
      </header>

      {/* Timer */}
      {(type === 'timed' || (type === 'practice' && stopwatch === 'on')) && (
        <div className="w-full flex justify-center py-4">
          {type === 'timed' ? (
            <CountdownTimer correctCount={correctCount} incorrectCount={incorrectCount} correctQuestions={correctQuestions} incorrectQuestions={incorrectQuestions} score={score} initialTimer={100} />
          ) : (
            <Stopwatch />
          )}
        </div>
      )}

      {/* Main Content */}
      <main className="flex flex-grow flex-col items-center px-4">
        <div className="flex flex-col lg:flex-row w-full max-w-6xl gap-6">
          {/* Question Section */}
          <div className="bg-white shadow-lg rounded-xl p-6 flex-grow w-full lg:w-3/4">

            {/* Question */}
            <h4 className="text-xl font-semibold text-center text-blue-700 mb-4">
              {currentQuestion.questionText}
            </h4>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedOption === index;
                const isAnswer = index === currentQuestion.correctOptionIdx;
                const isIncorrect = hasSubmitted && !isAnswer && isSelected;
                const isCorrectAnswer = isAnswer && hasSubmitted;
                const isTestMode = type === 'timed' || type === 'untimed';

                const bgClass = isSelected
                  ? !isTestMode && isCorrectAnswer
                    ? 'bg-green-100 border-green-500'
                    : !isTestMode && isIncorrect
                      ? 'bg-red-100 border-red-500'
                      : 'bg-blue-100 border-blue-500'
                  : !isTestMode && isAnswer && hasSubmitted
                    ? 'bg-green-100 border-green-500'
                    : 'bg-white border-gray-300';

                return (
                  <label
                    key={index}
                    className={`block p-4 border rounded-lg cursor-pointer transition-all duration-200 ${bgClass} hover:bg-blue-50 text-gray-700`}
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

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-between items-center gap-4">
              <button
                className={`bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-transform duration-200 hover:scale-105 focus:ring-2 focus:ring-blue-300 ${selectedOption === null && 'bg-blue-100 cursor-not-allowed'
                  }`}
                onClick={handleSubmit}
                disabled={selectedOption === null || hasSubmitted}
              >
                Submit
              </button>

              <div className="flex flex-wrap gap-3">
                {type === 'practice' && (
                  <button
                    onClick={toggleExplanation}
                    className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-300"
                  >
                    {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
                  </button>
                )}

                {(type === 'timed' || type === 'untimed') && (
                  <button
                    className="bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-300"
                    onClick={() => markForReview(currentIndex)}
                  >
                    Mark for Review
                  </button>
                )}

                <button
                  className="bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-gray-600 focus:ring-2 focus:ring-gray-300"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  Previous
                </button>

                <button
                  className="bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-gray-600 focus:ring-2 focus:ring-gray-300"
                  onClick={handleNext}
                >
                  Next Question
                </button>
              </div>
            </div>

            {/* Explanation Section */}
            {showExplanation && type === 'practice' && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg text-gray-700 border-l-4 border-blue-500">
                <p>{currentQuestion.explanation}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-1/3">
            {type !== 'practice' ? (
              <div className="bg-white rounded-xl shadow-md p-4">
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
    </div>

  )
}

export default Question
