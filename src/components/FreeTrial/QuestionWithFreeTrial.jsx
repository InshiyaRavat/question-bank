import React, { useState, useEffect } from "react";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import FreeTrialRestriction from "./FreeTrialRestriction";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

// Example component showing how to integrate free trial restrictions
export default function QuestionWithFreeTrial({ topicId, question, onAnswer, onNext }) {
  const { canAttemptQuestions, recordUsage, isFreeTrial, getRemainingQuestions } = useFreeTrial();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const checkResult = canAttemptQuestions(topicId, 1);
  const remaining = getRemainingQuestions();

  const handleAnswer = async (answerIndex) => {
    if (!checkResult.allowed) {
      return; // Don't allow answering if restrictions apply
    }

    setIsSubmitting(true);
    setSelectedAnswer(answerIndex);

    try {
      // Record the usage in free trial
      if (isFreeTrial) {
        await recordUsage(topicId, 1);
      }

      // Process the answer
      const correct = answerIndex === question.correctOptionIdx;
      setIsCorrect(correct);
      setShowResult(true);

      // Call the parent handler
      if (onAnswer) {
        onAnswer(answerIndex, correct);
      }
    } catch (error) {
      console.error("Error processing answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setShowResult(false);
    setSelectedAnswer(null);
    if (onNext) {
      onNext();
    }
  };

  return (
    <div className="space-y-4">
      {/* Free Trial Restrictions */}
      <FreeTrialRestriction topicId={topicId} questionCount={1} onRefresh={() => window.location.reload()} />

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Question</CardTitle>
            {isFreeTrial && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                <Clock className="h-3 w-3 mr-1" />
                {remaining} remaining
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">{question.questionText}</p>

          <div className="space-y-2">
            {question.options.map((option, index) => (
              <Button
                key={index}
                variant={selectedAnswer === index ? "default" : "outline"}
                className={`w-full justify-start text-left h-auto p-4 ${
                  showResult
                    ? index === question.correctOptionIdx
                      ? "bg-green-100 border-green-300 text-green-800"
                      : selectedAnswer === index
                      ? "bg-red-100 border-red-300 text-red-800"
                      : "opacity-50"
                    : selectedAnswer === index
                    ? "bg-blue-100 border-blue-300"
                    : ""
                }`}
                onClick={() => handleAnswer(index)}
                disabled={!checkResult.allowed || isSubmitting || showResult}
              >
                <div className="flex items-center w-full">
                  <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                  <span className="flex-1">{option}</span>
                  {showResult && index === question.correctOptionIdx && (
                    <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
                  )}
                  {showResult && selectedAnswer === index && index !== question.correctOptionIdx && (
                    <AlertCircle className="h-4 w-4 text-red-600 ml-2" />
                  )}
                </div>
              </Button>
            ))}
          </div>

          {showResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Explanation:</h4>
              <p className="text-sm text-gray-600">{question.explanation}</p>
            </div>
          )}

          {showResult && (
            <div className="flex justify-between">
              <Button onClick={handleNext} variant="outline">
                Next Question
              </Button>
              {isFreeTrial && (
                <div className="text-sm text-gray-500 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {remaining - 1} questions remaining today
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
