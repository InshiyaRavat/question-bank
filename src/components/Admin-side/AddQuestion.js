"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import pdfToText from "react-pdftotext";
import { THEME } from "@/theme";
import { toast, ToastContainer } from "react-toastify";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Textarea } from "../ui/textarea";

const AddQuestion = () => {
  const [topics, setTopics] = useState([]);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const router = useRouter();
  const [pdfFile, setPdfFile] = useState(null);
  const [extracted, setExtracted] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingExtract, setLoadingExtract] = useState(false);

  useEffect(() => {
    fetch("/api/topics")
      .then((res) => res.json())
      .then((data) => setTopics(data))
      .catch((err) => toast.error("Failed to fetch topics: " + err.message));
  }, []);

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const handleAddQuestion = async () => {
    if (!question || options.some((opt) => opt === "") || !correctAnswer || !selectedTopic) {
      toast.error("Please fill in all fields.");
      return;
    }

    const answerIndex = options.findIndex((opt) => opt === correctAnswer);
    if (answerIndex === -1) {
      toast.error("Correct answer must match one of the options.");
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

      toast.success("Question added successfully!");
      setQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer("");
      setSelectedTopic("");
      router.push("/admin/dashboard");
    } catch (error) {
      toast.error("Failed to add question: " + error.message);
    }
  };

  const extractText = async (event) => {
    const file = event.target.files[0];
    setPdfFile(file || null);
    setExtracted([]);
    if (!file) return;
    try {
      setLoadingExtract(true);
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/ai/pdf-process", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract");
      const items = Array.isArray(data.questions) ? data.questions : [];
      if (items.length === 0) {
        toast.warn("No questions found in the PDF.");
        return;
      }
      const editable = items.map((q, idx) => ({
        id: idx,
        subjectName: q.subjectName || "General",
        topicName: q.topicName || "Misc",
        questionText: q.questionText || "",
        options: q.options?.slice(0, 5) || ["", "", "", ""],
        correctOptionIdx: Number.isInteger(q.correctOptionIdx) ? q.correctOptionIdx : 0,
        explanation: q.explanation || "",
      }));
      setExtracted(editable);
      setModalOpen(true);
    } catch (error) {
      toast.error("Failed to extract questions: " + (error.message || ""));
    } finally {
      setLoadingExtract(false);
    }
  };

  const parseQuestionsFromText = (text) => {
    const questionBlocks = text.split(/Q:\s*/).filter(Boolean);
    const structuredQuestions = [];

    questionBlocks.forEach((block) => {
      try {
        const questionMatch = block.match(/^([^\nA]+)(?=\s*A\))/);
        const optionMatches = block.match(
          /A\)\s*(.*?)\s*(?=B\))B\)\s*(.*?)\s*(?=C\))C\)\s*(.*?)\s*(?=D\))D\)\s*(.*?)(?=\s*Answer:)/s
        );
        const answerMatch = block.match(/Answer:\s*([ABCD])/);
        const explanationMatch = block.match(/Explanation:\s*(.*?)(?=\s*Topic:|\n|$)/);
        const topicMatch = block.match(/Topic:\s*(.*?)(?=\n|$)/);

        if (questionMatch && optionMatches && answerMatch && topicMatch) {
          const answerIndex = { A: 0, B: 1, C: 2, D: 3 }[answerMatch[1]];
          const topicName = topicMatch[1].trim();
          const topicId = topics.find((t) => t.name === topicName)?.id || "1";

          structuredQuestions.push({
            questionText: questionMatch[1].trim(),
            options: [optionMatches[1], optionMatches[2], optionMatches[3], optionMatches[4]].map((opt) => opt.trim()),
            correctOptionIdx: answerIndex,
            topicId,
            explanation: explanationMatch?.[1]?.trim() || "",
          });
        }
      } catch (err) {
        toast.error("Error parsing question block: " + err.message);
      }
    });

    return structuredQuestions;
  };

  const handleEditChange = (idx, field, value) => {
    setExtracted((prev) => prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  };

  const handleEditOption = (idx, optIdx, value) => {
    setExtracted((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q;
        const nextOptions = [...(q.options || [])];
        nextOptions[optIdx] = value;
        return { ...q, options: nextOptions };
      })
    );
  };

  const submitExtracted = async () => {
    try {
      if (!extracted.length) return;
      const items = extracted.map((q) => ({
        subjectName: q.subjectName?.trim() || "General",
        topicName: q.topicName?.trim() || "Misc",
        questionText: q.questionText?.trim() || "",
        optionA: q.options?.[0] || "",
        optionB: q.options?.[1] || "",
        optionC: q.options?.[2] || "",
        optionD: q.options?.[3] || "",
        optionE: q.options?.[4] || "",
        correctOptionIdx: q.correctOptionIdx ?? 0,
        explanation: q.explanation || "",
        difficulty: "",
        tags: "",
      }));

      const res = await fetch("/api/admin/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "insert", items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Insert failed");
      toast.success(`Inserted ${data.inserted} question(s)`);
      if (data.skipped?.length) {
        toast.warn(`${data.skipped.length} item(s) skipped`);
      }
      setModalOpen(false);
      setExtracted([]);
    } catch (err) {
      toast.error("Failed to submit questions: " + (err.message || ""));
    }
  };

  return (
    <div className={`min-h-screen bg-blue-200 p-4 sm:p-8 flex flex-col items-center`}>
      <div className="w-full max-w-3xl bg-[#f9fafb] rounded-xl shadow-md p-6 sm:p-10 space-y-6">
        <h2 className={`text-2xl sm:text-3xl font-bold text-center`} style={{ color: THEME.primary }}>
          Add New Question
        </h2>

        {/* PDF Upload via AI SDK extractor */}
        <div>
          <label className={`block font-semibold mb-2`} style={{ color: THEME.neutral900 }}>
            Upload PDF for Bulk Questions
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={extractText}
            className={`block w-full text-sm text-gray-700 border border-[${THEME.primary_1}] rounded-md p-2 bg-[#f8f8f8]`}
          />
          {loadingExtract && <p className="text-sm text-gray-600 mt-2">Extracting questions...</p>}
        </div>

        {/* Question Input */}
        <div>
          <label className={`block font-semibold mb-2`} style={{ color: THEME.neutral900 }}>
            Question
          </label>
          <textarea
            rows="3"
            className={`w-full border placeholder-black border-blue-100 rounded-md p-3 focus:ring-2 focus:ring-blue-200 text-black`}
            placeholder="Enter your question here..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          ></textarea>
        </div>

        {/* Options Input */}
        <div>
          <label className={`block font-semibold mb-2`} style={{ color: THEME.neutral900 }}>
            Options
          </label>
          <div className="space-y-3">
            {options.map((opt, index) => (
              <Input
                key={index}
                type="text"
                className={`w-full placeholder-black border p-3 rounded-md focus:ring-2 focus:ring-blue-200 text-black`}
                placeholder={`Option ${index + 1}`}
                value={opt}
                onChange={(e) => handleOptionChange(index, e.target.value)}
              />
            ))}
          </div>
        </div>

        {/* Correct Answer */}
        <div>
          <label className={`block font-semibold mb-2`} style={{ color: THEME.neutral900 }}>
            Correct Answer
          </label>
          <select
            className={`w-full border border-[${THEME.primary_1}] p-3 rounded-md text-gray-700 focus:ring-2 focus:ring-[${THEME.primary_2}]`}
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
          <label className={`block font-semibold mb-2`} style={{ color: THEME.neutral900 }}>
            Select Topic
          </label>
          <select
            className={`w-full border border-[${THEME.primary_1}] p-3 rounded-md text-gray-700 focus:ring-2 focus:ring-[${THEME.primary_2}]`}
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
          >
            <option value="">Select Topic</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.name}>
                {topic.name}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button
          className={`w-full bg-[${THEME.primary_3}] hover:bg-[${THEME.primary_2}] text-white py-3 rounded-md font-semibold text-lg transition`}
          onClick={handleAddQuestion}
        >
          Add Question
        </button>
      </div>
      <ToastContainer />

      {/* Modal for editing extracted questions */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Extracted Questions ({extracted.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 max-h-[60vh] overflow-auto pr-2">
            {extracted.map((q, idx) => (
              <div key={idx} className="border rounded-md p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Subject"
                    value={q.subjectName}
                    onChange={(e) => handleEditChange(idx, "subjectName", e.target.value)}
                  />
                  <Input
                    placeholder="Topic"
                    value={q.topicName}
                    onChange={(e) => handleEditChange(idx, "topicName", e.target.value)}
                  />
                </div>
                <Textarea
                  rows={3}
                  placeholder="Question text"
                  value={q.questionText}
                  onChange={(e) => handleEditChange(idx, "questionText", e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  {(q.options || ["", "", "", "", ""]).slice(0, 5).map((opt, oi) => (
                    <Input
                      key={oi}
                      placeholder={`Option ${oi + 1}`}
                      value={opt}
                      onChange={(e) => handleEditOption(idx, oi, e.target.value)}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="text-sm text-gray-700">Correct Option Index (0-4)</label>
                    <Input
                      type="number"
                      min={0}
                      max={4}
                      value={q.correctOptionIdx}
                      onChange={(e) => handleEditChange(idx, "correctOptionIdx", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Explanation</label>
                    <Input
                      value={q.explanation}
                      onChange={(e) => handleEditChange(idx, "explanation", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitExtracted}>Submit All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddQuestion;
