"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Button } from "../ui/button";

const Mode = () => {
  const [isTest, setIsTest] = useState(false);
  const [isTimed, setIsTimedTest] = useState(false);
  const [isStopwatchEnabled, setIsStopwatchEnabled] = useState(false);
  const router = useRouter();

  const handleSelection = (e) => {
    setIsTest(e.target.value === "test");
  };

  const handleTypeChange = (e) => {
    setIsTimedTest(e.target.value === "timed");
  };

  const handleStopwatchToggle = (e) => {
    setIsStopwatchEnabled(e.target.checked);
  };

  const handleClick = () => {
    if (isTest) {
      router.push(`/questions?type=${isTimed ? "timed" : "untimed"}`);
    } else {
      const stopwatchParam = isStopwatchEnabled ? "on" : "off";
      router.push(`/questions?type=practice&stopwatch=${stopwatchParam}`);
    }
  };

  return (
    <div className="w-full flex flex-col sm:flex-wrap sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg shadow-sm border border-[#E0E0E0] text-[#001219] bg-white">
      {/* Mode Selection */}
      <div className="flex flex-wrap items-center gap-2">
        {["Practice", "Test"].map((mode, index) => (
          <label key={index} className="flex items-center">
            <input
              type="radio"
              name="mode"
              value={mode.toLowerCase()}
              onChange={handleSelection}
              defaultChecked={index === 0}
              className="hidden"
            />
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all ${isTest === (index === 1)
                ? "bg-[#0A9396] text-white"
                : "bg-[#E9D8A6] text-[#001219] hover:bg-[#CA6702]/90"
                }`}
            >
              {mode}
            </span>
          </label>
        ))}
      </div>

      {/* Stopwatch Toggle */}
      {!isTest && (
        <label className="flex items-center gap-2 bg-[#94D2BD]/30 px-3 py-2 rounded-full text-sm font-medium">
          <input
            type="checkbox"
            checked={isStopwatchEnabled}
            onChange={handleStopwatchToggle}
            className="w-4 h-4 text-[#0A9396] border-gray-300 rounded focus:ring focus:ring-[#0A9396]"
          />
          Enable Stopwatch
        </label>
      )}

      {/* Test Type */}
      {isTest && (
        <div className="flex flex-wrap items-center gap-2">
          {["Timed", "Untimed"].map((type, index) => (
            <label key={index} className="flex items-center">
              <input
                type="radio"
                name="type"
                value={type.toLowerCase()}
                onChange={handleTypeChange}
                className="hidden"
              />
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all ${isTimed === (index === 0)
                  ? "bg-[#EE9B00] text-white"
                  : "bg-[#E9D8A6] text-[#001219] hover:bg-[#CA6702]/90"
                  }`}
              >
                {type}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Start Button */}
      <div className="w-full sm:w-auto">
        <Button suppressHydrationWarning
          onClick={handleClick}
          className="w-full sm:w-auto bg-[#BB3E03] hover:bg-[#AE2012] text-white text-sm font-semibold py-2 px-6 rounded-full shadow-sm transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#CA6702]"
        >
          🚀 Start
        </Button>
      </div>
    </div>
  );
};

export default Mode;
