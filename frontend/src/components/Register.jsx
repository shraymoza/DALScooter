"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { CognitoUserPool } from "amazon-cognito-identity-js"
import { Eye, EyeOff } from "lucide-react"

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT,
}

const userPool = new CognitoUserPool(poolData)

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [message, setMessage] = useState("")
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()

    userPool.signUp(email, password, [{ Name: "email", Value: email }], null, (err, result) => {
      if (err) {
        setMessage(err.message || JSON.stringify(err))
      } else {
        setMessage("Registration successful! Check your email for verification.")
        

        fetch(`${import.meta.env.VITE_API_BASE_URL}/store-qa`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: result.userSub,
            question,
            answer,
            email,
          }),
        })
        // navigate("/confirm")
                // Pass email to confirmation page via URL params and localStorage
        localStorage.setItem("registrationEmail", email)
        setTimeout(() => {
          navigate(`/confirm?email=${encodeURIComponent(email)}`)
        }, 1500)
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
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white text-2xl font-bold">DS</span>
            </div>
            <h2 className="text-4xl font-bold text-slate-800 mb-2">Join DALScooter</h2>
            <p className="text-slate-600 text-lg">Create your account to get started</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="relative">
              <input
                placeholder="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 border-2 border-slate-300/50 rounded-xl text-lg bg-white/70 backdrop-blur-sm transition-all duration-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 focus:outline-none focus:bg-white/90 placeholder-slate-500 shadow-sm"
                required
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <input
                placeholder="Create Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 pr-14 border-2 border-slate-300/50 rounded-xl text-lg bg-white/70 backdrop-blur-sm transition-all duration-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 focus:outline-none focus:bg-white/90 placeholder-slate-500 shadow-sm"
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

            {/* Security Question */}
            <div className="relative">
              <select
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-6 py-4 border-2 border-slate-300/50 rounded-xl text-lg bg-white/70 backdrop-blur-sm transition-all duration-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 focus:outline-none focus:bg-white/90 text-slate-700 shadow-sm"
                required
              >
                <option value="" className="text-slate-400">
                  Choose a security question
                </option>
                <option value="What is your favorite color?">What is your favorite color?</option>
                <option value="What was your first pet's name?">What was your first pet's name?</option>
                <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                <option value="What city were you born in?">What city were you born in?</option>
              </select>
            </div>

            {/* Security Answer */}
            <div className="relative">
              <input
                placeholder="Security Answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full px-6 py-4 border-2 border-slate-300/50 rounded-xl text-lg bg-white/70 backdrop-blur-sm transition-all duration-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 focus:outline-none focus:bg-white/90 placeholder-slate-500 shadow-sm"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 via-green-600 to-emerald-500 text-white border-none rounded-xl py-4 px-6 text-xl font-bold cursor-pointer transition-all duration-300 hover:from-green-600 hover:via-green-700 hover:to-emerald-600 hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 shadow-lg"
            >
              Create Account
            </button>
          </form>

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
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-green-600 font-bold hover:text-green-800 transition-colors duration-200 underline decoration-2 underline-offset-2 hover:decoration-green-800"
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