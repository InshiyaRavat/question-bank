import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const CountdownTimer = ({initialTimer,...props}) => {

    const [timeLeft, setTimeLeft] = useState(initialTimer)
    const router = useRouter()

    useEffect(()=>{
        if(timeLeft <= 1){
            localStorage.setItem('correctQuestions',props.correctQuestions);
            localStorage.setItem('incorrectQuestions',props.incorrectQuestions);
            router.push(`/Result?score=${props.score}&incorrectCount=${props.incorrectCount}&correctCount=${props.correctCount}`);
        }

        const timer = setInterval(()=>{
            setTimeLeft((prevTime) => prevTime -1)
        },1000)

        return ()=> clearInterval(timer)
    },[timeLeft])

    const formatTime = (time) =>{
        const minutes = Math.floor(time/60)
        const seconds = time%60
        return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`
    }
  return (
    <div className={`border rounded-lg p-3 shadow-sm  ${timeLeft<10 ? 'border-red-500 text-red-700 bg-red-100' :  'border-blue-500 text-blue-700 bg-blue-100'} `}>Time left: {formatTime(timeLeft)}</div>
  )
}

export default CountdownTimer