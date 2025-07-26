"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Calendar, Clock, MapPin, Bike, X, CheckCircle, XCircle, AlertCircle, Trash2, Eye } from "lucide-react"

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [filter, setFilter] = useState("all") // all, confirmed, cancelled, completed
  const [dateFilter, setDateFilter] = useState("")

  const API_BASE = import.meta.env.VITE_BOOKING_API

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      
      let url = `${API_BASE}/bookings`
      const params = new URLSearchParams()
      
      if (filter !== "all") {
        params.append("status", filter)
      }
      if (dateFilter) {
        params.append("date", dateFilter)
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url, {
        headers: {
          Authorization: token,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch bookings")
      }

      const data = await response.json()
      setBookings(data.bookings || [])
      setError("")
    } catch (err) {
      setError("Failed to load bookings")
      console.error("Error fetching bookings:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/bookings/${bookingId}`, {
        method: "DELETE",
        headers: {
          Authorization: token,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to cancel booking")
      }

      // Refresh bookings list
      fetchBookings()
    } catch (err) {
      setError(err.message)
      console.error("Error cancelling booking:", err)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "completed":
        return <CheckCircle className="h-5 w-5 text-blue-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(":")
    const time = new Date()
    time.setHours(parseInt(hours), parseInt(minutes))
    return time.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const filteredBookings = bookings.filter((booking) => {
    if (filter !== "all" && booking.status !== filter) return false
    if (dateFilter && booking.bookingDate !== dateFilter) return false
    return true
  })

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
              <Bike className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-800">My Bookings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Status Filter</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg bg-white/80 backdrop-blur-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none"
              >
                <option value="all">All Bookings</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Date Filter</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg bg-white/80 backdrop-blur-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilter("all")
                  setDateFilter("")
                }}
                className="px-6 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading your bookings...</p>
          </div>
        )}

        {/* Bookings List */}
        {!loading && (
          <div className="space-y-6">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <Bike className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">No bookings found</h3>
                <p className="text-slate-500 mb-6">You haven't made any bookings yet.</p>
                <Link
                  to="/booking"
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                >
                  Book Your First Ride
                </Link>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <div
                  key={booking.bookingId}
                  className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <h3 className="text-xl font-bold text-slate-800">
                          {booking.vehicleType} - {booking.vehicleModel}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5 text-slate-500" />
                          <span className="text-slate-700">{formatDate(booking.bookingDate)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-5 w-5 text-slate-500" />
                          <span className="text-slate-700">
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-5 w-5 text-slate-500" />
                          <span className="text-slate-700">{booking.pickupLocation}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-indigo-600">${booking.totalCost}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <span>Ref: {booking.bookingReference}</span>
                        <span>Access Code: {booking.accessCode}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking)
                          setShowDetails(true)
                        }}
                        className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      {booking.status === "confirmed" && (
                        <button
                          onClick={() => handleCancelBooking(booking.bookingId)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Cancel Booking"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Booking Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                >
                  <X className="h-6 w-6 text-slate-600" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Booking Reference</label>
                    <p className="text-lg font-mono bg-slate-100 px-3 py-2 rounded">{selectedBooking.bookingReference}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Status</label>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedBooking.status)}
                      <span className="text-lg font-semibold capitalize">{selectedBooking.status}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Vehicle</label>
                    <p className="text-lg">{selectedBooking.vehicleType} - {selectedBooking.vehicleModel}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Access Code</label>
                    <p className="text-lg font-mono bg-slate-100 px-3 py-2 rounded">{selectedBooking.accessCode}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Date</label>
                    <p className="text-lg">{formatDate(selectedBooking.bookingDate)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Time</label>
                    <p className="text-lg">{formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Pickup Location</label>
                  <p className="text-lg">{selectedBooking.pickupLocation}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Hourly Rate</label>
                    <p className="text-lg">${selectedBooking.hourlyRate}/hr</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Total Cost</label>
                    <p className="text-2xl font-bold text-indigo-600">${selectedBooking.totalCost}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Created</label>
                    <p className="text-sm text-slate-500">{new Date(selectedBooking.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Last Updated</label>
                    <p className="text-sm text-slate-500">{new Date(selectedBooking.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                {selectedBooking.status === "confirmed" && (
                  <button
                    onClick={() => {
                      handleCancelBooking(selectedBooking.bookingId)
                      setShowDetails(false)
                    }}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    Cancel Booking
                  </button>
                )}
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-3 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 