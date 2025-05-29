import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const CountdownTimer = ({ initialTimer, ...props }) => {
  const [timeLeft, setTimeLeft] = useState(initialTimer);
  const router = useRouter();

  useEffect(() => {
    if (timeLeft <= 1) {
      localStorage.setItem("correctQuestions", props.correctQuestions);
      localStorage.setItem("incorrectQuestions", props.incorrectQuestions);
      router.push(
        `/Result?score=${props.score}&incorrectCount=${props.incorrectCount}&correctCount=${props.correctCount}`
      );
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };
  return (
    <div
      className={`border rounded-lg p-3 shadow-sm font-semibold text-lg tracking-wide transition-all duration-300
      ${
        timeLeft < 10
          ? "border-[#AE2012] text-[#AE2012] bg-[#E9D8A6]"
          : "border-[#0A9396] text-[#005F73] bg-[#94D2BD]"
      }`}
    >
      Time left: {formatTime(timeLeft)}
    </div>
  );
};

export default CountdownTimer;
