"use client";
import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { TrendingUp, Target } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const AnalyticsCard = ({ icon: Icon, label, value, color }) => (
  <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow border border-border p-4">
    <div className={`mb-2 p-2 rounded-full bg-${color}-100 text-${color}-600`}>
      <Icon className="h-6 w-6" />
    </div>
    <div className="text-2xl font-bold mb-1">{value}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
);

const PerformanceOverview = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    const fetchPerformance = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/users/${user.id}/history`);
        if (!res.ok) throw new Error('Failed to fetch performance data');
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, [isLoaded, isSignedIn, user]);

  const accuracy = data?.totals?.accuracy ?? 0;
  const totalSolved = data?.totals?.totalSolved ?? 0;
  const totalCorrect = data?.totals?.totalCorrect ?? 0;
  const totalIncorrect = Math.max(0, totalSolved - totalCorrect);
  const accuracySplit = [
    { name: 'Correct', value: totalCorrect, color: '#22c55e' },
    { name: 'Incorrect', value: totalIncorrect, color: '#ef4444' },
  ];

  return (
    <section className="bg-card text-card-foreground rounded-xl shadow p-6 mb-8 border border-border w-full">
      <h2 className="text-2xl font-semibold mb-6 text-primary">Performance Overview</h2>
      {(!isLoaded || loading) ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : error ? (
        <p className="text-destructive">Error: {error}</p>
      ) : data ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            {/* Analytics Cards */}
            <AnalyticsCard icon={Target} label="Total Solved" value={totalSolved} color="blue" />
            <AnalyticsCard icon={TrendingUp} label="Total Correct" value={totalCorrect} color="green" />
            {/* Circular Progress Chart for Accuracy */}
            <div className="flex flex-col items-center justify-center col-span-1 md:col-span-2">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="80%"
                    outerRadius="100%"
                    data={[{ name: 'Accuracy', value: accuracy }]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar
                      minAngle={15}
                      background
                      clockWise
                      dataKey="value"
                      cornerRadius={50}
                      fill="#22c55e"
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-2">
                <div className="text-3xl font-bold text-green-600">{accuracy}%</div>
                <div className="text-muted-foreground text-sm">Accuracy</div>
              </div>
            </div>
          </div>

          {/* Accuracy Split Pie */}
          <div>
            <div className="text-base font-semibold mb-2 text-accent-foreground">Accuracy Split</div>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Legend />
                  <Pie data={accuracySplit} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4}>
                    {accuracySplit.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default PerformanceOverview;
