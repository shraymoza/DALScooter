"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Bike, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Filter,
  RefreshCw,
  Search,
  Users,
  TrendingUp,
  Eye
} from "lucide-react"
import { isAdmin } from "../utils/auth"

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0
  })
  
  const BOOKING_API = import.meta.env.VITE_BOOKING_API
  const token = localStorage.getItem("token")

  useEffect(() => {
    if (!isAdmin()) {
      window.location.href = "/dashboard"
      return
    }
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
        calculateStats(data.bookings || [])
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

  const calculateStats = (bookings) => {
    const stats = {
      total: bookings.length,
      active: 0,
      upcoming: 0,
      completed: 0,
      cancelled: 0
    }

    bookings.forEach(booking => {
      const status = getBookingStatus(booking)
      if (status === 'active') stats.active++
      else if (status === 'upcoming') stats.upcoming++
      else if (status === 'completed') stats.completed++
      else if (status === 'cancelled') stats.cancelled++
    })

    setStats(stats)
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
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredBookings = bookings.filter(booking => {
    const status = getBookingStatus(booking)
    const matchesFilter = filter === 'all' || status === filter
    const matchesSearch = searchTerm === '' || 
      booking.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bikeModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bikeType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
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
              <TrendingUp className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-800">Booking Management</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Bookings</p>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Upcoming</p>
                <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Completed</p>
                <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
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
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-slate-600" />
                <input
                  type="text"
                  placeholder="Search by email, vehicle, or booking ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border-2 border-slate-300 rounded-lg bg-white/80 backdrop-blur-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none min-w-[300px]"
                />
              </div>
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
              <p className="text-slate-500">
                {searchTerm ? "No bookings match your search criteria." : "No bookings available."}
              </p>
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
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800">
                              {booking.bikeModel} - {booking.bikeType}
                            </h3>
                            <p className="text-sm text-slate-600">{booking.userEmail}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-slate-600">
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
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span className="font-mono text-xs">{booking.bookingId.slice(0, 8)}...</span>
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
                    <h3 className="font-semibold text-slate-800 mb-2">Customer</h3>
                    <p className="text-slate-600">{selectedBooking.userEmail}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Vehicle</h3>
                    <p className="text-slate-600">{selectedBooking.bikeModel} - {selectedBooking.bikeType}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Status</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(getBookingStatus(selectedBooking))}`}>
                      {getBookingStatus(selectedBooking).charAt(0).toUpperCase() + getBookingStatus(selectedBooking).slice(1)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Booking ID</h3>
                    <p className="text-slate-600 font-mono text-sm">{selectedBooking.bookingId}</p>
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
                    <h3 className="font-semibold text-slate-800 mb-2">Created</h3>
                    <p className="text-slate-600">{formatDateTime(selectedBooking.createdAt)}</p>
                  </div>
                </div>

                {selectedBooking.notes && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Customer Notes</h3>
                    <p className="text-slate-600 italic">"{selectedBooking.notes}"</p>
                  </div>
                )}

                {selectedBooking.updatedAt && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Last Updated</h3>
                    <p className="text-slate-600">{formatDateTime(selectedBooking.updatedAt)}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200"
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