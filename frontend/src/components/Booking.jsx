"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Calendar, Clock, MapPin, Bike, AlertCircle, CheckCircle, XCircle } from "lucide-react"

export default function Booking() {
  const navigate = useNavigate()
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [duration, setDuration] = useState(1)
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("") // success, error, info
  const [availableVehicles, setAvailableVehicles] = useState([])
  
  const API_BASE = import.meta.env.VITE_BIKE_CRUD_API
  const BOOKING_API = import.meta.env.VITE_BOOKING_API
  const token = localStorage.getItem("token")

  useEffect(() => {
    if (!token) {
      navigate("/login")
      return
    }
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const res = await fetch(`${API_BASE}/bikes`)
      const data = await res.json()
      setVehicles(data)
      // Show all vehicles from inventory
      setAvailableVehicles(data)
    } catch (error) {
      console.error("Error fetching vehicles:", error)
      setMessage("Error loading vehicles. Please try again.")
      setMessageType("error")
    }
  }

  const locations = [
    "Halifax Downtown",
    "Dalhousie University",
    "Halifax Waterfront",
    "Spring Garden Road",
    "Citadel Hill",
  ]

  const calculateDuration = () => {
    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}`)
      const end = new Date(`2000-01-01T${endTime}`)
      const diffHours = (end - start) / (1000 * 60 * 60)
      setDuration(Math.max(1, Math.ceil(diffHours)))
    }
  }

  useEffect(() => {
    calculateDuration()
  }, [startTime, endTime])

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle)
    setMessage("")
  }

  const validateForm = () => {
    if (!selectedVehicle) {
      setMessage("Please select a vehicle")
      setMessageType("error")
      return false
    }
    if (!selectedDate) {
      setMessage("Please select a date")
      setMessageType("error")
      return false
    }
    if (!startTime || !endTime) {
      setMessage("Please select start and end times")
      setMessageType("error")
      return false
    }
    if (startTime >= endTime) {
      setMessage("End time must be after start time")
      setMessageType("error")
      return false
    }
    if (!location) {
      setMessage("Please select a pickup location")
      setMessageType("error")
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setMessage("")

    try {
      // Debug logging
      console.log("BOOKING_API:", BOOKING_API)
      console.log("Token:", token ? "Present" : "Missing")
      
      // Create ISO datetime strings
      const startDateTime = `${selectedDate}T${startTime}:00.000Z`
      const endDateTime = `${selectedDate}T${endTime}:00.000Z`

      const bookingData = {
        bikeId: selectedVehicle.bikeId,
        startDate: startDateTime,
        endDate: endDateTime,
        duration: duration,
        notes: notes
      }

      console.log("Booking data:", bookingData)

      const response = await fetch(`${BOOKING_API}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      })

      console.log("Response status:", response.status)
      const result = await response.json()
      console.log("Response result:", result)

      if (response.ok) {
        setMessage("Booking created successfully! You will receive a confirmation email shortly.")
        setMessageType("success")
        // Reset form
        setSelectedVehicle(null)
        setSelectedDate("")
        setStartTime("")
        setEndTime("")
        setLocation("")
        setNotes("")
        // Refresh available vehicles
        fetchVehicles()
      } else {
        setMessage(result.error || "Failed to create booking. Please try again.")
        setMessageType("error")
      }
    } catch (error) {
      console.error("Error creating booking:", error)
      setMessage("Network error. Please check your connection and try again.")
      setMessageType("error")
    } finally {
      setLoading(false)
    }
  }

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
              <Bike className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-800">Book a Ride</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold text-slate-800 mb-8">Reserve Your Vehicle</h2>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Vehicle Selection */}
            <div>
              <label className="block text-lg font-semibold text-slate-800 mb-4">Choose Vehicle</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableVehicles.map((vehicle) => (
                  <div
                    key={vehicle.bikeId}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedVehicle?.bikeId === vehicle.bikeId
                        ? "border-indigo-500 bg-indigo-50/50 shadow-lg"
                        : "border-slate-200 bg-white/50 hover:border-slate-300 hover:shadow-md"
                    }`}
                    onClick={() => handleVehicleSelect(vehicle)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-800 text-lg">{vehicle.model}</h3>
                    </div>
                    <p className="text-2xl font-bold text-indigo-600 mb-2">${vehicle.hourlyRate}/hr</p>
                    <p className="text-sm text-slate-600 mb-2">{vehicle.type}</p>
                    <p className="text-xs text-slate-500">Battery: {vehicle.batteryLife || 'N/A'}</p>
                  </div>
                ))}
              </div>
              {availableVehicles.length === 0 && (
                <p className="text-slate-600 text-center py-8">No vehicles available at the moment.</p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-lg font-semibold text-slate-800 mb-3">
                  <Calendar className="inline h-5 w-5 mr-2" />
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg bg-white/80 backdrop-blur-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-slate-800 mb-3">
                  <Clock className="inline h-5 w-5 mr-2" />
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg bg-white/80 backdrop-blur-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-slate-800 mb-3">
                  <Clock className="inline h-5 w-5 mr-2" />
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg bg-white/80 backdrop-blur-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Duration Display */}
            {duration > 0 && (
              <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-semibold">
                  Duration: {duration} hour{duration !== 1 ? 's' : ''}
                  {selectedVehicle && (
                    <span className="ml-2 text-blue-600">
                      • Total: ${selectedVehicle.hourlyRate * duration}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Location */}
            <div>
              <label className="block text-lg font-semibold text-slate-800 mb-3">
                <MapPin className="inline h-5 w-5 mr-2" />
                Pickup Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg bg-white/80 backdrop-blur-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none"
                required
              >
                <option value="">Select pickup location</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-lg font-semibold text-slate-800 mb-3">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or notes..."
                rows={3}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg bg-white/80 backdrop-blur-sm transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedVehicle}
              className={`w-full rounded-lg py-4 px-6 text-xl font-bold transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 ${
                loading || !selectedVehicle
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-500 to-blue-400 text-white hover:from-indigo-600 hover:to-blue-500 hover:shadow-lg"
              }`}
            >
              {loading ? "Creating Booking..." : "Reserve Now"}
            </button>
          </form>

          {message && (
            <div className={`mt-6 p-4 border rounded-lg flex items-center space-x-3 ${getMessageStyle()}`}>
              {getMessageIcon()}
              <p className="font-semibold">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}