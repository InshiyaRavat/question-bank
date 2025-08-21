import { useState } from "react";
import { toast } from "react-toastify";
import { Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { THEME } from "@/theme";
import { useTheme } from "@/context/ThemeContext";

export default function QuestionList({ questions: initialQuestions }) {
  const { colors } = useTheme();
  const [questions, setQuestions] = useState(initialQuestions);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editingFields, setEditingFields] = useState({});
  const [editValues, setEditValues] = useState({});

  const handleDeleteClick = (question) => {
    setSelectedQuestion(question);
    setShowDeleteModal(true);
  };

  const deleteQuestion = async (id) => {
    try {
      const res = await fetch(`/api/question/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      toast.success("Question deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete question: " + err.message);
    }
  };

  const confirmDelete = (id) => {
    deleteQuestion(id);
    setShowDeleteModal(false);
  };

  const handleEdit = (question) => {
    setSelectedQuestion(question);
    setEditDialog(true);
    setEditValues({
      questionText: question.questionText,
      explanation: question.explanation || "",
      difficulty: question.difficulty || "medium",
      tagsString: Array.isArray(question.tags) ? question.tags.join(", ") : "",
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
    if (field === "questionText") {
      setEditValues((prev) => ({ ...prev, questionText: selectedQuestion.questionText }));
    } else if (field === "correctOptionIdx") {
      setEditValues((prev) => ({ ...prev, correctOptionIdx: selectedQuestion.correctOptionIdx }));
    } else if (field === "explanation") {
      setEditValues((prev) => ({ ...prev, explanation: selectedQuestion.explanation || "" }));
    } else if (field === "difficulty") {
      setEditValues((prev) => ({ ...prev, difficulty: selectedQuestion.difficulty || "medium" }));
    } else if (field === "tagsString") {
      setEditValues((prev) => ({
        ...prev,
        tagsString: Array.isArray(selectedQuestion.tags) ? selectedQuestion.tags.join(", ") : "",
      }));
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
    } else if (field === "explanation") {
      updated.explanation = editValues.explanation;
    } else if (field === "difficulty") {
      updated.difficulty = editValues.difficulty || "medium";
    } else if (field === "tagsString") {
      const parsed = (editValues.tagsString || "")
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      updated.tags = parsed;
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

      setQuestions((prev) => prev.map((q) => (q.id === selectedQuestion.id ? updated : q)));
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
    <>
      <div className="bg-surface border-t" style={{ borderColor: colors.neutral200 }}>
        {questions.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-secondary">No questions in this topic yet</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: colors.neutral200 }}>
            {questions.map((question, index) => (
              <div key={question.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Question Number */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-blue-600">Q{index + 1}</span>
                    </div>

                    {/* Question Text */}
                    <p className="text-sm mb-3 text-primary">{question.questionText}</p>

                    {/* Options */}
                    <div className="space-y-1 mb-3">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`text-xs p-2 rounded ${optIndex === question.correctOptionIdx
                            ? "bg-green-100 text-green-800 font-medium"
                            : "bg-white"
                            }` || optIndex !== question.correctOptionIdx ? "text-secondary" : ""}
                        >
                          <span className="font-medium mr-2">{String.fromCharCode(65 + optIndex)}:</span>
                          {option}
                          {optIndex === question.correctOptionIdx && (
                            <span className="ml-2 text-green-600">✓ Correct</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="text-xs p-2 bg-blue-50 rounded text-secondary">
                        <span className="font-medium">Explanation: </span>
                        {question.explanation}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(question)} className="p-1 hover:bg-gray-200 rounded">
                      <Edit className="h-4 w-4 text-secondary" />
                    </button>
                    <button onClick={() => handleDeleteClick(question)} className="p-1 hover:bg-red-100 rounded">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-surface">
          <DialogHeader className="pb-4" style={{ borderBottom: `1px solid ${colors.neutral300}` }}>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2 text-primary">
              <Edit className="w-5 h-5" style={{ color: colors.primary }} />
              Edit Question
            </DialogTitle>
            <DialogDescription className="text-secondary">Click on any field to edit it inline</DialogDescription>
          </DialogHeader>

          {selectedQuestion && (
            <div className="space-y-4 py-4">
              {/* Question Text */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">
                  Question Text
                </label>
                {editingFields.questionText ? (
                  <div className="space-y-2">
                    <Input
                      value={editValues.questionText}
                      onChange={(e) => handleInputChange("questionText", e.target.value)}
                      className="w-full text-sm"
                      style={{
                        borderColor: colors.neutral300,
                        backgroundColor: colors.surface,
                        color: colors.textPrimary,
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleFieldSave("questionText")}
                        style={{ backgroundColor: colors.primary }}
                        className="text-white hover:opacity-90"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFieldCancel("questionText")}
                        style={{ borderColor: colors.neutral300, color: THEME.textSecondary }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => handleFieldEdit("questionText")}
                    className="p-3 border rounded-md cursor-pointer hover:shadow-sm transition-shadow"
                    style={{
                      borderColor: colors.neutral300,
                      backgroundColor: colors.neutral50,
                      color: colors.textPrimary,
                    }}
                  >
                    <p className="text-sm">{selectedQuestion.questionText}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-secondary">
                      <Edit className="w-3 h-3" />
                      Click to edit
                    </div>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-primary">
                  Answer Options
                </label>
                <div className="grid gap-2">
                  {selectedQuestion.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: colors.primary }}
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
                              borderColor: colors.neutral300,
                              backgroundColor: colors.surface,
                              color: colors.textPrimary,
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleFieldSave(`option-${idx}`)}
                            style={{ backgroundColor: colors.primary }}
                            className="text-white hover:opacity-90"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFieldCancel(`option-${idx}`)}
                            style={{ borderColor: colors.neutral300, color: THEME.textSecondary }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleFieldEdit(`option-${idx}`)}
                          className="flex-1 p-2 border rounded cursor-pointer hover:shadow-sm transition-shadow flex items-center justify-between"
                          style={{
                            borderColor: colors.neutral300,
                            backgroundColor: colors.neutral50,
                            color: colors.textPrimary,
                          }}
                        >
                          <span className="text-sm">{opt}</span>
                          <Edit className="w-3 h-3 text-secondary" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">
                  Explanation
                </label>
                {editingFields.explanation ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editValues.explanation}
                      onChange={(e) => handleInputChange("explanation", e.target.value)}
                      rows={4}
                      className="w-full p-3 border rounded-md text-sm"
                      style={{
                        borderColor: colors.neutral300,
                        backgroundColor: colors.surface,
                        color: colors.textPrimary,
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleFieldSave("explanation")}
                        style={{ backgroundColor: colors.primary }}
                        className="text-white hover:opacity-90"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFieldCancel("explanation")}
                        style={{ borderColor: colors.neutral300, color: THEME.textSecondary }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => handleFieldEdit("explanation")}
                    className="p-3 border rounded-md cursor-pointer hover:shadow-sm transition-shadow"
                    style={{
                      borderColor: colors.neutral300,
                      backgroundColor: colors.neutral50,
                      color: colors.textPrimary,
                    }}
                  >
                    <p className="text-sm whitespace-pre-line">
                      {selectedQuestion.explanation || "No explanation provided."}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-secondary">
                      Click to edit
                    </div>
                  </div>
                )}
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">
                  Difficulty
                </label>
                {editingFields.difficulty ? (
                  <div className="space-y-2">
                    <Select value={editValues.difficulty} onValueChange={(v) => handleInputChange("difficulty", v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleFieldSave("difficulty")}
                        style={{ backgroundColor: colors.primary }}
                        className="text-white hover:opacity-90"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFieldCancel("difficulty")}
                        style={{ borderColor: colors.neutral300, color: THEME.textSecondary }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => handleFieldEdit("difficulty")}
                    className="p-3 border rounded-md cursor-pointer hover:shadow-sm transition-shadow"
                    style={{
                      borderColor: colors.neutral300,
                      backgroundColor: colors.neutral50,
                      color: colors.textPrimary,
                    }}
                  >
                    <p className="text-sm capitalize">{selectedQuestion.difficulty || "medium"}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-secondary">
                      Click to edit
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">
                  Tags (comma-separated)
                </label>
                {editingFields.tagsString ? (
                  <div className="space-y-2">
                    <Input
                      value={editValues.tagsString}
                      onChange={(e) => handleInputChange("tagsString", e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleFieldSave("tagsString")}
                        style={{ backgroundColor: colors.primary }}
                        className="text-white hover:opacity-90"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFieldCancel("tagsString")}
                        style={{ borderColor: colors.neutral300, color: THEME.textSecondary }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => handleFieldEdit("tagsString")}
                    className="p-3 border rounded-md cursor-pointer hover:shadow-sm transition-shadow"
                    style={{
                      borderColor: colors.neutral300,
                      backgroundColor: colors.neutral50,
                      color: colors.textPrimary,
                    }}
                  >
                    <p className="text-sm">
                      {Array.isArray(selectedQuestion.tags) && selectedQuestion.tags.length
                        ? selectedQuestion.tags.join(", ")
                        : "No tags"}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-secondary">
                      Click to edit
                    </div>
                  </div>
                )}
              </div>

              {/* Correct Answer */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">
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
                          borderColor: colors.neutral300,
                          backgroundColor: colors.surface,
                          color: colors.textPrimary,
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
                                style={{ backgroundColor: colors.primary }}
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
                        style={{ backgroundColor: colors.primary }}
                        className="text-white hover:opacity-90"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFieldCancel("correctOptionIdx")}
                        style={{ borderColor: colors.neutral300, color: THEME.textSecondary }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => handleFieldEdit("correctOptionIdx")}
                    className="p-3 border rounded-md cursor-pointer hover:shadow-sm transition-shadow"
                    style={{
                      borderColor: colors.neutral300,
                      backgroundColor: colors.neutral50,
                      color: colors.textPrimary,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: colors.success }}
                      >
                        {String.fromCharCode(65 + selectedQuestion.correctOptionIdx)}
                      </div>
                      <span className="text-sm">{selectedQuestion.options[selectedQuestion.correctOptionIdx]}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-secondary">
                      <Edit className="w-3 h-3" />
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
              style={{ borderColor: colors.neutral300, color: THEME.textSecondary }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-2xl" style={{ backgroundColor: colors.surface }}>
          <DialogHeader className="pb-4" style={{ borderBottom: `1px solid ${THEME.neutral300}` }}>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2" style={{ color: THEME.error }}>
              Delete Question
            </DialogTitle>
            <DialogDescription className="text-secondary">
              This action cannot be undone. Please confirm you want to permanently delete this question.
            </DialogDescription>
          </DialogHeader>

          {selectedQuestion && (
            <div className="py-4">
              <div
                className="p-4 border rounded-lg"
                style={{
                  backgroundColor: colors.neutral50,
                  borderColor: colors.neutral300,
                }}
              >
                <h4 className="font-medium mb-2" style={{ color: THEME.neutral900 }}>
                  Question to be deleted:
                </h4>
                <p
                  className="text-sm leading-relaxed p-3 border rounded"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.neutral300,
                    color: colors.textPrimary,
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
                        backgroundColor: colors.surface,
                        borderColor: colors.neutral300,
                        color: idx === selectedQuestion.correctOptionIdx ? THEME.success : THEME.textPrimary,
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: colors.primary }}
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
                <div>
                  <span className="font-medium text-sm" style={{ color: "#92400e" }}>
                    Warning:
                  </span>
                  <p className="text-sm mt-1" style={{ color: "#92400e" }}>
                    This question will be moved to trash and can be recovered from the Trash Bin if needed.
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
                style={{ borderColor: colors.neutral300, color: THEME.textSecondary }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => confirmDelete(selectedQuestion?.id)}
                style={{ backgroundColor: colors.error }}
                className="flex-1 text-white hover:opacity-90"
              >
                Move to Trash
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
