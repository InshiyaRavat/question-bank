"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  FileText,
  File,
  BookOpen,
  Filter,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";
import { toast } from "sonner";
import UserSidebar from "@/components/UserSidebar";

export default function StudyMaterialPage() {
  const { user, isLoaded } = useUser();
  const [topics, setTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filters, setFilters] = useState({
    format: 'pdf',
    includeAllTopics: true,
    onlyWrongAnswers: false,
    includeExplanations: true
  });

  useEffect(() => {
    if (isLoaded && user) {
      fetchTopics();
    }
  }, [isLoaded, user]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/topics');
      const topics = await response.json();

      if (Array.isArray(topics)) {
        // Get question counts for each topic
        const topicsWithCounts = await Promise.all(
          topics.map(async (topic) => {
            const questionCount = await fetch(`/api/questions/count?topicId=${topic.id}`)
              .then(res => res.json())
              .then(data => data.count || 0)
              .catch(() => 0);

            return { ...topic, questionCount };
          })
        );

        setTopics(topicsWithCounts);
      } else {
        toast.error("Failed to fetch topics");
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
      toast.error("Error fetching topics");
    } finally {
      setLoading(false);
    }
  };

  const handleTopicToggle = (topicId) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTopics.length === topics.length) {
      setSelectedTopics([]);
    } else {
      setSelectedTopics(topics.map(topic => topic.id));
    }
  };

  const handleGenerate = async () => {
    if (!filters.includeAllTopics && selectedTopics.length === 0) {
      toast.error("Please select at least one topic");
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/study-material', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: filters.format,
          topicIds: selectedTopics,
          includeAllTopics: filters.includeAllTopics,
          onlyWrongAnswers: filters.onlyWrongAnswers,
          includeExplanations: filters.includeExplanations
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const extension = filters.format === 'pdf' ? 'pdf' : 'docx';
        a.download = `study-material-${new Date().toISOString().split('T')[0]}.${extension}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success("Study material generated successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to generate study material");
      }
    } catch (error) {
      console.error("Error generating study material:", error);
      toast.error("Error generating study material");
    } finally {
      setGenerating(false);
    }
  };

  const getTotalQuestions = () => {
    if (filters.includeAllTopics) {
      return topics.reduce((sum, topic) => sum + topic.questionCount, 0);
    }
    return topics
      .filter(topic => selectedTopics.includes(topic.id))
      .reduce((sum, topic) => sum + topic.questionCount, 0);
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
            <p>Please log in to access study materials.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white w-full relative">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 h-full">
        <UserSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Material Generator</h1>
            <p className="text-gray-600">Download comprehensive study materials in PDF or Word format</p>
          </div>

          <Tabs defaultValue="settings" className="space-y-6">
            <TabsList>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="topics">Select Topics</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Generation Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Format Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Output Format</label>
                    <Select value={filters.format} onValueChange={(value) => setFilters(prev => ({ ...prev, format: value }))}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            PDF Document
                          </div>
                        </SelectItem>
                        <SelectItem value="word">
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4" />
                            Word Document
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Topic Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Topic Selection</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeAllTopics"
                          checked={filters.includeAllTopics}
                          onCheckedChange={(checked) => setFilters(prev => ({
                            ...prev,
                            includeAllTopics: checked,
                            onlyWrongAnswers: checked ? false : prev.onlyWrongAnswers
                          }))}
                        />
                        <label htmlFor="includeAllTopics" className="text-sm font-medium">
                          Include all topics
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="onlyWrongAnswers"
                          checked={filters.onlyWrongAnswers}
                          onCheckedChange={(checked) => setFilters(prev => ({
                            ...prev,
                            onlyWrongAnswers: checked,
                            includeAllTopics: checked ? false : prev.includeAllTopics
                          }))}
                        />
                        <label htmlFor="onlyWrongAnswers" className="text-sm font-medium">
                          Only questions I got wrong (for revision)
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Content Options */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Content Options</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeExplanations"
                          checked={filters.includeExplanations}
                          onCheckedChange={(checked) => setFilters(prev => ({ ...prev, includeExplanations: checked }))}
                        />
                        <label htmlFor="includeExplanations" className="text-sm font-medium">
                          Include explanations
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="topics" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Select Topics
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedTopics.length === topics.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {topics.map((topic) => (
                        <div
                          key={topic.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedTopics.includes(topic.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                          onClick={() => handleTopicToggle(topic.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={selectedTopics.includes(topic.id)}
                              onChange={() => handleTopicToggle(topic.id)}
                            />
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{topic.name}</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {topic.questionCount} questions
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Generation Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">Format</div>
                        <div className="font-medium">
                          {filters.format === 'pdf' ? 'PDF Document' : 'Word Document'}
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">Topics</div>
                        <div className="font-medium">
                          {filters.includeAllTopics ? 'All Topics' : `${selectedTopics.length} Selected`}
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">Questions</div>
                        <div className="font-medium">{getTotalQuestions()}</div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">Content</div>
                        <div className="font-medium">
                          {filters.onlyWrongAnswers ? 'Wrong Answers Only' : 'All Questions'}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">What&apos;s included:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Cover page with your name and generation date
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Table of contents
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          All questions with correct answers highlighted
                        </li>
                        {filters.includeExplanations && (
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Detailed explanations for each question
                          </li>
                        )}
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Professional formatting with proper pagination
                        </li>
                      </ul>
                    </div>

                    <Button
                      onClick={handleGenerate}
                      disabled={generating || (!filters.includeAllTopics && selectedTopics.length === 0)}
                      className="w-full"
                      size="lg"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      {generating ? 'Generating...' : 'Generate Study Material'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
