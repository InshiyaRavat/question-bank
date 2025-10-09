import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Clock, BookOpen, AlertTriangle, Crown, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useFreeTrial } from "@/hooks/useFreeTrial";

export default function FreeTrialRestriction({ topicId, questionCount = 1, onRefresh }) {
  const {
    canAttemptQuestions,
    isTopicAllowed,
    getRemainingQuestions,
    getDailyLimit,
    getUsedQuestions,
    isFreeTrial,
    hasSubscription,
  } = useFreeTrial();

  // If user has subscription, no restrictions
  if (hasSubscription) {
    return null;
  }

  // If not in free trial, show upgrade message
  if (!isFreeTrial) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Crown className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="flex items-center justify-between">
            <span>Get unlimited access to all questions and topics</span>
            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/subscription">Upgrade Now</Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  const checkResult = canAttemptQuestions(topicId, questionCount);
  const remaining = getRemainingQuestions();
  const dailyLimit = getDailyLimit();
  const used = getUsedQuestions();

  // If topic is not allowed
  if (!isTopicAllowed(topicId)) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <Lock className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="space-y-2">
            <p className="font-medium">This topic is not available in free trial</p>
            <p className="text-sm">
              Free trial users can only access selected topics. Upgrade to premium for full access.
            </p>
            <Button asChild size="sm" className="bg-red-600 hover:bg-red-700">
              <Link href="/subscription">Upgrade to Access All Topics</Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // If daily limit exceeded
  if (checkResult.reason === "daily_limit_exceeded") {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <Clock className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <div className="space-y-2">
            <p className="font-medium">Daily question limit reached</p>
            <p className="text-sm">You've used all {dailyLimit} questions for today. Questions reset at midnight.</p>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700">
                <Link href="/subscription">Upgrade for Unlimited Questions</Link>
              </Button>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // If insufficient remaining questions
  if (checkResult.reason === "insufficient_remaining") {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <div className="space-y-2">
            <p className="font-medium">Not enough questions remaining</p>
            <p className="text-sm">
              You want to attempt {questionCount} questions, but only {remaining} are remaining today.
            </p>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                <Link href="/subscription">Upgrade for Unlimited Questions</Link>
              </Button>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Show remaining questions info
  if (remaining <= 3 && remaining > 0) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <BookOpen className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="flex items-center justify-between">
            <span className="text-sm">
              <Badge variant="secondary" className="mr-2">
                {remaining} remaining
              </Badge>
              Only {remaining} questions left today
            </span>
            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/subscription">Upgrade for More</Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // No restrictions
  return null;
}
