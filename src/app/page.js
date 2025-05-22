'use client'
import { useState,useEffect } from "react";

export default function Home() {
  const [data,setData] = useState();
  useEffect(() => {
    fetch(`/api/question`)
      .then(async (response) => {
        if (response.ok) {
          return await response.json();
        }
      })
      .then((data) => {
        setData(data)
        console.log(data)
      })
      .catch((error) => console.error("Error in fetching questions: ", error));
  }, []);
  return (
    <div>
      nothing
    </div>
  );
}
