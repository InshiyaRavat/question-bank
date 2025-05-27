'use client';
import Question from '@/components/Question';
import { useRouter } from 'next/navigation';
import React, { useState,useEffect } from 'react';

export default function Questions() {

  const router = useRouter()
  const [type, setType] = useState()
  useEffect(()=>{
    const queryType = new URLSearchParams(window.location.search).get('type')
      if(queryType){
        setType(queryType)
      }
  },[])

  const handleSubmit = (e) =>{
    router.push('/Result')
  }
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Main Content Section */}
      <main className="flex-grow flex justify-center items-center p-6">
        <div className="w-full max-w-6xl bg-white shadow-lg rounded-lg p-6">
          <Question />
        </div>
      </main>

      {/* Footer Section */}
      <footer className="bg-gray-800 text-white text-center py-4">
        <p className="text-sm">&copy; {new Date().getFullYear()} Question Bank. All Rights Reserved.</p>
      </footer>
    </div>
  );
}