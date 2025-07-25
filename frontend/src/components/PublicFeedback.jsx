"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { MessageSquare, Star, Filter, RefreshCw, AlertCircle, Home } from "lucide-react"

export default function PublicFeedback() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterModel, setFilterModel] = useState("")
  const [availableModels, setAvailableModels] = useState([])
  const [error, setError] = useState("")

  const FEEDBACK_API = import.meta.env.VITE_FEEDBACK_API

  // Fetch all feedbacks
  const fetchFeedbacks = async (modelFilter = "") => {
    try {
      setLoading(true)
      setError("")

      const url = modelFilter
        ? `${FEEDBACK_API}/get-feedback?model=${encodeURIComponent(modelFilter)}`
        : `${FEEDBACK_API}/get-feedback`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Sort by timestamp (latest first)
      const sortedFeedbacks = Array.isArray(data)
        ? data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        : []

      setFeedbacks(sortedFeedbacks)

      // Extract unique models for filter dropdown
      const models = [...new Set(sortedFeedbacks.map((f) => f.model).filter(Boolean))]
      setAvailableModels(models)
    } catch (error) {
      console.error("Error fetching feedbacks:", error)
      setFeedbacks([])
      setError("Failed to load feedbacks. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedbacks()
  }, [])

  const handleFilterChange = (selectedModel) => {
    setFilterModel(selectedModel)
    fetchFeedbacks(selectedModel)
  }

  const getSentimentColor = (sentiment) => {
    if (!sentiment) return "bg-gray-100 text-gray-800"

    switch (sentiment.toLowerCase()) {
      case "positive":
        return "bg-green-100 text-green-800"
      case "negative":
        return "bg-red-100 text-red-800"
      case "neutral":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A"
    try {
      return new Date(timestamp).toLocaleString()
    } catch (error) {
      return "Invalid date"
    }
  }

  const StarRating = ({ rating }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className={`h-4 w-4 ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link to="/" className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200">
              <Home className="h-6 w-6 text-slate-600" />
            </Link>
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-800">Customer Reviews</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Public Feedback Display */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">What Our Customers Say</h2>
              <p className="text-slate-600">Real feedback from our DALScooter community</p>
            </div>

            {/* Filter and Refresh */}
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-slate-600" />
                <select
                  value={filterModel}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg bg-white/80 focus:border-indigo-500 focus:outline-none text-sm"
                  disabled={loading}
                >
                  <option value="">All Models</option>
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => fetchFeedbacks(filterModel)}
                disabled={loading}
                className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100/80 border border-red-200 rounded-xl">
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">Loading customer reviews...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">
                {filterModel ? `No reviews found for ${filterModel}` : "No customer reviews available yet"}
              </p>
              <p className="text-slate-500 text-sm mt-2">Check back later for customer feedback</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200/50">
                    <th className="text-left py-4 px-4 font-semibold text-slate-800">Type</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-800">Model</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-800">Customer</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-800">Rating</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-800">Review</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-800">Sentiment</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-800">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((feedback, index) => (
                    <tr
                      key={feedback.feedbackId || index}
                      className="border-b border-slate-100/50 hover:bg-slate-50/30 transition-colors duration-200"
                    >
                      <td className="py-4 px-4 font-medium text-slate-800">{feedback.type || "N/A"}</td>
                      <td className="py-4 px-4 font-medium text-slate-800">{feedback.model || "N/A"}</td>
                      <td className="py-4 px-4 text-slate-600">
                        {feedback.userEmail ? feedback.userEmail.replace(/(.{2}).*@/, "$1***@") : "Anonymous"}
                      </td>
                      <td className="py-4 px-4">
                        {feedback.rating ? (
                          <StarRating rating={feedback.rating} />
                        ) : (
                          <span className="text-slate-400 text-sm">No rating</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-700 max-w-md">
                        <div className="line-clamp-3" title={feedback.comment}>
                          {feedback.comment || "No comment provided"}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getSentimentColor(feedback.sentiment)}`}
                        >
                          {feedback.sentiment || "Unknown"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-500 text-sm">{formatTimestamp(feedback.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Call to Action for Guests */}
          <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Want to Share Your Experience?</h3>
              <p className="text-slate-600 mb-4">
                Join our community and let others know about your DALScooter experience!
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/register"
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                >
                  Sign Up Now
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                >
                  Already a Member? Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}