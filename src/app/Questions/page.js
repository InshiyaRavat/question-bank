"use client";
import Question from "@/components/Question/Question";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

export default function Questions() {
  const router = useRouter();
  const [type, setType] = useState();
  useEffect(() => {
    const queryType = new URLSearchParams(window.location.search).get("type");
    if (queryType) {
      setType(queryType);
    }
  }, []);

  const handleSubmit = (e) => {
    router.push("/Result");
  };
  return (
    <div className="flex flex-col bg-gray-50 text-gray-800">

      {/* Main Content Section */}
      <main className="flex-grow flex justify-center items-center">
        <div className="w-full rounded-2xl mb-4">
          <Question />
        </div>
      </main>

      {/* Footer Section */}
      <footer className="bg-gray-800 text-white text-center py-5">
        <p className="text-sm">
          &copy; {new Date().getFullYear()}{" "}
          <span className="font-semibold">Question Bank</span>. All Rights
          Reserved.
        </p>
      </footer>
    </div>
  );
}
