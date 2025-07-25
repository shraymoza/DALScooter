"use client"

import { useState } from "react"
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
} from "@aws-sdk/client-cognito-identity-provider"
import { useNavigate, Link } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { parseJwt } from "../utils/auth"

const cognitoClient = new CognitoIdentityProviderClient({ region: import.meta.env.VITE_AWS_REGION })

const poolData = {
  ClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT,
}

console.log("Cognito ClientId:", import.meta.env.VITE_COGNITO_USER_POOL_CLIENT)

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState(1)
  const [session, setSession] = useState(null)
  const [challengeParam, setChallengeParam] = useState({})
  const [challengeAnswer, setChallengeAnswer] = useState("")
  const [message, setMessage] = useState("")
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    initiateUserPasswordAuth()
  }

  const initiateUserPasswordAuth = async () => {
    try {
      const authCommand = new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: poolData.ClientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      })

      const response = await cognitoClient.send(authCommand)
      console.log("Initial USER_PASSWORD_AUTH response:", response)

      await initiateCustomAuth()
    } catch (err) {
      console.error("Initial auth failed:", err)
      setMessage(err.message || "Login failed.")
    }
  }

  const initiateCustomAuth = async () => {
    try {
      const customAuthCommand = new InitiateAuthCommand({
        AuthFlow: "CUSTOM_AUTH",
        ClientId: poolData.ClientId,
        AuthParameters: {
          USERNAME: email,
        },
      })

      const response = await cognitoClient.send(customAuthCommand)
      console.log("CUSTOM_AUTH initiated:", response)

      setSession(response.Session)
      setChallengeParam(response.ChallengeParameters || {})
      setStep(2)
    } catch (err) {
      console.error("Custom auth initiation failed:", err)
      setMessage(err.message || "Custom Auth failed.")
    }
  }

  const sendChallengeAnswer = async () => {
    try {
      const respondCommand = new RespondToAuthChallengeCommand({
        ChallengeName: "CUSTOM_CHALLENGE",
        ClientId: poolData.ClientId,
        ChallengeResponses: {
          USERNAME: email,
          ANSWER: challengeAnswer,
        },
        Session: session,
      })

      const response = await cognitoClient.send(respondCommand)
      console.log("Challenge response:", response)

      if (response.ChallengeName === "CUSTOM_CHALLENGE") {
        setSession(response.Session)
        setChallengeParam(response.ChallengeParameters || {})
        setChallengeAnswer("")
        setStep(step + 1)
      } else {
        const token = response.AuthenticationResult.IdToken
        localStorage.setItem("token", token)
        localStorage.setItem("userEmail", email)

        // Parse JWT and extract user groups
        const decoded = parseJwt(token)
        const groups = decoded["cognito:groups"] || []
        localStorage.setItem("userGroup", JSON.stringify(groups))

        // Show success notification
        const isAdmin = groups.includes("BikeFranchise")
        const userType = isAdmin ? "Franchise Operator" : "Registered User"
        setMessage(`Login successful! Welcome ${userType}. You will receive a notification shortly.`)

        // Simulate notification (in real app, this would be sent via SNS/SES)
        setTimeout(() => {
          console.log(`Notification sent: ${userType} ${email} has successfully signed in.`)
        }, 1000)

        // Navigate to dashboard
        setTimeout(() => {
          navigate("/dashboard")
        }, 2000)
      }
    } catch (err) {
      console.error("Challenge failed:", err)
      setMessage(err.message || "Challenge failed.")
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage:
          'url("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/login-bg.jpg-n2FE1q7SDbntG2Pxcnx7GUlIiI21Xz.jpeg")',
      }}
    >
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="w-full max-w-lg mx-4 relative z-10">
        <div className="bg-white/40 backdrop-blur-3xl rounded-3xl shadow-2xl p-10 text-center transition-all duration-300 hover:shadow-3xl border border-white/30 hover:bg-white/45">
          {/* Logo/Brand Section */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white text-2xl font-bold">DS</span>
            </div>
            <h2 className="text-4xl font-bold text-slate-800 mb-2">Welcome Back</h2>
            <p className="text-slate-600 text-lg">Sign in to your DALScooter account</p>
          </div>

          {step === 1 && (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="relative">
                <input
                  placeholder="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 border-2 border-slate-300/50 rounded-xl text-lg bg-white/70 backdrop-blur-sm transition-all duration-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none focus:bg-white/90 placeholder-slate-500 shadow-sm"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="relative">
                <input
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 pr-14 border-2 border-slate-300/50 rounded-xl text-lg bg-white/70 backdrop-blur-sm transition-all duration-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none focus:bg-white/90 placeholder-slate-500 shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors duration-200 p-1"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-500 text-white border-none rounded-xl py-4 px-6 text-xl font-bold cursor-pointer transition-all duration-300 hover:from-indigo-600 hover:via-indigo-700 hover:to-blue-600 hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 shadow-lg"
              >
                Sign In
              </button>
            </form>
          )}

          {step > 1 && (
            <div className="space-y-6">
              <div className="p-6 bg-white/60 rounded-2xl backdrop-blur-sm border border-white/40 shadow-inner">
                {challengeParam?.question ? (
                  <div className="text-slate-800">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-amber-600 text-xl">🔐</span>
                    </div>
                    <p className="font-semibold mb-3 text-lg">Security Question</p>
                    <p className="italic text-lg text-slate-700 bg-amber-50/50 p-3 rounded-lg">
                      {challengeParam.question}
                    </p>
                  </div>
                ) : challengeParam?.cipherText ? (
                  <div className="text-slate-800">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-purple-600 text-xl">🔤</span>
                    </div>
                    <p className="font-semibold mb-3 text-lg">Decode the Secret</p>
                    <div className="bg-slate-800 text-green-400 px-4 py-3 rounded-lg font-mono text-lg mb-3 border shadow-inner">
                      {challengeParam.cipherText}
                    </div>
                    <p className="text-sm text-slate-600 bg-purple-50/50 p-2 rounded-lg">
                      💡 Hint: Caesar Cipher with shift of 3
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-600">Preparing next challenge...</p>
                )}
              </div>

              <div className="space-y-4">
                <input
                  placeholder="Your Answer"
                  value={challengeAnswer}
                  onChange={(e) => setChallengeAnswer(e.target.value)}
                  className="w-full px-6 py-4 border-2 border-slate-300/50 rounded-xl text-lg bg-white/70 backdrop-blur-sm transition-all duration-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none focus:bg-white/90 placeholder-slate-500 shadow-sm"
                />
                <button
                  type="button"
                  onClick={sendChallengeAnswer}
                  className="w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-500 text-white border-none rounded-xl py-4 px-6 text-xl font-bold cursor-pointer transition-all duration-300 hover:from-indigo-600 hover:via-indigo-700 hover:to-blue-600 hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 shadow-lg"
                >
                  Submit Answer
                </button>
              </div>
            </div>
          )}

          {message && (
            <div
              className={`mt-6 p-4 rounded-xl backdrop-blur-sm border ${
                message.includes("successful")
                  ? "bg-green-100/80 border-green-200 text-green-800"
                  : "bg-red-100/80 border-red-200 text-red-800"
              }`}
            >
              <p className="text-lg font-semibold">{message}</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/30">
            <p className="text-slate-700 text-lg">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors duration-200 underline decoration-2 underline-offset-2 hover:decoration-indigo-800"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}