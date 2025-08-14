'use client'
import React, { createContext, useState } from 'react'

export const SelectedTopicsContext = createContext()

export const SelectedTopicsProvider = ({ children }) => {
  const [selectedTopics, setSelectedTopics] = useState({})
  return (
    <SelectedTopicsContext.Provider value={{ selectedTopics, setSelectedTopics }}>
      {children}
    </SelectedTopicsContext.Provider>
  )
}

