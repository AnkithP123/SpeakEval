"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import Card from "../components/Card"
import "../styles/globals3.css"

export default function Practice() {
  const [code, setPracticeCode] = useState("")
  const [name, setName] = useState("")
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hoverButton, setHoverButton] = useState(false)
  const navigate = useNavigate()

  const handleVerifyCode = async () => {
    if (!code) {
      toast.error("Please enter a practice code")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`https://www.server.speakeval.org/verify_practice?code=${code}`)
      const data = await res.json()

      if (data.error) {
        toast.error(data.error)
      } else {
        setStep(2)
      }
    } catch (err) {
      console.error("Error verifying practice code", err)
      toast.error("Error verifying practice code")
    } finally {
      setLoading(false)
    }
  }

  const handleStartPractice = async () => {
    if (!name) {
      toast.error("Please enter your name")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`https://www.server.speakeval.org/join_practice?code=${code}&name=${name}`)
      const data = await res.json()

      if (data.error) {
        toast.error(data.error)
      } else {
        navigate(`/practice-exam?code=${code}&name=${name}&uuid=${data.uuid}`)
      }
    } catch (err) {
      console.error("Error joining practice exam", err)
      toast.error("Error joining practice exam")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e, setter) => {
    if (e.target.value.length <= 20) {
      setter(e.target.value)
    }
  }

  return (
    <div className="flex-grow flex items-center justify-center mt-[4.5%]">
      <title hidden>Join Practice</title>
      <Card className="w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Join Practice</h2>
        {step === 1 ? (
          <div className="w-full mb-4 space-y-6">
            <div className="space-y-2">
              <label className="block text-lg font-semibold text-white" htmlFor="practiceCode">
                Practice Code
              </label>
              <input
                id="practiceCode"
                type="text"
                value={code}
                onChange={(e) => handleInputChange(e, setPracticeCode)}
                className="w-full p-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="Enter practice code"
                disabled={loading}
                onKeyUp={(e) => e.key === "Enter" && handleVerifyCode()}
              />
            </div>
            <button
              onClick={handleVerifyCode}
              onMouseEnter={() => setHoverButton(true)}
              onMouseLeave={() => setHoverButton(false)}
              className={`btn btn-primary w-full relative overflow-hidden transition-all duration-300`}
              disabled={loading}
            >
              <span className="relative z-10">{loading ? "Loading..." : "Next"}</span>
            </button>
          </div>
        ) : (
          <div className="w-full mb-4 space-y-4">
            <div className="space-y-2">
              <label className="block text-lg font-semibold text-white" htmlFor="name">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => handleInputChange(e, setName)}
                className="w-full p-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="Enter your name"
                disabled={loading}
                onKeyUp={(e) => e.key === "Enter" && handleStartPractice()}
              />
            </div>
            <button
              onClick={handleStartPractice}
              onMouseEnter={() => setHoverButton(true)}
              onMouseLeave={() => setHoverButton(false)}
              className={`btn btn-primary w-full relative overflow-hidden transition-all duration-300`}
              disabled={loading}
            >
              <span className="relative z-10">{loading ? "Loading..." : "Start Practice"}</span>
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}

