"use client";
import React, { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

const UpcomingTestReminders = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/topics");
        if (!res.ok) throw new Error("Failed to fetch topics");
        let result = await res.json();
        // Sort by id descending (assuming higher id = newer)
        result = result.sort((a, b) => b.id - a.id);
        setTopics(result.slice(0, 5));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, []);

  return (
    <section className="bg-card text-card-foreground rounded-xl shadow p-6 border border-border w-full">
      <h2 className="text-xl font-semibold mb-4 text-primary">What&apos;s New: Recent Topics</h2>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : error ? (
        <p className="text-destructive">{error}</p>
      ) : topics.length === 0 ? (
        <p className="text-muted-foreground">No new topics added recently.</p>
      ) : (
        <ul className="space-y-4">
          {topics.map((topic, idx) => (
            <li key={topic.id} className={`flex items-center gap-4 p-4 rounded-lg ${idx === 0 ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-muted'}`}>
              <div className="flex-shrink-0">
                <BookOpen className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <div className="font-medium text-accent-foreground">{topic.name}</div>
                <div className="text-sm text-muted-foreground">{topic.subject?.name || ""}</div>
                {/* If you have a createdAt field, show it here */}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default UpcomingTestReminders;
