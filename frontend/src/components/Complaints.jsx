"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Plus, MessageSquare, Send, RefreshCw, Clock, User, AlertCircle, CheckCircle } from "lucide-react"

// JWT decode function (simple implementation)
function jwtDecode(token) {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error("Error decoding JWT:", error)
    return null
  }
}

export default function Complaints() {
  const [complaints, setComplaints] = useState([])
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [message, setMessage] = useState("")

  // New complaint form state
  const [newComplaint, setNewComplaint] = useState({
    bookingRef: "",
    complaint: "",
  })

  // Determine user role
  const token = localStorage.getItem("token")
  const decoded = token ? jwtDecode(token) : null
  const isFranchise = decoded?.["cognito:groups"]?.includes("BikeFranchise")
  const userEmail = localStorage.getItem("userEmail")

  const API_BASE = import.meta.env.VITE_COMPLAINT_API

  // Fetch complaints based on user role
  const fetchComplaints = async () => {
    try {
      setLoading(true)
      const endpoint = isFranchise ? `${API_BASE}/complaints?role=franchise` : `${API_BASE}/complaints`

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setComplaints(Array.isArray(data) ? data : [])
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error("Error fetching complaints:", error)
      setMessage("Failed to load complaints. Please try again later.")
      setComplaints([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch complaint thread by ID
  const fetchComplaintThread = async (complaintId) => {
    try {
      const response = await fetch(`${API_BASE}/complaints/${complaintId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedComplaint(data)
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error("Error fetching complaint thread:", error)
      setMessage("Failed to load complaint details.")
    }
  }

  // Submit new complaint (users only)
  const handleSubmitComplaint = async (e) => {
    e.preventDefault()

    if (!newComplaint.bookingRef.trim() || !newComplaint.complaint.trim()) {
      setMessage("Please fill in all fields.")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`${API_BASE}/submit-complaint`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingRef: newComplaint.bookingRef.trim(),
          complaint: newComplaint.complaint.trim(),
        }),
      })

      if (response.ok) {
        setMessage("Complaint submitted successfully!")
        setNewComplaint({ bookingRef: "", complaint: "" })
        setShowSubmitForm(false)
        setTimeout(() => {
            fetchComplaints() // Refresh the list
        }, 2000)
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to submit complaint")
      }
    } catch (error) {
      console.error("Error submitting complaint:", error)
      setMessage(`Error: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit reply (franchise admins only)
  const handleSubmitReply = async (complaintId) => {
    if (!replyText.trim()) {
      setMessage("Please enter a reply message.")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`${API_BASE}/complaints/${complaintId}/reply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: replyText.trim(),
        }),
      })

      if (response.ok) {
        setMessage("Reply submitted successfully!")
        setReplyText("")
        fetchComplaintThread(complaintId) // Refresh the thread
        fetchComplaints() // Refresh the list
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to submit reply")
      }
    } catch (error) {
      console.error("Error submitting reply:", error)
      setMessage(`Error: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchComplaints()
    }
  }, [])

  const formatTimestamp = (timestampUTC) => {
    try {
      return new Date(timestampUTC).toLocaleString()
    } catch (error) {
      return "Invalid date"
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "answered":
        return "bg-green-100 text-green-800"
      case "forwarded":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "answered":
        return <CheckCircle className="h-4 w-4" />
      case "forwarded":
        return <RefreshCw className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div
        className={`shadow-lg border-b ${isFranchise ? "bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600" : "bg-white/80 backdrop-blur-sm border-white/20"}`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link
              to="/dashboard"
              className={`p-2 rounded-lg transition-colors duration-200 ${isFranchise ? "hover:bg-slate-600 text-slate-300" : "hover:bg-slate-100 text-slate-600"}`}
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center space-x-3">
              <MessageSquare className={`h-8 w-8 ${isFranchise ? "text-red-400" : "text-indigo-600"}`} />
              <h1 className={`text-2xl font-bold ${isFranchise ? "text-white" : "text-slate-800"}`}>
                {isFranchise ? "Complaint Management" : "My Complaints"}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Message Display */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl border ${
              message.includes("successfully") || message.includes("submitted")
                ? "bg-green-100 border-green-200 text-green-800"
                : "bg-red-100 border-red-200 text-red-800"
            }`}
          >
            <p className="font-semibold">{message}</p>
            <button onClick={() => setMessage("")} className="mt-2 text-sm underline hover:no-underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Complaints List */}
          <div className="lg:col-span-1">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
              <div className="p-6 border-b border-slate-200/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800">
                    {isFranchise ? "All Complaints" : "Your Complaints"}
                  </h2>
                  {!isFranchise && (
                    <button
                      onClick={() => setShowSubmitForm(!showSubmitForm)}
                      className="flex items-center space-x-2 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors duration-200"
                    >
                      <Plus className="h-4 w-4" />
                      <span>New</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-slate-600">Loading complaints...</p>
                  </div>
                ) : complaints.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No complaints found</p>
                    {!isFranchise && (
                      <p className="text-slate-500 text-sm mt-2">Submit your first complaint using the button above</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {complaints.map((complaint) => (
                      <div
                        key={complaint.messageId}
                        onClick={() => fetchComplaintThread(complaint.messageId)}
                        className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm text-slate-600">{complaint.bookingRef}</span>
                          <div
                            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}
                          >
                            {getStatusIcon(complaint.status)}
                            <span className="capitalize">{complaint.status || "pending"}</span>
                          </div>
                        </div>
                        <p className="text-slate-800 text-sm line-clamp-2 mb-2">{complaint.complaint}</p>
                        <p className="text-xs text-slate-500">{formatTimestamp(complaint.timestampUTC)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {showSubmitForm && !isFranchise ? (
              /* Submit New Complaint Form */
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-slate-800 mb-6">Submit New Complaint</h3>

                <form onSubmit={handleSubmitComplaint} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Booking Reference *</label>
                    <input
                      type="text"
                      placeholder="e.g., BOOK123"
                      value={newComplaint.bookingRef}
                      onChange={(e) => setNewComplaint({ ...newComplaint, bookingRef: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white focus:border-indigo-500 focus:outline-none"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Complaint Details *</label>
                    <textarea
                      placeholder="Describe your issue in detail..."
                      value={newComplaint.complaint}
                      onChange={(e) => setNewComplaint({ ...newComplaint, complaint: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white focus:border-indigo-500 focus:outline-none resize-none"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center space-x-2 bg-indigo-500 text-white px-6 py-3 rounded-lg hover:bg-indigo-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Submit Complaint</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSubmitForm(false)}
                      className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : selectedComplaint ? (
              /* Complaint Thread View */
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
                <div className="p-6 border-b border-slate-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Complaint Details</h3>
                      <p className="text-slate-600">Booking: {selectedComplaint.bookingRef}</p>
                      {isFranchise && selectedComplaint.userEmail && (
                        <p className="text-sm text-slate-500">From: {selectedComplaint.userEmail}</p>
                      )}
                    </div>
                    <div
                      className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedComplaint.status)}`}
                    >
                      {getStatusIcon(selectedComplaint.status)}
                      <span className="capitalize">{selectedComplaint.status || "pending"}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Original Complaint */}
                  <div className="mb-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-slate-50 rounded-lg p-4">
                          <p className="text-slate-800 mb-2">{selectedComplaint.complaint}</p>
                          <p className="text-xs text-slate-500">{formatTimestamp(selectedComplaint.timestampUTC)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Responses */}
                  {selectedComplaint.responses && selectedComplaint.responses.length > 0 && (
                    <div className="space-y-4 mb-6">
                      {selectedComplaint.responses.map((response, index) => (
                        <div key={index} className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <div className="bg-indigo-50 rounded-lg p-4">
                              <p className="text-slate-800 mb-2">{response.message}</p>
                              <p className="text-xs text-slate-500">Admin • {formatTimestamp(response.timestamp)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Form (Franchise Admins Only) */}
                  {isFranchise && (
                    <div className="border-t border-slate-200 pt-6">
                      <h4 className="text-lg font-semibold text-slate-800 mb-4">Reply to Complaint</h4>
                      <div className="space-y-4">
                        <textarea
                          placeholder="Type your reply here..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white focus:border-indigo-500 focus:outline-none resize-none"
                          disabled={submitting}
                        />
                        <button
                          onClick={() => handleSubmitReply(selectedComplaint.messageId)}
                          disabled={submitting || !replyText.trim()}
                          className="flex items-center space-x-2 bg-indigo-500 text-white px-6 py-3 rounded-lg hover:bg-indigo-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              <span>Send Reply</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Default State */
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-12 border border-white/20 text-center">
                <MessageSquare className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {isFranchise ? "Select a Complaint" : "Welcome to Complaints"}
                </h3>
                <p className="text-slate-600">
                  {isFranchise
                    ? "Choose a complaint from the list to view details and respond"
                    : "Click on a complaint to view details or submit a new one"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}