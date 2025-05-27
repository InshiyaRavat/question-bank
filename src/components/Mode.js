'use client'
import { UserButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

const Mode = () => {
    const [isTest, setIsTest] = useState(false)
    const [isTimed, setIsTimedTest] = useState(false)
    const [isStopwatchEnabled, setIsStopwatchEnabled] = useState(false)
    const router = useRouter()

    const handleSelection = (e) => {
        setIsTest(e.target.value === 'test')
    }

    const handleTypeChange = (e) => {
        setIsTimedTest(e.target.value === 'timed')
    }

    const handleStopwatchToggle = (e) => {
        setIsStopwatchEnabled(e.target.checked)
    }

    const handleClick = () => {
        if (isTest) {
            router.push(`/Questions?type=${isTimed ? 'timed' : 'untimed'}`)
        } else {
            const stopwatchParam = isStopwatchEnabled ? 'on' : 'off'
            router.push(`/Questions?type=practice&stopwatch=${stopwatchParam}`)
        }
    }

    return (
        <div>
            <UserButton/>
            {/* Mode Selection */}
            <div className="flex justify-start space-x-6 p-4">
                {['Practice', 'Test'].map((mode, index) => (
                    <label key={index} className="relative flex cursor-pointer">
                        <input
                            type="radio"
                            name="mode"
                            value={mode.toLowerCase()}
                            onChange={handleSelection}
                            defaultChecked={index === 0}
                            className="hidden"
                        />
                        <span className={`px-6 py-3 rounded-full font-medium transition-all shadow-md ${
                            isTest === (index === 1) 
                                ? 'bg-blue-600 text-white shadow-blue-400' 
                                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}>
                            {mode} Mode
                        </span>
                    </label>
                ))}
            </div>

            {/* Stopwatch toggle for Practice Mode */}
            {!isTest && (
                <div className="flex justify-start ml-3 mt-4">
                    <label className="flex items-center space-x-3 bg-gray-200 p-3 rounded-lg shadow-inner">
                        <input
                            type="checkbox"
                            checked={isStopwatchEnabled}
                            onChange={handleStopwatchToggle}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded-lg focus:ring focus:ring-blue-400"
                        />
                        <span className="text-gray-800 font-medium">Enable Stopwatch</span>
                    </label>
                </div>
            )}

            {/* Test Type Options */}
            {isTest && (
                <div className="flex justify-center space-x-6 p-4">
                    {['Timed', 'Untimed'].map((type, index) => (
                        <label key={index} className="relative flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                value={type.toLowerCase()}
                                onChange={handleTypeChange}
                                className="hidden"
                            />
                            <span className={`px-6 py-3 rounded-full font-medium transition-all shadow-md ${
                                isTimed === (index === 0) 
                                    ? 'bg-green-500 text-white shadow-green-400' 
                                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                            }`}>
                                {type} Test
                            </span>
                        </label>
                    ))}
                </div>
            )}

            {/* Start Button */}
            <div className="flex justify-center mt-6">
                <button
                    className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition-all hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onClick={handleClick}
                >
                    🚀 Start
                </button>
            </div>
        </div>
    )
}

export default Mode
