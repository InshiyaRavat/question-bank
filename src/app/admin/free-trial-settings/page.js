"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Save, Settings, Users, BookOpen, AlertCircle } from "lucide-react";
import { THEME } from "@/theme";
import { toast } from "sonner";

export default function FreeTrialSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [dailyLimit, setDailyLimit] = useState(5);
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchSettings();
    fetchTopics();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/free-trial-settings");
      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);
        setDailyLimit(data.settings?.dailyQuestionLimit || 5);
        setSelectedTopics(data.settings?.allowedTopics || []);
        setIsActive(data.settings?.isActive ?? true);
        setDescription(data.settings?.description || "");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load free trial settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await fetch("/api/topics");
      const data = await response.json();

      if (data.success) {
        setTopics(data.topics || []);
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  };

  const handleSave = async () => {
    if (dailyLimit < 1) {
      toast.error("Daily question limit must be at least 1");
      return;
    }

    if (selectedTopics.length === 0) {
      toast.error("Please select at least one topic for free trial");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/free-trial-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyQuestionLimit: dailyLimit,
          allowedTopics: selectedTopics,
          isActive,
          description,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Free trial settings saved successfully");
        fetchSettings();
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleTopic = (topicId) => {
    setSelectedTopics((prev) => (prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]));
  };

  const getTopicName = (topicId) => {
    const topic = topics.find((t) => t.id === topicId);
    return topic ? topic.name : `Topic ${topicId}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: THEME.neutral900 }}>
            Free Trial Settings
          </h1>
          <p className="text-muted-foreground">Configure free trial limits and restrictions</p>
        </div>
        <Button onClick={fetchSettings} variant="outline" className="text-black cursor-pointer">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Trial Configuration
            </CardTitle>
            <CardDescription>Set daily limits and allowed topics for free trial users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Enable Free Trial</Label>
                <p className="text-sm text-muted-foreground">Allow users to access free trial features</p>
              </div>
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            </div>

            {/* Daily Question Limit */}
            <div className="space-y-2">
              <Label htmlFor="dailyLimit">Daily Question Limit</Label>
              <Input
                id="dailyLimit"
                type="number"
                min="1"
                max="100"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(parseInt(e.target.value) || 1)}
                placeholder="Number of questions per day"
              />
              <p className="text-sm text-muted-foreground">Maximum questions a free trial user can attempt per day</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description shown to free trial users"
                rows={3}
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Settings
            </Button>
          </CardContent>
        </Card>

        {/* Topic Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Allowed Topics
            </CardTitle>
            <CardDescription>Select which topics free trial users can access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Selected Topics ({selectedTopics.length})</span>
                <Button variant="outline" size="sm" onClick={() => setSelectedTopics([])}>
                  Clear All
                </Button>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTopics.includes(topic.id) ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                    }`}
                    onClick={() => toggleTopic(topic.id)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTopics.includes(topic.id)}
                        onChange={() => toggleTopic(topic.id)}
                        className="h-4 w-4"
                      />
                      <div>
                        <p className="font-medium">{topic.name}</p>
                        <p className="text-sm text-muted-foreground">{topic.noOfQuestions} questions</p>
                      </div>
                    </div>
                    {selectedTopics.includes(topic.id) && <Badge variant="default">Selected</Badge>}
                  </div>
                ))}
              </div>

              {selectedTopics.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No topics selected</p>
                  <p className="text-sm">Select topics to allow free trial access</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Settings Summary */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Current Settings Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{dailyLimit}</p>
                <p className="text-sm text-muted-foreground">Daily Questions</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{selectedTopics.length}</p>
                <p className="text-sm text-muted-foreground">Allowed Topics</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{isActive ? "Active" : "Inactive"}</p>
                <p className="text-sm text-muted-foreground">Trial Status</p>
              </div>
            </div>

            {selectedTopics.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Selected Topics:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTopics.map((topicId) => (
                    <Badge key={topicId} variant="secondary">
                      {getTopicName(topicId)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
