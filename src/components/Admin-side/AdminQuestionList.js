import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { toast, ToastContainer } from "react-toastify";
import { THEME } from "@/theme";
import { DeleteIcon, Pencil, Plus, Trash2, FileText, CheckCircle, AlertTriangle, Edit3, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminQuestionList = ({ searchTerm }) => {
  const [questionList, setQuestionList] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editingFields, setEditingFields] = useState({});
  const [editValues, setEditValues] = useState({});
  const [addQuestionDialog, setAddQuestionDialog] = useState(false);
  const [topics, setTopics] = useState([]);

  // Add question form states
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", "", "", ""]);
  const [newCorrectAnswer, setNewCorrectAnswer] = useState("");
  const [newSelectedTopic, setNewSelectedTopic] = useState("");

  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    fetch(`/api/question?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => setQuestionList(data))
      .catch((err) => toast.error("Failed to fetch questions: " + err.message));
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    fetch("/api/topics")
      .then((res) => res.json())
      .then((data) => setTopics(data))
      .catch((err) => toast.error("Failed to fetch topics: " + err.message));
  }, []);

  const handleDeleteClick = (question) => {
    setSelectedQuestion(question);
    setShowDeleteModal(true);
  };

  const deleteQuestion = async (id) => {
    try {
      const res = await fetch(`/api/question/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setQuestionList((prev) => prev.filter((q) => q.id !== id));
      toast.success("Question deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete question: " + err.message);
    }
  };

  const confirmDelete = (id) => {
    deleteQuestion(id);
    setShowDeleteModal(false);
  };

  const handleAddQuestion = () => {
    setAddQuestionDialog(true);
  };

  const handleNewOptionChange = (index, value) => {
    const updatedOptions = [...newOptions];
    updatedOptions[index] = value;
    setNewOptions(updatedOptions);

    // Clear correct answer if the selected option was changed or removed
    if (newCorrectAnswer && newCorrectAnswer === newOptions[index]) {
      setNewCorrectAnswer("");
    }
  };

  const resetAddQuestionForm = () => {
    setNewQuestion("");
    setNewOptions(["", "", "", ""]);
    setNewCorrectAnswer("");
    setNewSelectedTopic("");
  };

  const handleAddNewQuestion = async () => {
    if (!newQuestion || newOptions.some((opt) => opt === "") || !newCorrectAnswer || !newSelectedTopic) {
      toast.error("Please fill in all fields.");
      return;
    }

    const answerIndex = newOptions.findIndex((opt) => opt === newCorrectAnswer);
    if (answerIndex === -1) {
      toast.error("Correct answer must match one of the options.");
      return;
    }

    const topicId = topics.find((t) => t.name === newSelectedTopic)?.id || "1";
    const questionData = {
      questionText: newQuestion,
      options: newOptions,
      correctOptionIdx: answerIndex,
      topicId,
      explanation: "",
    };

    try {
      const response = await fetch("/api/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionData),
      });

      if (!response.ok) throw new Error("Failed to add question");

      const addedQuestion = await response.json();
      setQuestionList((prev) => [...prev, addedQuestion]);
      toast.success("Question added successfully!");
      resetAddQuestionForm();
      setAddQuestionDialog(false);
    } catch (error) {
      toast.error("Failed to add question: " + error.message);
    }
  };

  const handleEdit = (question) => {
    setSelectedQuestion(question);
    setEditDialog(true);
    // Initialize edit values with current question data
    setEditValues({
      questionText: question.questionText,
      correctOptionIdx: question.correctOptionIdx,
      ...question.options.reduce(
        (acc, opt, idx) => ({
          ...acc,
          [`option-${idx}`]: opt,
        }),
        {}
      ),
    });
    setEditingFields({});
  };

  const handleFieldEdit = (field) => {
    setEditingFields((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleFieldCancel = (field) => {
    setEditingFields((prev) => ({
      ...prev,
      [field]: false,
    }));
    // Reset to original value
    if (field === "questionText") {
      setEditValues((prev) => ({ ...prev, questionText: selectedQuestion.questionText }));
    } else if (field === "correctOptionIdx") {
      setEditValues((prev) => ({ ...prev, correctOptionIdx: selectedQuestion.correctOptionIdx }));
    } else if (field.startsWith("option-")) {
      const index = parseInt(field.split("-")[1]);
      setEditValues((prev) => ({ ...prev, [field]: selectedQuestion.options[index] }));
    }
  };

  const handleFieldSave = async (field) => {
    const updated = { ...selectedQuestion };

    if (field.startsWith("option-")) {
      const index = parseInt(field.split("-")[1]);
      updated.options = [...updated.options];
      updated.options[index] = editValues[field];
    } else if (field === "correctOptionIdx") {
      updated[field] = parseInt(editValues[field]);
    } else {
      updated[field] = editValues[field];
    }

    try {
      const res = await fetch(`/api/question/${selectedQuestion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error("Update failed");

      setQuestionList((prev) => prev.map((q) => (q.id === selectedQuestion.id ? updated : q)));
      setSelectedQuestion(updated);

      toast.success("Question updated successfully!");
      setEditingFields((prev) => ({ ...prev, [field]: false }));
    } catch (err) {
      toast.error("Failed to update question: " + err.message);
    }
  };

  const handleInputChange = (field, value) => {
    setEditValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div
      className="max-w-6xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md min-h-[80vh]"
      style={{ color: THEME.neutral900 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: THEME.neutral900 }}>
          Question List
        </h2>
        <button
          onClick={handleAddQuestion}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto cursor-pointer flex items-center gap-3 group"
        >
          <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <Plus className="w-3 h-3" />
          </div>
          Create Question
        </button>
      </div>

      {/* Question List */}
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
        {questionList
          .filter((q) => q.questionText.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((q, index) => (
            <div
              key={index}
              className="p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center"
              style={{ backgroundColor: THEME.neutral50 }}
            >
              <p style={{ color: THEME.textPrimary }} className="break-words w-full sm:w-auto">
                {q.questionText}
              </p>
              <div className="flex gap-4 self-end sm:self-auto">
                <button
                  onClick={() => handleEdit(q)}
                  className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 hover:shadow-md"
                  title="Edit question"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteClick(q)}
                  className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 hover:shadow-md"
                  title="Delete question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Add Question Dialog */}
      <Dialog open={addQuestionDialog} onOpenChange={setAddQuestionDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: THEME.white }}>
          <DialogHeader className="pb-4" style={{ borderBottom: `1px solid ${THEME.neutral300}` }}>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2" style={{ color: THEME.neutral900 }}>
              <Plus className="w-5 h-5" style={{ color: THEME.primary }} />
              Add New Question
            </DialogTitle>
            <DialogDescription style={{ color: THEME.textSecondary }}>
              Create a new question with multiple choice answers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Question Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: THEME.neutral700 }}>
                Question Text
              </label>
              <Textarea
                rows={4}
                placeholder="Enter your question here..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="w-full p-3 border rounded-md text-sm resize-none"
                style={{
                  borderColor: THEME.neutral300,
                  backgroundColor: THEME.white,
                  color: THEME.textPrimary,
                }}
              />
            </div>

            {/* Options Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium" style={{ color: THEME.neutral700 }}>
                Answer Options
              </label>
              <div className="grid gap-3">
                {newOptions.map((opt, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: THEME.primary }}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <Input
                      type="text"
                      placeholder={`Enter option ${String.fromCharCode(65 + index)} here...`}
                      value={opt}
                      onChange={(e) => handleNewOptionChange(index, e.target.value)}
                      className="flex-1 text-sm"
                      style={{
                        borderColor: THEME.neutral300,
                        backgroundColor: THEME.white,
                        color: THEME.textPrimary,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Correct Answer & Topic Row */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Correct Answer */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: THEME.neutral700 }}>
                  Correct Answer
                </label>
                <Select
                  value={newCorrectAnswer}
                  onValueChange={setNewCorrectAnswer}
                  disabled={newOptions.every((opt) => opt.trim() === "")}
                >
                  <SelectTrigger
                    className={`w-full ${
                      newOptions.every((opt) => opt.trim() === "") ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    style={{
                      borderColor: THEME.neutral300,
                      backgroundColor: THEME.white,
                      color: THEME.textPrimary,
                    }}
                  >
                    <SelectValue
                      placeholder={
                        newOptions.every((opt) => opt.trim() === "")
                          ? "Fill in options first..."
                          : "Choose correct answer..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {newOptions
                      .filter((opt, index) => opt.trim() !== "")
                      .map((opt, index) => {
                        const originalIndex = newOptions.findIndex((o) => o === opt);
                        return (
                          <SelectItem key={originalIndex} value={opt}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                style={{ backgroundColor: THEME.primary }}
                              >
                                {String.fromCharCode(65 + originalIndex)}
                              </div>
                              <span>{opt}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    {newOptions.every((opt) => opt.trim() === "") && (
                      <div className="p-3 text-center text-sm" style={{ color: THEME.textSecondary }}>
                        Please fill in the options above first
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Topic Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: THEME.neutral700 }}>
                  Topic Category
                </label>
                <Select value={newSelectedTopic} onValueChange={setNewSelectedTopic}>
                  <SelectTrigger
                    className="w-full"
                    style={{
                      borderColor: THEME.neutral300,
                      backgroundColor: THEME.white,
                      color: THEME.textPrimary,
                    }}
                  >
                    <SelectValue placeholder="Select topic..." />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.name}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter style={{ borderTop: `1px solid ${THEME.neutral300}` }} className="pt-4">
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => setAddQuestionDialog(false)}
                style={{ borderColor: THEME.neutral300, color: THEME.textSecondary }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddNewQuestion}
                style={{ backgroundColor: THEME.primary }}
                className="flex-1 text-white hover:opacity-90"
              >
                Create Question
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: THEME.white }}>
          <DialogHeader className="pb-4" style={{ borderBottom: `1px solid ${THEME.neutral300}` }}>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2" style={{ color: THEME.neutral900 }}>
              <Edit3 className="w-5 h-5" style={{ color: THEME.primary }} />
              Edit Question
            </DialogTitle>
            <DialogDescription style={{ color: THEME.textSecondary }}>
              Click on any field to edit it inline
            </DialogDescription>
          </DialogHeader>

          {selectedQuestion && (
            <div className="space-y-4 py-4">
              {/* Question Text */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: THEME.neutral700 }}>
                  Question Text
                </label>
                {editingFields.questionText ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editValues.questionText}
                      onChange={(e) => handleInputChange("questionText", e.target.value)}
                      rows={3}
                      className="w-full p-3 border rounded-md text-sm"
                      style={{
                        borderColor: THEME.neutral300,
                        backgroundColor: THEME.white,
                        color: THEME.textPrimary,
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleFieldSave("questionText")}
                        style={{ backgroundColor: THEME.primary }}
                        className="text-white hover:opacity-90"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFieldCancel("questionText")}
                        style={{ borderColor: THEME.neutral300, color: THEME.textSecondary }}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => handleFieldEdit("questionText")}
                    className="p-3 border rounded-md cursor-pointer hover:shadow-sm transition-shadow"
                    style={{
                      borderColor: THEME.neutral300,
                      backgroundColor: THEME.neutral50,
                      color: THEME.textPrimary,
                    }}
                  >
                    <p className="text-sm">{selectedQuestion.questionText}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: THEME.textSecondary }}>
                      <Edit3 className="w-3 h-3" />
                      Click to edit
                    </div>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="text-sm font-medium" style={{ color: THEME.neutral700 }}>
                  Answer Options
                </label>
                <div className="grid gap-2">
                  {selectedQuestion.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: THEME.primary }}
                      >
                        {String.fromCharCode(65 + idx)}
                      </div>
                      {editingFields[`option-${idx}`] ? (
                        <div className="flex-1 flex gap-2">
                          <Input
                            value={editValues[`option-${idx}`]}
                            onChange={(e) => handleInputChange(`option-${idx}`, e.target.value)}
                            className="flex-1 text-sm"
                            style={{
                              borderColor: THEME.neutral300,
                              backgroundColor: THEME.white,
                              color: THEME.textPrimary,
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleFieldSave(`option-${idx}`)}
                            style={{ backgroundColor: THEME.primary }}
                            className="text-white hover:opacity-90"
                          >
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFieldCancel(`option-${idx}`)}
                            style={{ borderColor: THEME.neutral300, color: THEME.textSecondary }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleFieldEdit(`option-${idx}`)}
                          className="flex-1 p-2 border rounded cursor-pointer hover:shadow-sm transition-shadow flex items-center justify-between"
                          style={{
                            borderColor: THEME.neutral300,
                            backgroundColor: THEME.neutral50,
                            color: THEME.textPrimary,
                          }}
                        >
                          <span className="text-sm">{opt}</span>
                          <Edit3 className="w-3 h-3" style={{ color: THEME.textSecondary }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Correct Answer */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: THEME.neutral700 }}>
                  Correct Answer
                </label>
                {editingFields.correctOptionIdx ? (
                  <div className="space-y-2">
                    <Select
                      value={editValues.correctOptionIdx?.toString()}
                      onValueChange={(value) => handleInputChange("correctOptionIdx", parseInt(value))}
                    >
                      <SelectTrigger
                        className="w-full"
                        style={{
                          borderColor: THEME.neutral300,
                          backgroundColor: THEME.white,
                          color: THEME.textPrimary,
                        }}
                      >
                        <SelectValue placeholder="Select correct option" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedQuestion.options.map((opt, idx) => (
                          <SelectItem key={idx} value={idx.toString()}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                style={{ backgroundColor: THEME.primary }}
                              >
                                {String.fromCharCode(65 + idx)}
                              </div>
                              <span>{opt}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleFieldSave("correctOptionIdx")}
                        style={{ backgroundColor: THEME.primary }}
                        className="text-white hover:opacity-90"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFieldCancel("correctOptionIdx")}
                        style={{ borderColor: THEME.neutral300, color: THEME.textSecondary }}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => handleFieldEdit("correctOptionIdx")}
                    className="p-3 border rounded-md cursor-pointer hover:shadow-sm transition-shadow"
                    style={{
                      borderColor: THEME.neutral300,
                      backgroundColor: THEME.neutral50,
                      color: THEME.textPrimary,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: THEME.success }}
                      >
                        {String.fromCharCode(65 + selectedQuestion.correctOptionIdx)}
                      </div>
                      <span className="text-sm">{selectedQuestion.options[selectedQuestion.correctOptionIdx]}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: THEME.textSecondary }}>
                      <Edit3 className="w-3 h-3" />
                      Click to change
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter style={{ borderTop: `1px solid ${THEME.neutral300}` }} className="pt-4">
            <Button
              variant="outline"
              onClick={() => setEditDialog(false)}
              style={{ borderColor: THEME.neutral300, color: THEME.textSecondary }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-2xl" style={{ backgroundColor: THEME.white }}>
          <DialogHeader className="pb-4" style={{ borderBottom: `1px solid ${THEME.neutral300}` }}>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2" style={{ color: THEME.error }}>
              <AlertTriangle className="w-5 h-5" />
              Delete Question
            </DialogTitle>
            <DialogDescription style={{ color: THEME.textSecondary }}>
              This action cannot be undone. Please confirm you want to permanently delete this question.
            </DialogDescription>
          </DialogHeader>

          {selectedQuestion && (
            <div className="py-4">
              <div
                className="p-4 border rounded-lg"
                style={{
                  backgroundColor: THEME.neutral50,
                  borderColor: THEME.neutral300,
                }}
              >
                <h4 className="font-medium mb-2" style={{ color: THEME.neutral900 }}>
                  Question to be deleted:
                </h4>
                <p
                  className="text-sm leading-relaxed p-3 border rounded"
                  style={{
                    backgroundColor: THEME.white,
                    borderColor: THEME.neutral300,
                    color: THEME.textPrimary,
                  }}
                >
                  {selectedQuestion.questionText}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {selectedQuestion.options.map((opt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm p-2 border rounded"
                      style={{
                        backgroundColor: THEME.white,
                        borderColor: THEME.neutral300,
                        color: idx === selectedQuestion.correctOptionIdx ? THEME.success : THEME.textPrimary,
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: THEME.primary }}
                      >
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className={idx === selectedQuestion.correctOptionIdx ? "font-semibold" : ""}>{opt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="mt-4 p-3 border rounded-lg flex items-start gap-2"
                style={{
                  backgroundColor: "#fef3c7",
                  borderColor: "#f59e0b",
                }}
              >
                <AlertTriangle className="w-4 h-4 mt-0.5" style={{ color: THEME.warning }} />
                <div>
                  <span className="font-medium text-sm" style={{ color: "#92400e" }}>
                    Warning:
                  </span>
                  <p className="text-sm mt-1" style={{ color: "#92400e" }}>
                    This question will be permanently removed and cannot be recovered.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter style={{ borderTop: `1px solid ${THEME.neutral300}` }} className="pt-4">
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                style={{ borderColor: THEME.neutral300, color: THEME.textSecondary }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => confirmDelete(selectedQuestion?.id)}
                style={{ backgroundColor: THEME.error }}
                className="flex-1 text-white hover:opacity-90"
              >
                Delete Question
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ToastContainer />
    </div>
  );
};

export default AdminQuestionList;
