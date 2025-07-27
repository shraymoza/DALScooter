"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Bike, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Edit,
  Trash2,
  Eye,
  Filter,
  RefreshCw
} from "lucide-react"

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")
  const [filter, setFilter] = useState("all") // all, active, upcoming, past, cancelled
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    duration: 1,
    notes: ""
  })
  
  const BOOKING_API = import.meta.env.VITE_BOOKING_API
  const token = localStorage.getItem("token")

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${BOOKING_API}/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings || [])
      } else {
        throw new Error('Failed to fetch bookings')
      }
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setMessage("Error loading bookings. Please try again.")
      setMessageType("error")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return

    try {
      const response = await fetch(`${BOOKING_API}/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setMessage("Booking cancelled successfully!")
        setMessageType("success")
        fetchBookings() // Refresh the list
      } else {
        const result = await response.json()
        setMessage(result.error || "Failed to cancel booking")
        setMessageType("error")
      }
    } catch (error) {
      console.error("Error cancelling booking:", error)
      setMessage("Network error. Please try again.")
      setMessageType("error")
    }
  }

  const handleEditBooking = async (e) => {
    e.preventDefault()
    
    try {
      // Create proper ISO datetime strings with timezone handling
      // Convert local time to UTC for storage
      // Use same date for both start and end
      const startDateTime = new Date(`${editForm.startDate}T${editForm.startTime}:00Z`).toISOString()
      const endDateTime = new Date(`${editForm.startDate}T${editForm.endTime}:00Z`).toISOString()
      
      const updateData = {
        startDate: startDateTime,
        endDate: endDateTime,
        duration: calculateDuration(),
        notes: editForm.notes
      }
      
      const response = await fetch(`${BOOKING_API}/bookings/${selectedBooking.bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        setMessage("Booking updated successfully!")
        setMessageType("success")
        setShowEditModal(false)
        fetchBookings() // Refresh the list
      } else {
        const result = await response.json()
        setMessage(result.error || "Failed to update booking")
        setMessageType("error")
      }
    } catch (error) {
      console.error("Error updating booking:", error)
      setMessage("Network error. Please try again.")
      setMessageType("error")
    }
  }

  const openEditModal = (booking) => {
    setSelectedBooking(booking)
    
    // Extract date and time from ISO strings
    const startDateTime = new Date(booking.startDate)
    const endDateTime = new Date(booking.endDate)
    
    // Format time as HH:MM in UTC to match database storage
    const formatTime = (date) => {
      return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'UTC'
      })
    }
    
    setEditForm({
      startDate: startDateTime.toISOString().split('T')[0],
      startTime: formatTime(startDateTime),
      endTime: formatTime(endDateTime),
      duration: booking.duration,
      notes: booking.notes || ""
    })
    setShowEditModal(true)
  }

  // Calculate duration based on start and end times
  const calculateDuration = () => {
    if (editForm.startDate && editForm.startTime && editForm.endTime) {
      const startDateTime = new Date(`${editForm.startDate}T${editForm.startTime}:00`)
      const endDateTime = new Date(`${editForm.startDate}T${editForm.endTime}:00`)
      const diffHours = (endDateTime - startDateTime) / (1000 * 60 * 60)
      return Math.max(1, Math.ceil(diffHours))
    }
    return editForm.duration
  }

  const getBookingStatus = (booking) => {
    const now = new Date()
    const startDate = new Date(booking.startDate)
    const endDate = new Date(booking.endDate)

    if (booking.status === 'cancelled') return 'cancelled'
    if (booking.status === 'completed') return 'completed'
    if (now < startDate) return 'upcoming'
    if (now >= startDate && now <= endDate) return 'active'
    return 'past'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      case 'past':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    // Use UTC time to avoid timezone conversion issues
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    })
  }

  const filteredBookings = bookings.filter(booking => {
    const status = getBookingStatus(booking)
    if (filter === 'all') return true
    return status === filter
  })

  const getMessageIcon = () => {
    switch (messageType) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-blue-600" />
    }
  }

  const getMessageStyle = () => {
    switch (messageType) {
      case "success":
        return "bg-green-50/80 border-green-200 text-green-800"
      case "error":
        return "bg-red-50/80 border-red-200 text-red-800"
      default:
        return "bg-blue-50/80 border-blue-200 text-blue-800"
    }
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
              <Calendar className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-800">My Bookings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter and Refresh */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-slate-600" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border-2 border-slate-300 rounded-lg bg-white/80 backdrop-blur-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none"
              >
                <option value="all">All Bookings</option>
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="past">Past</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button
              onClick={fetchBookings}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
              <span className="ml-3 text-slate-600">Loading bookings...</span>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">No bookings found</h3>
              <p className="text-slate-500 mb-6">
                {filter === 'all' 
                  ? "You haven't made any bookings yet." 
                  : `No ${filter} bookings found.`
                }
              </p>
              <Link
                to="/booking"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all duration-200"
              >
                <Bike className="h-4 w-4" />
                <span>Book a Ride</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => {
                const status = getBookingStatus(booking)
                return (
                  <div
                    key={booking.bookingId}
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-slate-800">
                            {booking.bikeModel} - {booking.bikeType}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(booking.startDate)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(booking.startDate)} - {formatTime(booking.endDate)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Bike className="h-4 w-4" />
                            <span>{booking.duration} hour{booking.duration !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {booking.notes && (
                          <p className="text-sm text-slate-500 mt-2 italic">
                            "{booking.notes}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedBooking(booking)
                            setShowDetails(true)
                          }}
                          className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {status === 'upcoming' && (
                          <>
                            <button
                              onClick={() => openEditModal(booking)}
                              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              title="Edit Booking"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCancelBooking(booking.bookingId)}
                              className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Cancel Booking"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mt-6 p-4 border rounded-lg flex items-center space-x-3 ${getMessageStyle()}`}>
            {getMessageIcon()}
            <p className="font-semibold">{message}</p>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Booking Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                >
                  <XCircle className="h-6 w-6 text-slate-600" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Vehicle</h3>
                    <p className="text-slate-600">{selectedBooking.bikeModel} - {selectedBooking.bikeType}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Status</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(getBookingStatus(selectedBooking))}`}>
                      {getBookingStatus(selectedBooking).charAt(0).toUpperCase() + getBookingStatus(selectedBooking).slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Start Time</h3>
                    <p className="text-slate-600">{formatDateTime(selectedBooking.startDate)}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">End Time</h3>
                    <p className="text-slate-600">{formatDateTime(selectedBooking.endDate)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Duration</h3>
                    <p className="text-slate-600">{selectedBooking.duration} hour{selectedBooking.duration !== 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Booking ID</h3>
                    <p className="text-slate-600 font-mono text-sm">{selectedBooking.bookingId}</p>
                  </div>
                </div>

                {selectedBooking.notes && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Notes</h3>
                    <p className="text-slate-600 italic">"{selectedBooking.notes}"</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Created</h3>
                    <p className="text-slate-600">{formatDateTime(selectedBooking.createdAt)}</p>
                  </div>
                  {selectedBooking.updatedAt && (
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">Last Updated</h3>
                      <p className="text-slate-600">{formatDateTime(selectedBooking.updatedAt)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200"
                >
                  Close
                </button>
                {getBookingStatus(selectedBooking) === 'upcoming' && (
                  <button
                    onClick={() => handleCancelBooking(selectedBooking.bookingId)}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {showEditModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Edit Booking</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                >
                  <XCircle className="h-6 w-6 text-slate-600" />
                </button>
              </div>

              <form onSubmit={handleEditBooking} className="space-y-6">
                {/* Vehicle at the top */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Vehicle
                  </label>
                  <input
                    type="text"
                    value={`${selectedBooking.bikeModel} - ${selectedBooking.bikeType}`}
                    disabled
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg bg-slate-100 text-slate-600"
                  />
                </div>

                {/* Date and Duration fields in 2-column layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={editForm.startDate}
                      onChange={(e) => setEditForm({...editForm, startDate: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg bg-white transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Duration (Auto-calculated)
                    </label>
                    <input
                      type="text"
                      value={`${calculateDuration()} hour${calculateDuration() !== 1 ? 's' : ''}`}
                      disabled
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg bg-slate-100 text-slate-600"
                    />
                  </div>
                </div>

                {/* Start and End Time fields in 2-column layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={editForm.startTime}
                      onChange={(e) => setEditForm({...editForm, startTime: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg bg-white transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={editForm.endTime}
                      onChange={(e) => setEditForm({...editForm, endTime: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg bg-white transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                    rows="3"
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg bg-white transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none"
                    placeholder="Any special requests or notes..."
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200"
                  >
                    Update Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 