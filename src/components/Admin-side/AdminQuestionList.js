import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from '@clerk/nextjs'

const AdminQuestionList = ({ searchTerm }) => {
    const [questionList, setQuestionList] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [editDialog, setEditDialog] = useState(false);
    const [editField, setEditField] = useState(""); // Holds the field to be edited (question, answer, option)
    const [newValue, setNewValue] = useState(""); // Holds the new value to update
    const router = useRouter();
    const { isLoaded, isSignedIn, user } = useUser()

    useEffect(() => {
        if (!isLoaded || !isSignedIn || !user) return;
        fetch(`/api/question?userId=${user.id}`)
            .then((response) => response.json())
            .then((data) => {
                setQuestionList(data);
            })
            .catch((error) => console.error("Error in fetching questions: ", error));
    }, [isLoaded, isSignedIn, user]);

    const handleDeleteClick = (question) => {
        setSelectedQuestion(question);
        setShowModal(true);
    };

    const deleteQuestion = async (id, topicId) => {
        try {
            const response = await fetch(`/api/question/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete question");

            // Update UI
            setQuestionList((prevList) => prevList.filter((q) => q.id !== id));
            alert("Question deleted successfully and topic count updated.");
        } catch (error) {
            console.error("Error deleting question: ", error);
            alert("Failed to delete question. Please try again.");
        }
    };

    const confirmDelete = (id, topicId) => {
        deleteQuestion(id, topicId);
        setShowModal(false); 
    };

    const handleAddQuestion = (e) => {
        router.push("/AddQuestion");
    };

    // Handle edit button click
    const handleEdit = (question) => {
        setSelectedQuestion(question);
        setEditDialog(true);
    };

    // Handle field selection (question, answer, or options)
    const handleFieldEdit = (field) => {
        setEditField(field);
    };

    // Handle value change for the field to be edited
    const handleInputChange = (e) => {
        setNewValue(e.target.value);
    };

    // Update the question in the database
    const updateQuestion = async () => {
        const updatedQuestion = { ...selectedQuestion };

        if (editField.startsWith("option-")) {
            const index = parseInt(editField.split("-")[1]);
            updatedQuestion.options = [...updatedQuestion.options]; // Copy array
            updatedQuestion.options[index] = newValue;
        } else {
            updatedQuestion[editField] =
                editField === "correctOptionIdx" ? parseInt(newValue) : newValue;
        }

        try {
            const response = await fetch(`api/question/${selectedQuestion.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedQuestion),
            });

            if (!response.ok) {
                throw new Error("Failed to update question");
            }

            // Update the UI
            setQuestionList((prevList) =>
                prevList.map((q) =>
                    q.id === selectedQuestion.id ? updatedQuestion : q
                )
            );

            alert("Question updated successfully!");
            setEditDialog(false);
            setEditField("");
            setNewValue("");
        } catch (error) {
            console.error("Error updating the question: ", error);
            alert("Failed to update question. Please try again.");
        }
    };

    return (
        <div className="max-w-4xl xl:max-w-6xl 2xl:max-w-[80vw] mx-auto p-4 sm:p-6 bg-white shadow-lg rounded-lg">
            {/* Add Question Button */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-black">Question List</h2>
                <button
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-full shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all"
                    onClick={handleAddQuestion}
                >
                    ➕ Add Question
                </button>
            </div>

            {/* Question List */}
            <div className="space-y-4 max-h-[65vh] overflow-y-auto">
                {questionList
                    .filter((q) =>
                        q.questionText.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((q, index) => (
                        <div
                            key={index}
                            className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-4 border rounded-md shadow-sm bg-gray-50"
                        >
                            <p className="text-gray-800 w-full sm:w-auto break-words">{q.questionText}</p>
                            <div className="flex space-x-4 mt-2 sm:mt-0">
                                <button onClick={() => handleEdit(q)} className="text-blue-500 hover:text-blue-700 text-lg">
                                    ✏️
                                </button>
                                <button
                                    className="text-red-500 hover:text-red-700 text-lg"
                                    onClick={() => handleDeleteClick(q)}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
            </div>

            {/* Edit Dialog */}
            {editDialog && selectedQuestion && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 p-6">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Edit Question</h3>
                        <div className="grid gap-3">
                            <button
                                className="w-full px-5 py-3 bg-blue-500 text-white font-medium rounded-lg shadow-md hover:bg-blue-600 transition"
                                onClick={() => handleFieldEdit("questionText")}
                            >
                                Edit Question
                            </button>
                            <button
                                className="w-full px-5 py-3 bg-green-500 text-white font-medium rounded-lg shadow-md hover:bg-green-600 transition"
                                onClick={() => handleFieldEdit("correctOptionIdx")}
                            >
                                Edit Answer
                            </button>
                            {/* Dynamically Render Options */}
                            {selectedQuestion.options.map((option, index) => (
                                <button
                                    key={index}
                                    className="w-full px-5 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg shadow-md hover:bg-gray-300 transition"
                                    onClick={() => handleFieldEdit(`option-${index}`)} // <-- Fix here
                                >
                                    Edit Option {index + 1}: {option}
                                </button>
                            ))}

                        </div>
                        {editField && (
                            <div className="mt-6">
                                {(() => {
                                    const displayField = editField?.startsWith("option-")
                                        ? `Option ${parseInt(editField.split("-")[1]) + 1}`
                                        : editField === "correctOptionIdx"
                                            ? "Answer Index"
                                            : editField === "questionText"
                                                ? "Question"
                                                : editField;

                                    return (
                                        <>
                                            <input
                                                type="text"
                                                className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                                placeholder={`Enter new ${displayField}`}
                                                value={newValue}
                                                onChange={handleInputChange}
                                            />
                                            <div className="flex gap-3 mt-4">
                                                <button
                                                    className="flex-1 px-5 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition"
                                                    onClick={updateQuestion}
                                                >
                                                    Update {displayField}
                                                </button>
                                                <button
                                                    className="flex-1 px-5 py-3 bg-red-500 text-white font-medium rounded-lg shadow-md hover:bg-red-600 transition"
                                                    onClick={() => setEditDialog(false)}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                    </div>
                </div>
            )
            }

            {/* Delete Confirmation Modal */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-lg text-center">
                        <p className="text-lg mb-4 text-black">
                            Are you sure you want to delete this question?
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-x-4 sm:space-y-0">
                            <button
                                className="w-full sm:w-auto px-4 py-2 bg-gray-300 rounded-md text-black"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white rounded-md"
                                onClick={() =>
                                    confirmDelete(selectedQuestion.id, selectedQuestion.topicId)
                                }
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
