'use client'
import React, { createContext, useState } from 'react'
export const AttemptedQuestionContext = createContext()

export const AttemptedQuestionProvider = ({ children }) => {
  const [totalQuestions, setTotalQuestions] = useState(null) 
  
  return (
    <AttemptedQuestionContext.Provider value={{ totalQuestions, setTotalQuestions }}>
      {children}
    </AttemptedQuestionContext.Provider>
  )
}
