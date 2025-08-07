'use client'
import React from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import PayForm from '@/components/PayForm/PayForm'
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

export default function PaymentForm() {
  return (
    <Elements stripe={stripePromise}>
      <PayForm/>  
    </Elements>
  )
}
