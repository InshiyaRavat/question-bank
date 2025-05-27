'use client';
import { useUser } from '@clerk/nextjs';
import React, { useState, useEffect, useContext } from 'react';
import { AttemptedQuestionContext } from '@/context/AttemptedQuestionContext';
import { SelectedTopicsContext } from '@/context/SelectedTopicsContext';

const Topics = () => {
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState({});
  const { selectedTopics, setSelectedTopics } = useContext(SelectedTopicsContext);
  const { isLoaded, isSignedIn, user } = useUser();
  const { totalQuestions, setTotalQuestions } = useContext(AttemptedQuestionContext);
  const [attemptedQuestions, setAttemptedQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const checkAndCreateUser = async () => {
        try {
          const userId = user.id;
          const response = await fetch(`/api/attempted-question?userid=${userId}`);
          const data = await response.json();

           if (!response.ok || data.length === 0) {
          await fetch('/api/attempted-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          });

          // Re-fetch after creating
          const retryResponse = await fetch(`/api/attempted-question?userid=${userId}`);
          data = await retryResponse.json();
        }

        // Convert to topicId-indexed array
        const attemptsByTopic = {};
        data.forEach((item) => {
          attemptsByTopic[item.topicId] = item.questionsAttempted;
        });

        setAttemptedQuestions(attemptsByTopic);

        const total = Object.values(attemptsByTopic).reduce((acc, curr) => acc + curr, 0);
        setTotalQuestions(total);
        } catch (error) {
          console.error('Error:', error);
        }
      };
      checkAndCreateUser();
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    fetch('/api/subject')
      .then(async (response) => 
        {return await response.json()})
      .then((data) => setSubjects(data))
      .catch((error) => console.error('Error fetching subjects:', error));
      
  }, []);

  
  useEffect(() => {
    fetch('/api/topics')
      .then(async (response) =>{return await response.json()})
      .then((data) => setTopics(data))
      .catch((error) => console.error('Error fetching topics:', error));
  }, []);

  const handleSubjectToggle = (subjectId) => {
    setSelectedSubjects((prev) => ({
      ...prev,
      [subjectId]: !prev[subjectId],
    }));
  };

  const handleTopicToggle = (topicId) => {
    setSelectedTopics((prev) => {
      const newSelectedTopics = { ...prev };
      if (newSelectedTopics[topicId]) {
        delete newSelectedTopics[topicId];
      } else {
        newSelectedTopics[topicId] = true;
      }
      return newSelectedTopics;
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
    <div className="max-w-5xl mx-auto p-8 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-2xl">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
        📚 Subjects & Topics
      </h1>

      <div className="mb-6 flex justify-center">
        <input
          type="text"
          placeholder="🔍 Search Topics..."
          className="w-full md:w-1/2 px-4 py-2 border-2 border-blue-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 shadow"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-6">
        {subjects.map((subject) => (
          <div key={subject.id} className="bg-white p-6 rounded-lg shadow-md transition hover:shadow-lg">
            <label className="flex items-center justify-between text-xl font-semibold text-gray-700 cursor-pointer">
              <span className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  className="appearance-none w-6 h-6 border-2 border-blue-500 rounded-md checked:bg-blue-500 checked:border-transparent transition"
                  checked={!!selectedSubjects[subject.id]}
                  onChange={() => handleSubjectToggle(subject.id)}
                />
                <span>{subject.name}</span>
              </span>
            </label>

            {selectedSubjects[subject.id] && (
              <ul className="mt-4 space-y-3 pl-6 border-l-4 border-blue-400">
                {topics
                  .filter(
                    (topic) =>
                      topic.subjectId === subject.id &&
                      topic.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((topic) => (
                    <li
                      key={topic.id}
                      className="flex justify-between items-center bg-gray-50 p-4 rounded-md hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          className="appearance-none w-5 h-5 border-2 border-green-500 rounded-md checked:bg-green-500 checked:border-transparent transition"
                          checked={!!selectedTopics[topic.id]}
                          onChange={() => handleTopicToggle(topic.id)}
                        />
                        <span className="text-gray-700 font-medium">{topic.name}</span>
                      </div>
                      <div className="text-gray-600 text-sm">
                        Attempted{' '}
                        <span className="font-bold text-green-600">
                          {attemptedQuestions[topic.id] || 0}
                        </span>{' '}
                        / {topic.noOfQuestions} Questions
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
