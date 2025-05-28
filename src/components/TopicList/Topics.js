"use client";
import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useContext } from "react";
import { AttemptedQuestionContext } from "@/context/AttemptedQuestionContext";
import { SelectedTopicsContext } from "@/context/SelectedTopicsContext";

const Topics = () => {
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState({});
  const { selectedTopics, setSelectedTopics } = useContext(
    SelectedTopicsContext
  );
  const { isLoaded, isSignedIn, user } = useUser();
  const { totalQuestions, setTotalQuestions } = useContext(
    AttemptedQuestionContext
  );
  const [attemptedQuestions, setAttemptedQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const checkAndCreateUser = async () => {
        try {
          const userId = user.id;
          const response = await fetch(
            `/api/attempted-question?userid=${userId}`
          );
          let data = await response.json();

          if (!response.ok || data.length === 0) {
            await fetch("/api/attempted-question", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId }),
            });
            const retryResponse = await fetch(
              `/api/attempted-question?userid=${userId}`
            );
            data = await retryResponse.json();
          }

          const attemptsByTopic = {};
          data.forEach((item) => {
            attemptsByTopic[item.topicId] = item.questionsAttempted;
          });

          setAttemptedQuestions(attemptsByTopic);

          const total = Object.values(attemptsByTopic).reduce(
            (acc, curr) => acc + curr,
            0
          );
          setTotalQuestions(total);
        } catch (error) {
          console.error("Error:", error);
        }
      };
      checkAndCreateUser();
    }
  }, [isLoaded, isSignedIn, setTotalQuestions, user]);

  useEffect(() => {
    fetch("/api/subject")
      .then((res) => res.json())
      .then(setSubjects)
      .catch((err) => console.error("Error fetching subjects:", err));
  }, []);

  useEffect(() => {
    fetch("/api/topics")
      .then((res) => res.json())
      .then(setTopics)
      .catch((err) => console.error("Error fetching topics:", err));
  }, []);

  const handleSubjectToggle = (subjectId) => {
    setSelectedSubjects((prev) => ({
      ...prev,
      [subjectId]: !prev[subjectId],
    }));
  };

  const handleTopicToggle = (topicId) => {
    setSelectedTopics((prev) => {
      const updated = { ...prev };
      if (updated[topicId]) {
        delete updated[topicId];
      } else {
        updated[topicId] = true;
      }
      return updated;
    });
  };

  useEffect(() => {
    if (!searchQuery) {
      setSelectedSubjects({});
      return;
    }

    const matchedSubjectIds = new Set();
    topics.forEach((topic) => {
      if (topic.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        matchedSubjectIds.add(topic.subjectId);
      }
    });

    setSelectedSubjects((prev) => {
      const updated = { ...prev };
      matchedSubjectIds.forEach((id) => {
        updated[id] = true;
      });
      return updated;
    });
  }, [searchQuery, topics]);

  return (
    <div className="w-full max-w-full mx-auto px-4 sm:px-6 py-6 bg-white rounded-xl shadow-md space-y-6 border border-[#E0E0E0]">
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-[#001219]">
        📚 Subjects & Topics
      </h1>

      {/* Search Bar */}
      <div className="flex justify-center">
        <input
          type="text"
          placeholder="🔍 Search Topics..."
          className="w-full sm:w-2/3 px-4 py-2 border border-[#005F73] rounded-full focus:outline-none focus:ring-2 focus:ring-[#0A9396] shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Subjects List */}
      <div className="space-y-4">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="bg-[#94D2BD]/20 p-4 rounded-lg border border-[#94D2BD] shadow-sm"
          >
            <label className="flex items-center justify-between text-base sm:text-lg font-semibold text-[#001219] flex-wrap gap-2">
              <span className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="w-5 h-5 border-2 border-[#005F73] rounded-md checked:bg-[#005F73] transition"
                  checked={!!selectedSubjects[subject.id]}
                  onChange={() => handleSubjectToggle(subject.id)}
                />
                <span>{subject.name}</span>
              </span>
            </label>

            {selectedSubjects[subject.id] && (
              <ul className="mt-3 space-y-3 pl-4 sm:pl-6 border-l-4 border-[#EE9B00]">
                {topics
                  .filter(
                    (topic) =>
                      topic.subjectId === subject.id &&
                      topic.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                  )
                  .map((topic) => (
                    <li
                      key={topic.id}
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-3 rounded-md border hover:bg-[#f1f5f4] transition"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          className="w-5 h-5 border-2 border-[#0A9396] rounded-md checked:bg-[#0A9396] transition"
                          checked={!!selectedTopics[topic.id]}
                          onChange={() => handleTopicToggle(topic.id)}
                        />
                        <span className="text-[#001219]">{topic.name}</span>
                      </div>
                      <div className="text-sm text-[#AE2012] mt-2 sm:mt-0">
                        Attempted{" "}
                        <span className="font-bold text-[#9B2226]">
                          {attemptedQuestions[topic.id] || 0}
                        </span>{" "}
                        / {topic.noOfQuestions}
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Topics;
