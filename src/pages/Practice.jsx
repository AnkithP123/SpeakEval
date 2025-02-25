import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import Card from "../components/Card"

export default function Practice() {
  const [code, setPracticeCode] = useState("")
  const [name, setName] = useState("")
  const [step, setStep] = useState(1)
  const navigate = useNavigate()

  const handleVerifyCode = async () => {
    try {
      const res = await fetch(`https://www.server.speakeval.org/verify_practice?code=${code}`)
      const data = await res.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      setStep(2)
    } catch (err) {
      console.error("Error verifying practice code", err)
      toast.error("Error verifying practice code")
    }
  }

  const handleStartPractice = async () => {
    if (!name) {
      toast.error("Please enter your name")
      return
    }

    try {
      const res = await fetch(`https://www.server.speakeval.org/join_practice?code=${code}&name=${name}`)
      const data = await res.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      navigate(`/practice-exam?code=${code}&name=${name}&uuid=${data.uuid}`)
    } catch (err) {
      console.error("Error joining practice exam", err)
      toast.error("Error joining practice exam")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card bg="bg-[#E6F3FF]" className="max-w-md mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Practice Exam</h1>

        {step === 1 ? (
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-semibold mb-2">Practice Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setPracticeCode(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Enter practice code"
              />
            </div>

            <button
              onClick={handleVerifyCode}
              className="w-full bg-black text-white rounded-lg px-4 py-2 hover:bg-[#3666a3] transition-colors"
            >
              Next
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-semibold mb-2">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Enter your name"
                maxLength={20}
              />
            </div>

            <button
              onClick={handleStartPractice}
              className="w-full bg-black text-white rounded-lg px-4 py-2 hover:bg-[#3666a3] transition-colors"
            >
              Start Practice
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}

