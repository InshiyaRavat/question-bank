import React, { useEffect, useState } from "react";

const Stopwatch = () => {
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent((prevTime) => prevTime + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeSpent]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };
  return (
    <div className="border rounded-lg p-3 shadow-sm border-[#0A9396] text-[#001219] bg-[#94D2BD] font-medium">
      Time spent: {formatTime(timeSpent)}
    </div>
  );
};

export default Stopwatch;
