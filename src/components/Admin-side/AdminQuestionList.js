import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast, ToastContainer } from "react-toastify";
import { THEME } from "@/theme";
import { DeleteIcon, Pencil, Plus, Trash2 } from "lucide-react";

const AdminQuestionList = ({ searchTerm }) => {
  const [questionList, setQuestionList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editField, setEditField] = useState("");
  const [newValue, setNewValue] = useState("");
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    fetch(`/api/question?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => setQuestionList(data))
      .catch((err) => toast.error("Failed to fetch questions: " + err.message));
  }, [isLoaded, isSignedIn, user]);

  const handleDeleteClick = (question) => {
    setSelectedQuestion(question);
    setShowModal(true);
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
    setShowModal(false);
  };

  const handleAddQuestion = () => {
    router.push("/add-question");
  };

  const handleEdit = (question) => {
    setSelectedQuestion(question);
    setEditDialog(true);
  };

  const handleFieldEdit = (field) => {
    setEditField(field);
  };

  const handleInputChange = (e) => {
    setNewValue(e.target.value);
  };

  const updateQuestion = async () => {
    const updated = { ...selectedQuestion };

    if (editField.startsWith("option-")) {
      const index = parseInt(editField.split("-")[1]);
      updated.options = [...updated.options];
      updated.options[index] = newValue;
    } else {
      updated[editField] = editField === "correctOptionIdx" ? parseInt(newValue) : newValue;
    }

    try {
      const res = await fetch(`/api/question/${selectedQuestion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error("Update failed");

      setQuestionList((prev) => prev.map((q) => (q.id === selectedQuestion.id ? updated : q)));

      toast.success("Question updated successfully!");
      setEditDialog(false);
      setEditField("");
      setNewValue("");
    } catch (err) {
      toast.error("Failed to update question: " + err.message);
    }
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
          style={{
            backgroundColor: THEME.primary,
            color: "white",
          }}
          className="hover:opacity-90 px-4 py-2 rounded-full font-semibold shadow transition w-full sm:w-auto cursor-pointer flex items-center gap-2"
        >
          <Plus />
          Add Question
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
                  style={{ color: THEME.primary }}
                  className="hover:opacity-80 text-lg cursor-pointer"
                >
                  <Pencil />
                </button>
                <button
                  onClick={() => handleDeleteClick(q)}
                  style={{ color: THEME.error }}
                  className="hover:opacity-80 text-lg cursor-pointer"
                >
                  <Trash2 />
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Edit Dialog */}
      {editDialog && selectedQuestion && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 p-4 z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg text-black">
            <h3 className="text-xl font-bold mb-4 text-center">Edit Question</h3>
            <div className="grid gap-3">
              <button
                onClick={() => handleFieldEdit("questionText")}
                style={{ backgroundColor: THEME.primary_2 }}
                className="text-white px-4 py-2 rounded hover:opacity-90"
              >
                Edit Question Text
              </button>
              <button
                onClick={() => handleFieldEdit("correctOptionIdx")}
                style={{ backgroundColor: THEME.primary_1, color: "black" }}
                className="px-4 py-2 rounded hover:opacity-90"
              >
                Edit Correct Answer Index
              </button>
              {selectedQuestion.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleFieldEdit(`option-${idx}`)}
                  style={{ backgroundColor: THEME.secondary_1, color: "black" }}
                  className="px-4 py-2 rounded hover:opacity-90 text-left"
                >
                  Edit Option {idx + 1}: {opt}
                </button>
              ))}
            </div>

            {editField && (
              <div className="mt-4">
                <input
                  type="text"
                  value={newValue}
                  onChange={handleInputChange}
                  placeholder="Enter new value"
                  className="w-full p-2 border border-gray-300 rounded mt-2"
                />
                <div className="flex gap-3 mt-4 flex-col sm:flex-row">
                  <button
                    onClick={updateQuestion}
                    style={{ backgroundColor: THEME.primary_2 }}
                    className="flex-1 text-white px-4 py-2 rounded hover:opacity-90"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => setEditDialog(false)}
                    style={{ backgroundColor: THEME.secondary_6 }}
                    className="flex-1 text-white px-4 py-2 rounded hover:opacity-90"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4">
          <div className="bg-white text-black p-6 rounded-xl w-full max-w-md shadow-lg text-center">
            <p className="mb-4 text-lg">Are you sure you want to delete this question?</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(selectedQuestion.id)}
                style={{ backgroundColor: THEME.secondary_5 }}
                className="px-4 py-2 rounded text-white hover:opacity-90"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default AdminQuestionList;
