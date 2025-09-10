"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, Clock, Trophy, TrendingUp, Flame } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProgressWidget() {
  const [plan, setPlan] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPlanData();
  }, []);

  const fetchPlanData = async () => {
    try {
      const [planResponse, progressResponse] = await Promise.all([
        fetch("/api/study-plan"),
        fetch("/api/progress?planId=1&days=7") // This will be dynamic
      ]);

      const planData = await planResponse.json();
      const progressData = await progressResponse.json();

      setPlan(planData.plan);
      if (planData.plan) {
        setProgress(progressData);
      }
    } catch (error) {
      console.error("Error fetching plan data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2 mb-4"></div>
            <div className="h-2 bg-slate-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-6 text-center">
          <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No Study Plan Active
          </h3>
          <p className="text-slate-600 mb-4">
            Start a structured learning journey with our study plans
          </p>
          <Button 
            onClick={() => router.push("/study-plan")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Choose Study Plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = plan.progress?.completionPercentage || 0;
  const currentDay = plan.progress?.currentDay || 1;
  const totalDays = plan.totalDays;
  const streak = plan.progress?.streak || 0;
  const completed = plan.progress?.totalCompleted || 0;
  const total = plan.totalQuestions;

  const getStreakColor = (streak) => {
    if (streak >= 30) return "text-purple-600";
    if (streak >= 14) return "text-blue-600";
    if (streak >= 7) return "text-green-600";
    return "text-orange-600";
  };

  const getMotivationalMessage = () => {
    if (progressPercentage >= 90) return "🎉 Almost there! You're doing amazing!";
    if (progressPercentage >= 70) return "💪 Great progress! Keep up the momentum!";
    if (progressPercentage >= 50) return "🔥 You're halfway there! Stay focused!";
    if (progressPercentage >= 25) return "📈 Good start! Keep building that habit!";
    return "🚀 Let's get started! Every question counts!";
  };

  return (
    <Card className="border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {plan.planType.replace("-", " ")} Plan
            </h3>
            <p className="text-sm text-slate-600">
              Day {currentDay} of {totalDays}
            </p>
          </div>
          <Badge 
            variant={plan.status === "active" ? "default" : "secondary"}
            className="text-xs"
          >
            {plan.status}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
            <span>Overall Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>{completed} completed</span>
            <span>{total - completed} remaining</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <Flame className={`h-5 w-5 mx-auto mb-1 ${getStreakColor(streak)}`} />
            <div className="text-lg font-semibold text-slate-900">
              {streak}
            </div>
            <div className="text-xs text-slate-500">Day Streak</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <Target className="h-5 w-5 text-slate-600 mx-auto mb-1" />
            <div className="text-lg font-semibold text-slate-900">
              {plan.questionsPerDay}
            </div>
            <div className="text-xs text-slate-500">Daily Goal</div>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-slate-700 text-center">
            {getMotivationalMessage()}
          </p>
        </div>

        {/* Weekly Progress */}
        {progress?.weeklyStats && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Weekly Progress</h4>
            <div className="space-y-2">
              {progress.weeklyStats.slice(-2).map((week, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Week {week.week}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">
                      {week.completed}/{week.target} questions
                    </span>
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                    >
                      {week.accuracy}% accuracy
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={() => router.push("/question-topic")}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Continue Practice
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push("/study-plan")}
            className="px-3"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Started {new Date(plan.startDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              <span>{Math.ceil((totalDays - currentDay + 1) * plan.questionsPerDay)} questions left</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
