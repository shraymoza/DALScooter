"use client"

import { useState, useEffect } from "react"
import { CognitoUserPool, CognitoUser } from "amazon-cognito-identity-js"
import { useNavigate, Link, useSearchParams } from "react-router-dom"
import { Lock } from "lucide-react"

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT,
}

const userPool = new CognitoUserPool(poolData)

export default function ConfirmAccount() {
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [message, setMessage] = useState("")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Get email from URL params or localStorage
    const emailFromUrl = searchParams.get("email")
    const emailFromStorage = localStorage.getItem("registrationEmail")

    if (emailFromUrl) {
      setEmail(decodeURIComponent(emailFromUrl))
    } else if (emailFromStorage) {
      setEmail(emailFromStorage)
    }
  }, [searchParams])

  const handleConfirm = (e) => {
    e.preventDefault()

    const user = new CognitoUser({ Username: email, Pool: userPool })
    user.confirmRegistration(code, true, (err, result) => {
      if (err) {
        setMessage(err.message || JSON.stringify(err))
      } else {
        setMessage("Account confirmed successfully! You can now log in.")
        // Clear the stored email after successful confirmation
        localStorage.removeItem("registrationEmail")
        setTimeout(() => navigate("/login"), 1200)
      }
    })
  }

  const handleResendCode = () => {
    const user = new CognitoUser({ Username: email, Pool: userPool })
    user.resendConfirmationCode((err, result) => {
      if (err) {
        setMessage(err.message || "Failed to resend code")
      } else {
        setMessage("Confirmation code resent! Check your email.")
      }
    })
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
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white text-2xl">📧</span>
            </div>
            <h2 className="text-4xl font-bold text-slate-800 mb-2">Verify Email</h2>
            <p className="text-slate-600 text-lg">Enter the confirmation code sent to your email</p>
          </div>

          <form className="space-y-6" onSubmit={handleConfirm}>
            {/* Email Field - Pre-filled and disabled */}
            <div className="relative">
              <input
                placeholder="Email Address"
                type="email"
                value={email}
                readOnly
                className="w-full px-6 py-4 border-2 border-slate-300/30 rounded-xl text-lg bg-slate-100/70 backdrop-blur-sm text-slate-600 shadow-sm cursor-not-allowed"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
            </div>

            {/* Confirmation Code */}
            <div className="relative">
              <input
                placeholder="Enter 6-digit confirmation code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-6 py-4 border-2 border-slate-300/50 rounded-xl text-lg bg-white/70 backdrop-blur-sm transition-all duration-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 focus:outline-none focus:bg-white/90 placeholder-slate-500 shadow-sm font-mono tracking-wider text-center"
                maxLength="6"
                pattern="[0-9]{6}"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white border-none rounded-xl py-4 px-6 text-xl font-bold cursor-pointer transition-all duration-300 hover:from-purple-600 hover:via-purple-700 hover:to-pink-600 hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 shadow-lg"
            >
              Verify Account
            </button>
          </form>

          {/* Resend Code Button */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleResendCode}
              className="text-purple-600 hover:text-purple-800 font-semibold transition-colors duration-200 underline decoration-2 underline-offset-2"
            >
              Didn't receive the code? Resend
            </button>
          </div>

          {message && (
            <div
              className={`mt-6 p-4 rounded-xl backdrop-blur-sm border ${
                message.includes("successfully") || message.includes("resent")
                  ? "bg-green-100/80 border-green-200 text-green-800"
                  : "bg-red-100/80 border-red-200 text-red-800"
              }`}
            >
              <p className="text-lg font-semibold">{message}</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/30">
            <p className="text-slate-700 text-lg">
              Back to{" "}
              <Link
                to="/login"
                className="text-purple-600 font-bold hover:text-purple-800 transition-colors duration-200 underline decoration-2 underline-offset-2 hover:decoration-purple-800"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
