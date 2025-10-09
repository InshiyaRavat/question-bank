import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, BookOpen, Lock, CheckCircle, AlertCircle, Crown, RefreshCw } from "lucide-react";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import Link from "next/link";

export default function FreeTrialStatus() {
  const { freeTrialStatus, loading, error, refresh, isFreeTrial, hasSubscription } = useFreeTrial();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading free trial status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Error loading free trial status: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasSubscription) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <Crown className="h-5 w-5 mr-2" />
            Premium Access
          </CardTitle>
          <CardDescription className="text-green-700">
            You have an active subscription with full access to all features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Unlimited questions and all topics available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isFreeTrial) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <BookOpen className="h-5 w-5 mr-2" />
            Free Trial Not Available
          </CardTitle>
          <CardDescription className="text-blue-700">
            Free trial is currently not available. Please check back later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/subscription">View Subscription Plans</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { settings } = freeTrialStatus;
  const progressPercentage = (settings.questionsUsed / settings.dailyQuestionLimit) * 100;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-800">
          <Clock className="h-5 w-5 mr-2" />
          Free Trial
        </CardTitle>
        <CardDescription className="text-orange-700">{settings.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Daily Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Daily Questions</span>
            <span className="text-orange-700">
              {settings.questionsUsed} / {settings.dailyQuestionLimit}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-orange-600">
            <span>Used today</span>
            <span>{settings.questionsRemaining} remaining</span>
          </div>
        </div>

        {/* Allowed Topics */}
        <div className="space-y-2">
          <div className="flex items-center text-sm font-medium text-orange-800">
            <BookOpen className="h-4 w-4 mr-2" />
            Available Topics ({settings.allowedTopics.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {settings.allowedTopics.map((topic) => (
              <Badge key={topic.id} variant="secondary" className="bg-orange-100 text-orange-800">
                {topic.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Restrictions Notice */}
        <div className="flex items-start p-3 bg-orange-100 rounded-lg">
          <Lock className="h-4 w-4 mr-2 mt-0.5 text-orange-600 flex-shrink-0" />
          <div className="text-sm text-orange-700">
            <p className="font-medium mb-1">Free Trial Limitations:</p>
            <ul className="space-y-1 text-xs">
              <li>• Limited to {settings.dailyQuestionLimit} questions per day</li>
              <li>
                • Only {settings.allowedTopics.length} topic{settings.allowedTopics.length !== 1 ? "s" : ""} available
              </li>
              <li>• Questions reset daily at midnight</li>
            </ul>
          </div>
        </div>

        {/* Upgrade Button */}
        <div className="pt-2">
          <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
            <Link href="/subscription">Upgrade to Premium</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
