"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, Clock, Trophy, Zap } from "lucide-react";
import UserSidebar from "@/components/UserSidebar";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Menu, X } from "lucide-react";

export default function StudyPlanPage() {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
    try {
      const response = await fetch("/api/study-plan");
      const data = await response.json();
      setCurrentPlan(data.plan);
    } catch (error) {
      console.error("Error fetching study plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const createStudyPlan = async (planType) => {
    setCreating(true);
    try {
      // First, get total questions count
      const questionsResponse = await fetch("/api/question?count=true");
      const questionsData = await questionsResponse.json();
      const totalQuestions = questionsData.total || 16; // Fallback to 16

      let totalDays, questionsPerDay;

      switch (planType) {
        case "25-day":
          totalDays = 25;
          questionsPerDay = Math.ceil(totalQuestions / 25);
          break;
        case "50-day":
          totalDays = 50;
          questionsPerDay = Math.ceil(totalQuestions / 50);
          break;
        case "custom":
          totalDays = 30; // Default for custom
          questionsPerDay = Math.ceil(totalQuestions / 30);
          break;
        default:
          throw new Error("Invalid plan type");
      }

      const response = await fetch("/api/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType,
          totalDays,
          totalQuestions,
          questionsPerDay
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Study plan created successfully!");
        setCurrentPlan(data.plan);
        router.push("/dashboard");
      } else {
        toast.error(data.error || "Failed to create study plan");
      }
    } catch (error) {
      console.error("Error creating study plan:", error);
      toast.error("Failed to create study plan");
    } finally {
      setCreating(false);
    }
  };

  const planOptions = [
    {
      id: "25-day",
      title: "25-Day Intensive",
      description: "Fast-paced learning for quick mastery",
      icon: Zap,
      color: "from-red-500 to-pink-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      features: [
        "Intensive daily practice",
        "Quick completion",
        "Perfect for exam prep"
      ]
    },
    {
      id: "50-day",
      title: "50-Day Balanced",
      description: "Steady progress with manageable daily goals",
      icon: Target,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      features: [
        "Balanced daily workload",
        "Sustainable pace",
        "Thorough understanding"
      ]
    },
    {
      id: "custom",
      title: "Self-Practice",
      description: "Flexible learning at your own pace",
      icon: Clock,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      features: [
        "Complete flexibility",
        "No pressure",
        "Learn when you want"
      ]
    }
  ];

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 w-full relative">
        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button variant="outline" size="sm" onClick={toggleSidebar} className="bg-white shadow-md">
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
        {/* Sidebar */}
        <div
          className={`
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
              lg:translate-x-0
              fixed lg:sticky lg:top-0
              w-64 flex-shrink-0 h-full
              transition-transform duration-300 ease-in-out
              z-40
              lg:z-auto
            `}
        >
          <UserSidebar />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (currentPlan) {
    return (
      <div className="flex h-screen bg-slate-50 w-full relative">
        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button variant="outline" size="sm" onClick={toggleSidebar} className="bg-white shadow-md">
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
        {/* Sidebar */}
        <div
          className={`
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
              lg:translate-x-0
              fixed lg:sticky lg:top-0
              w-64 flex-shrink-0 h-full
              transition-transform duration-300 ease-in-out
              z-40
              lg:z-auto
            `}
        >
          <UserSidebar />
        </div>
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Current Study Plan
              </h1>
              <p className="text-slate-600">
                You already have an active study plan
              </p>
            </div>

            <Card className="border-slate-200">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 capitalize">
                      {currentPlan.planType.replace("-", " ")} Plan
                    </h2>
                    <p className="text-slate-600">
                      Started {new Date(currentPlan.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={currentPlan.status === "active" ? "default" : "secondary"}
                    className="text-lg px-4 py-2"
                  >
                    {currentPlan.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {currentPlan.progress?.currentDay || 1}
                    </div>
                    <div className="text-sm text-slate-600">Current Day</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {currentPlan.progress?.totalCompleted || 0}
                    </div>
                    <div className="text-sm text-slate-600">Questions Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {currentPlan.progress?.completionPercentage || 0}%
                    </div>
                    <div className="text-sm text-slate-600">Progress</div>
                  </div>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${currentPlan.progress?.completionPercentage || 0}%` }}
                  ></div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => router.push("/question-topic")}
                    className="flex-1"
                  >
                    Continue Practice
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                  >
                    View Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 w-full relative">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="sm" onClick={toggleSidebar} className="bg-white shadow-md">
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>
      {/* Sidebar */}
      <div
        className={`
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
              lg:translate-x-0
              fixed lg:sticky lg:top-0
              w-64 flex-shrink-0 h-full
              transition-transform duration-300 ease-in-out
              z-40
              lg:z-auto
            `}
      >
        <UserSidebar />
      </div>
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Choose Your Study Plan
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Select a structured learning path that fits your schedule and goals.
              We&apos;ll help you stay on track with daily practice sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {planOptions.map((plan) => {
              const IconComponent = plan.icon;
              return (
                <Card
                  key={plan.id}
                  className={`${plan.borderColor} hover:shadow-xl transition-all duration-300 cursor-pointer group`}
                  onClick={() => createStudyPlan(plan.id)}
                >
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 mx-auto mb-6 rounded-full ${plan.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`h-8 w-8 bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`} />
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 mb-3">
                      {plan.title}
                    </h3>

                    <p className="text-slate-600 mb-6">
                      {plan.description}
                    </p>

                    <ul className="text-left space-y-2 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-slate-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white`}
                      disabled={creating}
                    >
                      {creating ? "Creating..." : "Start Plan"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <div className="bg-slate-100 rounded-lg p-6 max-w-2xl mx-auto">
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Track Your Progress
              </h3>
              <p className="text-slate-600">
                Get daily reminders, track your streak, earn achievements, and see your improvement over time.
                Stay motivated with our comprehensive progress tracking system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
