import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

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
      .catch((err) => console.error("Error fetching questions:", err));
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
      alert("Question deleted successfully.");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete question.");
    }
  };

  const confirmDelete = (id) => {
    deleteQuestion(id);
    setShowModal(false);
  };

  const handleAddQuestion = () => {
    router.push("/AddQuestion");
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
      updated[editField] =
        editField === "correctOptionIdx" ? parseInt(newValue) : newValue;
    }

    try {
      const res = await fetch(`/api/question/${selectedQuestion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error("Update failed");

      setQuestionList((prev) =>
        prev.map((q) => (q.id === selectedQuestion.id ? updated : q))
      );

      alert("Updated successfully!");
      setEditDialog(false);
      setEditField("");
      setNewValue("");
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update question.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 bg-[#001219] rounded-lg shadow-md text-white min-h-[80vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#E9D8A6]">
          Question List
        </h2>
        <button
          className="bg-[#0A9396] hover:bg-[#94D2BD] text-white px-4 py-2 rounded-full font-semibold shadow transition w-full sm:w-auto"
          onClick={handleAddQuestion}
        >
          ➕ Add Question
        </button>
      </div>

      {/* List */}
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
        {questionList
          .filter((q) =>
            q.questionText.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((q, index) => (
            <div
              key={index}
              className="bg-[#005F73] p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center"
            >
              <p className="break-words w-full sm:w-auto">{q.questionText}</p>
              <div className="flex gap-4 self-end sm:self-auto">
                <button
                  onClick={() => handleEdit(q)}
                  className="text-[#E9D8A6] hover:text-[#CA6702] text-lg"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteClick(q)}
                  className="text-[#EE9B00] hover:text-[#9B2226] text-lg"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Edit Dialog */}
      {editDialog && selectedQuestion && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 p-4 z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg text-black">
            <h3 className="text-xl font-bold mb-4 text-center">
              Edit Question
            </h3>
            <div className="grid gap-3">
              <button
                onClick={() => handleFieldEdit("questionText")}
                className="bg-[#0A9396] text-white px-4 py-2 rounded hover:bg-[#005F73]"
              >
                Edit Question Text
              </button>
              <button
                onClick={() => handleFieldEdit("correctOptionIdx")}
                className="bg-[#94D2BD] text-black px-4 py-2 rounded hover:bg-[#E9D8A6]"
              >
                Edit Correct Answer Index
              </button>
              {selectedQuestion.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleFieldEdit(`option-${idx}`)}
                  className="bg-[#E9D8A6] text-black px-4 py-2 rounded hover:bg-[#EE9B00] text-left"
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
                    className="flex-1 bg-[#0A9396] text-white px-4 py-2 rounded hover:bg-[#005F73]"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => setEditDialog(false)}
                    className="flex-1 bg-[#9B2226] text-white px-4 py-2 rounded hover:bg-[#AE2012]"
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
            <p className="mb-4 text-lg">
              Are you sure you want to delete this question?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(selectedQuestion.id)}
                className="px-4 py-2 rounded bg-[#AE2012] text-white hover:bg-[#9B2226]"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuestionList;
