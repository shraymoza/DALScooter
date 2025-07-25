"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Star, MessageSquare, Send, RefreshCw, Filter, AlertCircle } from "lucide-react"
import { getUserGroup, isRegisteredUser } from "../utils/auth"

export default function Feedback() {
  const [rating, setRating] = useState(0)
  const [type, setType] = useState("")
  const [model, setModel] = useState("")
  const [availableVehicles, setAvailableVehicles] = useState([])
  const [availableModels, setAvailableModels] = useState([])
  const [comment, setComment] = useState("")
  const [message, setMessage] = useState("")
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [filterModel, setFilterModel] = useState("")

  const FEEDBACK_API = import.meta.env.VITE_FEEDBACK_API
  const API_BASE = import.meta.env.VITE_BIKE_CRUD_API
  const userGroups = getUserGroup()
  const canSubmitFeedback = isRegisteredUser()

  // Fetch all feedbacks
  const fetchFeedbacks = async (modelFilter = "") => {
    try {
      setLoading(true)
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
      setMessage("Failed to load feedbacks. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicles = async () => {
    try {
      const response = await fetch(`${API_BASE}/bikes`)
      if (response.ok) {
        const vehicles = await response.json()
        setAvailableVehicles(vehicles)
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error)
    }
  }

  useEffect(() => {
    fetchFeedbacks()
    fetchVehicles()
  }, [])

  const handleTypeChange = (selectedType) => {
    setType(selectedType)
    setModel("") // Reset model when type changes

    // Filter models based on selected type
    const modelsForType = availableVehicles
      .filter((vehicle) => vehicle.type === selectedType)
      .map((vehicle) => vehicle.model)

    // Remove duplicates
    const uniqueModels = [...new Set(modelsForType)]
    setAvailableModels(uniqueModels)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!canSubmitFeedback) {
      setMessage("Please log in to submit feedback.")
      return
    }

    if (!type || !model || !comment || rating === 0) {
      setMessage("Please fill in all required fields and provide a rating.")
      return
    }

    try {
      setSubmitting(true)
      setMessage("")

      const token = localStorage.getItem("token")
      if (!token) {
        setMessage("Authentication required. Please log in again.")
        return
      }

      // Find the selected bike's ID from the full vehicle list
      const selectedVehicle = availableVehicles.find(
        (v) => v.type === type && v.model === model
      )

      if (!selectedVehicle || !selectedVehicle.bikeId) {
        setMessage("Bike ID not found. Please try selecting another model.")
        return
      }

      const feedbackData = {
        bikeId: selectedVehicle.bikeId,
        type: type.trim(),
        model: model.trim(),
        comment: comment.trim(),
        rating: Number.parseInt(rating),
      }

      const response = await fetch(`${FEEDBACK_API}/submit-feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(feedbackData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      // Success - clear form and show confirmation
      setRating(0)
      setType("")
      setModel("")
      setComment("")
      setAvailableModels([])
      setMessage("Thank you for your feedback! Your review has been submitted successfully.")

      // Refresh feedbacks to show the new one
      setTimeout(() => {
        fetchFeedbacks(filterModel)
      }, 1000)
    } catch (error) {
      console.error("Error submitting feedback:", error)
      setMessage(`Failed to submit feedback: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

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

  const StarRating = ({ rating, setRating, readonly = false }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && setRating && setRating(star)}
            disabled={readonly}
            className={`p-1 transition-colors duration-200 ${readonly ? "cursor-default" : "cursor-pointer"} ${
              star <= rating ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"
            }`}
          >
            <Star className="h-6 w-6 fill-current" />
          </button>
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
            <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200">
              <ArrowLeft className="h-6 w-6 text-slate-600" />
            </Link>
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-800">Customer Feedback</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Submit Feedback Form - Only for Registered Users */}
        {canSubmitFeedback && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-8">Share Your Experience</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Bike Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vehicle Type */}
                <div>
                  <label className="block text-lg font-semibold text-slate-800 mb-3">Vehicle Type *</label>
                  <select
                    value={type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg bg-white/80 backdrop-blur-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none"
                    required
                    disabled={submitting}
                  >
                    <option value="">Select Vehicle Type</option>
                    <option value="eBike">eBike</option>
                    <option value="Gyroscooter">Gyroscooter</option>
                    <option value="Segway">Segway</option>
                  </select>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-slate-800 mb-3">Model *</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg bg-white/80 backdrop-blur-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none"
                    required
                    disabled={submitting || !type}
                  >
                    <option value="">Select Model</option>
                    {availableModels.map((modelOption) => (
                      <option key={modelOption} value={modelOption}>
                        {modelOption}
                      </option>
                    ))}
                  </select>
                  {!type && <p className="text-sm text-slate-500 mt-1">Please select a vehicle type first</p>}
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-lg font-semibold text-slate-800 mb-4">Overall Rating *</label>
                <div className="flex items-center space-x-4">
                  <StarRating rating={rating} setRating={setRating} />
                  <span className="text-lg text-slate-600">
                    {rating > 0 && (
                      <span className="font-semibold">
                        {rating === 1 && "Poor"}
                        {rating === 2 && "Fair"}
                        {rating === 3 && "Good"}
                        {rating === 4 && "Very Good"}
                        {rating === 5 && "Excellent"}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-lg font-semibold text-slate-800 mb-3">Your Feedback *</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience with this bike..."
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg bg-white/80 backdrop-blur-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none placeholder-slate-400 resize-none"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-400 text-white border-none rounded-lg py-4 px-6 text-xl font-bold cursor-pointer transition-all duration-200 hover:from-indigo-600 hover:to-blue-500 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Submit Feedback</span>
                  </>
                )}
              </button>
            </form>

            {message && (
              <div
                className={`mt-6 p-4 rounded-xl backdrop-blur-sm border ${
                  message.includes("successfully") || message.includes("Thank you")
                    ? "bg-green-100/80 border-green-200 text-green-800"
                    : "bg-red-100/80 border-red-200 text-red-800"
                }`}
              >
                <p className="text-lg font-semibold">{message}</p>
              </div>
            )}
          </div>
        )}

        {/* Feedback Display Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-800 mb-4 sm:mb-0">All Customer Feedback</h3>

            {/* Filter and Refresh */}
            <div className="flex items-center space-x-4">
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

          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">Loading feedback...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">
                {filterModel ? `No feedback found for ${filterModel}` : "No feedback available yet"}
              </p>
              <p className="text-slate-500 text-sm mt-2">
                {canSubmitFeedback ? "Be the first to share your experience!" : "Check back later for customer reviews"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200/50">
                    <th className="text-left py-4 px-4 font-semibold text-slate-800">Type</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-800">Model</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-800">User</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-800">Rating</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-800">Comment</th>
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
                      <td className="py-4 px-4 text-slate-600">{feedback.userEmail || "Anonymous"}</td>
                      <td className="py-4 px-4">
                        {feedback.rating ? (
                          <StarRating rating={feedback.rating} readonly={true} />
                        ) : (
                          <span className="text-slate-400">No rating</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-700 max-w-xs">
                        <div className="truncate" title={feedback.comment}>
                          {feedback.comment || "No comment"}
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
        </div>
      </div>
    </div>
  )
}
