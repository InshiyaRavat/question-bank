"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, Zap, BookOpen } from "lucide-react";

export default function QuestionCountSelector({ 
  onStartPractice, 
  onClose, 
  selectedTopics = {},
  currentPlan = null 
}) {
  const [questionCount, setQuestionCount] = useState(10);
  const [totalQuestions, setTotalQuestions] = useState(16);
  const [estimatedTime, setEstimatedTime] = useState(10);

  useEffect(() => {
    // Get total available questions
    fetchTotalQuestions();
  }, [selectedTopics]);

  useEffect(() => {
    // Calculate estimated time (2 minutes per question)
    setEstimatedTime(Math.ceil(questionCount * 2));
  }, [questionCount]);

  const fetchTotalQuestions = async () => {
    try {
      const topicIds = Object.keys(selectedTopics).filter(id => selectedTopics[id]);
      const params = new URLSearchParams();
      topicIds.forEach(id => params.append("topicId", id));
      params.append("count", "true");
      
      const response = await fetch(`/api/question?${params.toString()}`);
      const data = await response.json();
      setTotalQuestions(data.total || 16);
    } catch (error) {
      console.error("Error fetching total questions:", error);
    }
  };

  const getRecommendedCount = () => {
    if (!currentPlan) return 10;
    
    const remainingDays = currentPlan.totalDays - (currentPlan.progress?.currentDay || 1) + 1;
    const remainingQuestions = currentPlan.totalQuestions - (currentPlan.progress?.totalCompleted || 0);
    
    if (remainingDays <= 0) return Math.min(remainingQuestions, 20);
    
    return Math.ceil(remainingQuestions / remainingDays);
  };

  const getDifficultyLevel = (count) => {
    if (count <= 5) return { level: "Easy", color: "bg-green-100 text-green-800", icon: BookOpen };
    if (count <= 15) return { level: "Medium", color: "bg-yellow-100 text-yellow-800", icon: Target };
    if (count <= 25) return { level: "Hard", color: "bg-orange-100 text-orange-800", icon: Zap };
    return { level: "Intense", color: "bg-red-100 text-red-800", icon: Zap };
  };

  const difficulty = getDifficultyLevel(questionCount);
  const DifficultyIcon = difficulty.icon;
  const recommendedCount = getRecommendedCount();

  const handleStart = () => {
    onStartPractice(questionCount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Practice Session Setup
            </h2>
            <p className="text-slate-600">
              Choose how many questions you want to practice
            </p>
          </div>

          {currentPlan && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-blue-900">
                    {currentPlan.planType.replace("-", " ")} Plan
                  </div>
                  <div className="text-xs text-blue-700">
                    Day {currentPlan.progress?.currentDay || 1} of {currentPlan.totalDays}
                  </div>
                </div>
                <Badge variant="outline" className="text-blue-600">
                  Recommended: {recommendedCount}
                </Badge>
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-slate-700">
                Number of Questions
              </label>
              <div className="flex items-center gap-2">
                <Badge className={difficulty.color}>
                  <DifficultyIcon className="h-3 w-3 mr-1" />
                  {difficulty.level}
                </Badge>
              </div>
            </div>
            
            <div className="px-4">
              <Slider
                value={[questionCount]}
                onValueChange={(value) => setQuestionCount(value[0])}
                min={1}
                max={Math.min(totalQuestions, 50)}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>1</span>
                <span className="text-lg font-semibold text-slate-900">
                  {questionCount} questions
                </span>
                <span>{Math.min(totalQuestions, 50)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <Clock className="h-5 w-5 text-slate-600 mx-auto mb-1" />
              <div className="text-sm font-medium text-slate-900">
                {estimatedTime} min
              </div>
              <div className="text-xs text-slate-500">Estimated time</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <Target className="h-5 w-5 text-slate-600 mx-auto mb-1" />
              <div className="text-sm font-medium text-slate-900">
                {totalQuestions}
              </div>
              <div className="text-xs text-slate-500">Available questions</div>
            </div>
          </div>

          {currentPlan && (
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-slate-600 mb-2">Today's Progress</div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  {currentPlan.progress?.totalCompleted || 0} / {currentPlan.totalQuestions} completed
                </div>
                <div className="text-xs text-slate-500">
                  {Math.round(((currentPlan.progress?.totalCompleted || 0) / currentPlan.totalQuestions) * 100)}%
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.round(((currentPlan.progress?.totalCompleted || 0) / currentPlan.totalQuestions) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStart}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Start Practice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
