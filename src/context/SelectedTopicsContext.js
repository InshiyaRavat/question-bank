'use client'
import React, { createContext, useState } from 'react'

export const SelectedTopicsContext = createContext()

export const SelectedTopicsProvider = ({ children }) => {
  const [selectedTopics, setSelectedTopics] = useState({})
  console.log("SelectedTopicsProvider state:", selectedTopics)
  return (
    <SelectedTopicsContext.Provider value={{ selectedTopics, setSelectedTopics }}>
      {children}
    </SelectedTopicsContext.Provider>
  )
}

