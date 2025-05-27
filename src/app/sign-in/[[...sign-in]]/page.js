'use client'
import { PlanContext } from '@/context/PlanContext'
import { useRouter } from "next/navigation"
import { SignIn } from "@clerk/nextjs"
import { useEffect, useContext } from "react"

export default function Page() {
  const { isSubscribed } = useContext(PlanContext)
  const router = useRouter()

  useEffect(() => {
    if (isSubscribed) {
      router.push("/question")
    }
  }, [isSubscribed, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200">
      <div className=" rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Welcome 👋</h2>
        <SignIn />
      </div>
    </div>
  )
}
