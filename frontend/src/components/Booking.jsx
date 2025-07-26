"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Calendar, Clock, MapPin, Bike, CheckCircle, AlertCircle, Loader } from "lucide-react"

export default function Booking() {
  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [location, setLocation] = useState("")
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("") // success, error
  const [loading, setLoading] = useState(false)
  const [availableVehicles, setAvailableVehicles] = useState([])
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  
  const navigate = useNavigate()
  const API_BASE = import.meta.env.VITE_BOOKING_API

  useEffect(() => {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)
  }, [])

  // Check availability when date, time, or location changes
  useEffect(() => {
    if (selectedDate && startTime && endTime && location) {
      checkAvailability()
    }
  }, [selectedDate, startTime, endTime, location])

  const checkAvailability = async () => {
    if (!selectedDate || !startTime || !endTime) return

    setCheckingAvailability(true)
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        startTime: startTime,
        endTime: endTime
      })

      const response = await fetch(`${API_BASE}/available-vehicles?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableVehicles(data.vehicles || [])
      } else {
        setAvailableVehicles([])
      }
    } catch (error) {
      console.error("Error checking availability:", error)
      setAvailableVehicles([])
    } finally {
      setCheckingAvailability(false)
    }
  }

//   const vehicles = [
//     { id: "gyroscooter", name: "Gyroscooter", price: 15, available: 8 },
//     { id: "ebike", name: "eBike", price: 12, available: 12 },
//     { id: "segway", name: "Segway", price: 18, available: 5 },
//   ]

  const locations = [
    "Halifax Downtown",
    "Dalhousie University",
    "Halifax Waterfront",
    "Spring Garden Road",
    "Citadel Hill",
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedVehicle || !selectedDate || !startTime || !endTime || !location) {
      setMessage("Please fill in all required fields")
      setMessageType("error")
      return
    }

    setLoading(true)
    setMessage("")
    
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }

      const bookingData = {
        bikeId: selectedVehicle,
        bookingDate: selectedDate,
        startTime: startTime,
        endTime: endTime,
        pickupLocation: location
      }

      const response = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(bookingData),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`Booking confirmed! Reference: ${data.bookingReference}. Access Code: ${data.accessCode}`)
        setMessageType("success")
        
        // Reset form
        setSelectedVehicle("")
        setStartTime("")
        setEndTime("")
        setLocation("")
        setAvailableVehicles([])
        
        // Redirect to bookings page after 3 seconds
        setTimeout(() => {
          navigate("/my-bookings")
        }, 3000)
      } else {
        setMessage(data.error || "Failed to create booking")
        setMessageType("error")
      }
    } catch (error) {
      console.error("Error creating booking:", error)
      setMessage("An error occurred while creating your booking")
      setMessageType("error")
    } finally {
      setLoading(false)
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
              <label className="block text-lg font-semibold text-slate-800 mb-4">
                Choose Available Vehicle
                {checkingAvailability && (
                  <span className="ml-2 inline-flex items-center text-sm text-slate-600">
                    <Loader className="h-4 w-4 animate-spin mr-1" />
                    Checking availability...
                  </span>
                )}
              </label>
              
              {availableVehicles.length === 0 && selectedDate && startTime && endTime && location ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-2">No vehicles available for the selected time slot</p>
                  <p className="text-sm text-slate-500">Try a different date, time, or location</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableVehicles.map((vehicle) => (
                    <div
                      key={vehicle.bikeId}
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        selectedVehicle === vehicle.bikeId
                          ? "border-indigo-500 bg-indigo-50/50"
                          : "border-slate-200 bg-white/50 hover:border-slate-300"
                      }`}
                      onClick={() => setSelectedVehicle(vehicle.bikeId)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-800 text-lg">{vehicle.model}</h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          Available
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-slate-600">Type: {vehicle.type}</p>
                        <p className="text-sm text-slate-600">Battery: {vehicle.batteryLife}</p>
                        {vehicle.discount && (
                          <p className="text-sm text-green-600 font-semibold">Discount: {vehicle.discount}</p>
                        )}
                      </div>
                      
                      <div className="text-center">
                        <p className="text-2xl font-bold text-indigo-600">${vehicle.hourlyRate}/hr</p>
                        <p className="text-xs text-slate-500 mt-1">Access Code: {vehicle.accessCode}</p>
                      </div>
                    </div>
                  ))}
                </div>
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedVehicle}
              className={`w-full border-none rounded-lg py-4 px-6 text-xl font-bold transition-all duration-200 ${
                loading || !selectedVehicle
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-500 to-blue-400 text-white hover:from-indigo-600 hover:to-blue-500 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader className="h-5 w-5 animate-spin mr-2" />
                  Creating Booking...
                </span>
              ) : (
                "Reserve Now"
              )}
            </button>
          </form>

          {message && (
            <div className={`mt-6 p-4 rounded-lg border ${
              messageType === "success" 
                ? "bg-green-50/80 border-green-200" 
                : "bg-red-50/80 border-red-200"
            }`}>
              <div className="flex items-center">
                {messageType === "success" ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                )}
                <p className={`font-semibold ${
                  messageType === "success" ? "text-green-800" : "text-red-800"
                }`}>
                  {message}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}