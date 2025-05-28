'use client'
import React, { useContext, useEffect } from 'react'
import '../../Style/subscription.css'
import { useRouter } from 'next/navigation'
import { PlanContext } from '@/context/PlanContext'

const Subscription = () => { 
  const {plan,setPlan} = useContext(PlanContext)
  const router = useRouter()

  const handleClick = (e) => {
    const selectedPlan = e.target.dataset.value
    console.log("selectedplan: ",selectedPlan)
    setPlan(selectedPlan)    
  }

  useEffect(()=>{
    if(plan !== null){
        console.log("plan set to: ",plan)
        router.push('/PaymentForm')
    }
  },[plan])

  return (
    <div>
      <div className='flex items-center gap-10'>
        {/* 6-month plan */}
        <div className="plan">
          <div className="inner">
            <span className="pricing">
              <span>£10 <small>/ month</small></span>
            </span>
            <p className="title">6 Months</p>
            <p className="info">Subscribe to unlock full access to <strong>study materials, tests, performance tracking, and peer discussions</strong>—everything you need to excel in your learning journey!</p>
            <ul className="features">
              <li>Test mode</li>
              <li>Practice mode</li>
              <li>Performance tracking</li>
              <li>Custom study plans</li>
              <li>Exclusive updates</li>
            </ul>
            <div className="action">
              <a className="button" data-value={10} onClick={handleClick}>Buy plan</a>
            </div>
          </div>
        </div>

        {/* 12-month plan */}
        <div className="plan">
          <div className="inner">
            <span className="pricing">
              <span>£20 <small>/ month</small></span>
            </span>
            <p className="title">12 Months</p>
            <p className="info">Subscribe to unlock full access to <strong>study materials, tests, performance tracking, and peer discussions</strong>—everything you need to excel in your learning journey!</p>
            <ul className="features">
              <li>Test mode</li>
              <li>Practice mode</li>
              <li>Performance tracking</li>
              <li>Custom study plans</li>
              <li>Exclusive updates</li>
            </ul>
            <div className="action">
              <a data-value={20} onClick={handleClick} className="button">Buy plan</a>
            </div>
          </div>
        </div>
      </div>
      <h3 className='p-8'>
        <strong>Note:</strong> Features are identical across plans—only the duration (6 or 12 months) differs.
      </h3>
    </div>
  )
}

export default Subscription
