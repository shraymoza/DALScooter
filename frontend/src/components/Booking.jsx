"use client"

import { useState,useEffect } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Calendar, Clock, MapPin, Bike } from "lucide-react"

export default function Booking() {
  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [location, setLocation] = useState("")
  const [message, setMessage] = useState("")
  const [vehicles, setVehicles] = useState([]);
  const API_BASE = import.meta.env.VITE_BIKE_CRUD_API;

  useEffect(() => {
    const fetchBikes = async () => {
    const res = await fetch(`${API_BASE}/bikes`);
    const data = await res.json();
    setVehicles(data);
  };
    fetchBikes();
  }, []);

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

  const handleSubmit = (e) => {
    e.preventDefault()
    // Simulate booking process
    setMessage("Booking request submitted successfully! You will receive a confirmation email shortly.")
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
              <label className="block text-lg font-semibold text-slate-800 mb-4">Choose Vehicle Type</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.bikeId}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedVehicle === vehicle.id
                        ? "border-indigo-500 bg-indigo-50/50"
                        : "border-slate-200 bg-white/50 hover:border-slate-300"
                    }`}
                    onClick={() => setSelectedVehicle(vehicle.id)}
                  >
                    <h3 className="font-bold text-slate-800 text-lg mb-2">{vehicle.name}</h3>
                    <p className="text-2xl font-bold text-indigo-600 mb-2">${vehicle.price}/hr</p>
                    <p className="text-sm text-slate-600">{vehicle.available} available</p>
                  </div>
                ))}
              </div>
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
              className="w-full bg-gradient-to-r from-indigo-500 to-blue-400 text-white border-none rounded-lg py-4 px-6 text-xl font-bold cursor-pointer transition-all duration-200 hover:from-indigo-600 hover:to-blue-500 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Reserve Now
            </button>
          </form>

          {message && (
            <div className="mt-6 p-4 bg-green-50/80 border border-green-200 rounded-lg">
              <p className="text-green-800 font-semibold">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}