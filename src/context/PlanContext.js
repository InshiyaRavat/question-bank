'use client'
import React, { createContext, useState} from 'react'

export const PlanContext = createContext()

export const PlanProvider = ({ children }) => {
  const [plan, setPlan] = useState(null) 

  return (
    <PlanContext.Provider value={{ plan, setPlan}}>
      {children}
    </PlanContext.Provider>
  )
}
