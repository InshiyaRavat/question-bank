"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import pdfToText from "react-pdftotext";

const AddQuestion = () => {
  const [topics, setTopics] = useState([]);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/topics")
      .then((res) => res.json())
      .then((data) => setTopics(data))
      .catch((err) => console.error("Error fetching topics:", err));
  }, []);

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const handleAddQuestion = async () => {
    if (!question || options.some((opt) => opt === "") || !correctAnswer || !selectedTopic) {
      alert("Please fill all fields.");
      return;
    }

    const answerIndex = options.findIndex((opt) => opt === correctAnswer);
    if (answerIndex === -1) {
      alert("Correct answer must match one of the options.");
      return;
    }

    const topicId = topics.find((t) => t.name === selectedTopic)?.id || "1";
    const newQuestion = {
      questionText: question,
      options,
      correctOptionIdx: answerIndex,
      topicId,
      explanation: "",
    };

    try {
      const response = await fetch("/api/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuestion),
      });

      if (!response.ok) throw new Error("Failed to add question");

      alert("Question added successfully!");
      setQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer("");
      setSelectedTopic("");
      router.push("/adminDashboard");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to add question. Please try again.");
    }
  };

  const extractText = async (event) => {
    const file = event.target.files[0];
    try {
      const text = await pdfToText(file);
      const questions = parseQuestionsFromText(text);
      await Promise.all(
        questions.map(async (q) => {
          await fetch("/api/question", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(q),
          });
        })
      );
      alert("Bulk questions added successfully!");
    } catch (error) {
      console.error("Failed to extract text from PDF", error);
      alert("Failed to process PDF.");
    }
  };

  const parseQuestionsFromText = (text) => {
    const questionBlocks = text.split(/Q:\s*/).filter(Boolean);
    const structuredQuestions = [];

    questionBlocks.forEach((block) => {
      try {
        const questionMatch = block.match(/^([^\nA]+)(?=\s*A\))/);
        const optionMatches = block.match(/A\)\s*(.*?)\s*(?=B\))B\)\s*(.*?)\s*(?=C\))C\)\s*(.*?)\s*(?=D\))D\)\s*(.*?)(?=\s*Answer:)/s);
        const answerMatch = block.match(/Answer:\s*([ABCD])/);
        const explanationMatch = block.match(/Explanation:\s*(.*?)(?=\s*Topic:|\n|$)/);
        const topicMatch = block.match(/Topic:\s*(.*?)(?=\n|$)/);

        if (questionMatch && optionMatches && answerMatch && topicMatch) {
          const answerIndex = { A: 0, B: 1, C: 2, D: 3 }[answerMatch[1]];
          const topicName = topicMatch[1].trim();
          const topicId = topics.find((t) => t.name === topicName)?.id || "1";

          structuredQuestions.push({
            questionText: questionMatch[1].trim(),
            options: [optionMatches[1], optionMatches[2], optionMatches[3], optionMatches[4]].map(opt => opt.trim()),
            correctOptionIdx: answerIndex,
            topicId,
            explanation: explanationMatch?.[1]?.trim() || "",
          });
        }
      } catch (err) {
        console.warn("Skipping invalid question block:", block);
      }
    });

    return structuredQuestions;
  };

  return (
    <div className="min-h-screen bg-[#E9D8A6] p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-md p-6 sm:p-10 space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#005F73] text-center">Add New Question</h2>

        {/* PDF Upload */}
        <div>
          <label className="block text-[#001219] font-semibold mb-2">Upload PDF for Bulk Questions</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={extractText}
            className="block w-full text-sm text-gray-700 border border-[#94D2BD] rounded-md p-2 bg-[#f8f8f8]"
          />
        </div>

        {/* Question Input */}
        <div>
          <label className="block text-[#001219] font-semibold mb-2">Question</label>
          <textarea
            rows="3"
            className="w-full border placeholder-black border-[#94D2BD] rounded-md p-3 focus:ring-2 focus:ring-[#0A9396]"
            placeholder="Enter your question here..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          ></textarea>
        </div>

        {/* Options Input */}
        <div>
          <label className="block text-[#001219] font-semibold mb-2">Options</label>
          <div className="space-y-3">
            {options.map((opt, index) => (
              <input
                key={index}
                type="text"
                className="w-full placeholder-black border border-[#94D2BD] p-3 rounded-md focus:ring-2 focus:ring-[#0A9396]"
                placeholder={`Option ${index + 1}`}
                value={opt}
                onChange={(e) => handleOptionChange(index, e.target.value)}
              />
            ))}
          </div>
        </div>

        {/* Correct Answer */}
        <div>
          <label className="block text-[#001219] font-semibold mb-2">Correct Answer</label>
          <select
            className="w-full border border-[#94D2BD] p-3 rounded-md text-gray-700 focus:ring-2 focus:ring-[#0A9396]"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
          >
            <option value="">Select Correct Answer</option>
            {options.map((opt, index) => (
              <option key={index} value={opt}>{`Option ${index + 1}`}</option>
            ))}
          </select>
        </div>

        {/* Topic Dropdown */}
        <div>
          <label className="block text-[#001219] font-semibold mb-2">Select Topic</label>
          <select
            className="w-full border border-[#94D2BD] p-3 rounded-md text-gray-700 focus:ring-2 focus:ring-[#0A9396]"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
          >
            <option value="">Select Topic</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.name}>{topic.name}</option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button
          className="w-full bg-[#005F73] hover:bg-[#0A9396] text-white py-3 rounded-md font-semibold text-lg transition"
          onClick={handleAddQuestion}
        >
          Add Question
        </button>
      </div>
    </div>
  );
};

export default AddQuestion;
