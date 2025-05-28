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
        fetch('/api/topics')
            .then(async (response) => { return await response.json() })
            .then((data) => setTopics(data))
            .catch((error) => console.error('Error fetching topics:', error));
    }, []);



    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
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

        const newQuestion = {
            questionText: question,
            options,
            correctOptionIdx: answerIndex,
            topicId: topics.find((t) => t.name === selectedTopic)?.id || "1",
            explanation: "", // optional
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
            console.log(text)
            const questions = parseQuestionsFromText(text);
            console.log(questions)
            await Promise.all(
                questions.map(async (q) => {
                    console.log(q)
                    await fetch("/api/question", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(q),
                    });
                })
            );
            alert("Bulk questions added successfully!");
        } catch (error) {
            console.error("Failed to extract text from pdf", error);
            alert("Failed to process PDF.");
        }
    };

    const parseQuestionsFromText = (text) => {
        const questionBlocks = text.split(/Q:\s*/).filter(Boolean);
        const structuredQuestions = [];

        questionBlocks.forEach((block) => {
            try {
                // Match the question and strip any surrounding whitespaces
                const questionMatch = block.match(/^([^\nA]+)(?=\s*A\))/);

                // Match options, considering variations in line breaks
                const optionMatches = block.match(/A\)\s*(.*?)\s*(?=B\))B\)\s*(.*?)\s*(?=C\))C\)\s*(.*?)\s*(?=D\))D\)\s*(.*?)(?=\s*Answer:)/s);

                // Match answer, possibly with multiple lines or spaces
                const answerMatch = block.match(/Answer:\s*([ABCD])/);

                // Match explanation, if present
                const explanationMatch = block.match(/Explanation:\s*(.*?)(?=\s*Topic:|\n|$)/);

                // Match the topic
                const topicMatch = block.match(/Topic:\s*(.*?)(?=\n|$)/);

                // Log values to understand what's being captured
                console.log("question:", questionMatch);
                console.log("option:", optionMatches);
                console.log("answer:", answerMatch);
                console.log("explanation:", explanationMatch);
                console.log("topic:", topicMatch);

                if (questionMatch && optionMatches && answerMatch && topicMatch) {
                    console.log("i go inside if")
                    const answerLetter = answerMatch[1];
                    const answerIndex = { A: 0, B: 1, C: 2, D: 3 }[answerLetter];
                    const topicName = topicMatch[1].trim();
                    const topicId = topics.find((t) => t.name === topicName)?.id || "1";

                    structuredQuestions.push({
                        questionText: questionMatch[1].trim(),
                        options: [optionMatches[1].trim(), optionMatches[2].trim(), optionMatches[3].trim(), optionMatches[4].trim()],
                        correctOptionIdx: answerIndex,
                        topicId,
                        explanation: explanationMatch?.[1]?.trim() || "",
                    });
                }
            } catch (err) {
                console.warn("Skipping invalid question block:", block);
            }
        });

        console.log(structuredQuestions);
        return structuredQuestions;
    };


    return (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-r from-gray-900 to-gray-700 p-6">
            <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-2xl mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Add New Question</h2>

                <div className="mb-6">
                    <label className="block text-gray-600 font-medium mb-2">Upload PDF for Bulk Questions</label>
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={extractText}
                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                    />
                </div>

                <label className="block text-gray-600 font-medium">Question</label>
                <textarea
                    className="w-full border border-gray-300 rounded-md p-3 mt-2 focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Enter your question here..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                ></textarea>

                <label className="block mt-4 text-gray-600 font-medium">Options</label>
                <div className="space-y-2 mt-2">
                    {options.map((opt, index) => (
                        <input
                            key={index}
                            type="text"
                            className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500"
                            placeholder={`Option ${index + 1}`}
                            value={opt}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                        />
                    ))}
                </div>

                <label className="block mt-4 text-gray-600 font-medium">Correct Answer</label>
                <select
                    className="w-full border border-gray-300 text-gray-600 p-3 rounded-md mt-2 focus:ring-2 focus:ring-blue-500"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                >
                    <option value="">Select Correct Answer</option>
                    {options.map((opt, index) => (
                        <option key={index} className="text-gray-600" value={opt}>{`Option ${index + 1}`}</option>
                    ))}
                </select>

                <label className="block mt-4 text-gray-600 font-medium">Select Topic</label>
                <select
                    className="w-full border text-gray-600 border-gray-300 p-3 rounded-md mt-2 focus:ring-2 focus:ring-blue-500"
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                >
                    <option value="">Select Topic</option>
                    {topics.map((topic) => (
                        <option key={topic.id} className="text-gray-600" value={topic.name}>
                            {topic.name}
                        </option>
                    ))}
                </select>

                <button
                    className="mt-6 w-full bg-blue-600 text-white p-3 rounded-md text-lg font-semibold hover:bg-blue-700 transition"
                    onClick={handleAddQuestion}
                >
                    Add Question
                </button>
            </div>
        </div>
    );
};

export default AddQuestion;
