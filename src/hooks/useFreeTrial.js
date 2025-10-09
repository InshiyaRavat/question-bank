import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export function useFreeTrial() {
  const { user, isLoaded } = useUser();
  const [freeTrialStatus, setFreeTrialStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFreeTrialStatus = async () => {
    if (!isLoaded || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/free-trial/status");
      const data = await response.json();

      if (data.success) {
        setFreeTrialStatus(data);
      } else {
        setError(data.error || "Failed to fetch free trial status");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const recordUsage = async (topicId, questionCount = 1) => {
    if (!freeTrialStatus?.isFreeTrial) {
      return { success: false, error: "Not in free trial" };
    }

    try {
      const response = await fetch("/api/free-trial/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, questionsCount: questionCount }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setFreeTrialStatus((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            questionsUsed: data.usage.totalUsed,
            questionsRemaining: data.usage.remaining,
          },
        }));
      }

      return data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const canAttemptQuestions = (topicId, questionCount = 1) => {
    if (!freeTrialStatus?.isFreeTrial) {
      return { allowed: false, reason: "not_free_trial" };
    }

    const { settings } = freeTrialStatus;

    // Check if topic is allowed
    if (!settings.allowedTopics.some((topic) => topic.id === topicId)) {
      return {
        allowed: false,
        reason: "topic_not_allowed",
        message: "This topic is not available in free trial",
      };
    }

    // Check if user has remaining questions
    if (settings.questionsRemaining <= 0) {
      return {
        allowed: false,
        reason: "daily_limit_exceeded",
        message: `Daily limit of ${settings.dailyQuestionLimit} questions reached`,
      };
    }

    // Check if requested count exceeds remaining
    if (questionCount > settings.questionsRemaining) {
      return {
        allowed: false,
        reason: "insufficient_remaining",
        message: `Only ${settings.questionsRemaining} questions remaining today`,
      };
    }

    return { allowed: true };
  };

  const isTopicAllowed = (topicId) => {
    if (!freeTrialStatus?.isFreeTrial) return true; // No restrictions for subscribed users
    return freeTrialStatus.settings.allowedTopics.some((topic) => topic.id === topicId);
  };

  const getRemainingQuestions = () => {
    if (!freeTrialStatus?.isFreeTrial) return null;
    return freeTrialStatus.settings.questionsRemaining;
  };

  const getDailyLimit = () => {
    if (!freeTrialStatus?.isFreeTrial) return null;
    return freeTrialStatus.settings.dailyQuestionLimit;
  };

  const getUsedQuestions = () => {
    if (!freeTrialStatus?.isFreeTrial) return null;
    return freeTrialStatus.settings.questionsUsed;
  };

  useEffect(() => {
    fetchFreeTrialStatus();
  }, [isLoaded, user?.id]);

  return {
    freeTrialStatus,
    loading,
    error,
    refresh: fetchFreeTrialStatus,
    recordUsage,
    canAttemptQuestions,
    isTopicAllowed,
    getRemainingQuestions,
    getDailyLimit,
    getUsedQuestions,
    isFreeTrial: freeTrialStatus?.isFreeTrial || false,
    hasSubscription: freeTrialStatus?.hasSubscription || false,
  };
}
