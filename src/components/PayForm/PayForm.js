'use client'
import React, { useContext, useState, useEffect } from 'react'
import { useElements, useStripe, CardElement } from '@stripe/react-stripe-js'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { PlanContext } from '@/context/PlanContext'
import { useUser } from '@clerk/nextjs'

const PayForm = () => {
    const stripe = useStripe()
    const elements = useElements()
    const router = useRouter()
    const { plan } = useContext(PlanContext)
    const { user, isLoaded } = useUser()
    const [loading, setLoading] = useState(false)
    const userEmail = isLoaded && user ? user.emailAddresses[0]?.emailAddress : null

    useEffect(() => {
        if (!isLoaded) {
            console.log("Loading user data...");
        }
    }, [isLoaded]);

    const onSubmit = async (e) => {
        e.preventDefault()
        const cardElement = elements?.getElement(CardElement)

        if (!stripe || !cardElement) return

        try {
            setLoading(true)
            console.log("calling api with plan =", plan)

            const { data } = await axios.post('/api/create-payment-intent', {
                amount: plan,
            })
            const clientSecret = data.clientSecret

            const { error } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: { card: cardElement },
            })

            if (error) {
                console.error(error.message)
            } else {
                const subscriptionResponse = await fetch(`/api/subscription?userid=${user.id}`);
                const subscriptionData = await subscriptionResponse.json();
                const months = plan == 10 ? 6 : 12;

                if (!subscriptionData.success || !subscriptionData.subscription) {
                    // Create new subscription
                    const createRes = await fetch(`/api/subscription`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userid: user.id, status: 'active', duration: months }),
                    });
                    if (!createRes.ok) console.log("Error while adding new subscriber");
                } else {
                    // If user already has a subscription, extend or reactivate
                    const sub = subscriptionData.subscription;
                    const now = new Date();
                    let newStart = new Date(sub.subscribedAt);
                    // If expired or inactive, restart from now; else extend from current expiry
                    const currentExpiry = new Date(newStart);
                    currentExpiry.setMonth(currentExpiry.getMonth() + (sub.duration || 0));
                    if (now > currentExpiry || sub.status !== 'active') {
                        newStart = now;
                    }
                    await fetch(`/api/subscription/${sub.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'active', duration: months, subscribedAt: newStart.toISOString() }),
                    });
                }

                console.log('payment successfull')
                console.log('sending email to(payform): ', user.emailAddresses[0].emailAddress)

                const response = await fetch('/api/email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: userEmail, html: `
        <h1>Thank You for Your Payment!</h1>
        <p>Your payment was successful. Here is your invoice:</p>
        <ul>
          <li>Plan: ${plan == 10 ? '6 months plan' : '12 months plan'}</li$>
          <li>Amount Paid: £${plan}</li>
        </ul>
      `, subject: 'Payment Invoice'
                    }),
                })
                console.log(response)
                if (!response.ok) {
                    console.log("failed to send email")
                }
                else {
                    console.log("email sent successfullly! ")
                }
                router.push('/question-topic')
            }
        } catch (error) {
            console.error('Error during payment submission:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold text-center text-gray-800 mb-6">Enter your payment details</h3>

                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="border p-4 rounded-md shadow-sm">
                            <CardElement className="w-full py-2 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={!stripe || loading}
                        className={`w-full py-2 px-4 rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    >
                        {loading ? 'Processing...' : 'Pay Now'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default PayForm
