"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Bike, Battery, DollarSign, Search, SortAsc, SortDesc } from "lucide-react"

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [filteredVehicles, setFilteredVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("")
  const [filterModel, setFilterModel] = useState("")
  const [sortBy, setSortBy] = useState("type")
  const [sortOrder, setSortOrder] = useState("asc")

  const API_BASE = import.meta.env.VITE_BIKE_CRUD_API

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch(`${API_BASE}/bikes`)
        const data = await res.json()
        setVehicles(data)
        setFilteredVehicles(data)
      } catch (error) {
        console.error("Error fetching vehicles:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchVehicles()
  }, [])

  // Get unique types and models for filter dropdowns
  const uniqueTypes = [...new Set(vehicles.map((v) => v.type))]
  const uniqueModels = [...new Set(vehicles.map((v) => v.model))]

  // Filter and sort vehicles
  useEffect(() => {
    const filtered = vehicles.filter((vehicle) => {
      const matchesSearch =
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.type.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = !filterType || vehicle.type === filterType
      const matchesModel = !filterModel || vehicle.model === filterModel

      return matchesSearch && matchesType && matchesModel
    })

    // Sort vehicles
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case "type":
          aValue = a.type
          bValue = b.type
          break
        case "model":
          aValue = a.model
          bValue = b.model
          break
        case "rate":
          aValue = Number.parseFloat(a.hourlyRate)
          bValue = Number.parseFloat(b.hourlyRate)
          break
        case "battery":
          aValue = Number.parseInt(a.batteryLife)
          bValue = Number.parseInt(b.batteryLife)
          break
        default:
          aValue = a.type
          bValue = b.type
      }

      if (typeof aValue === "string") {
        return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      } else {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue
      }
    })

    setFilteredVehicles(filtered)
  }, [vehicles, searchTerm, filterType, filterModel, sortBy, sortOrder])

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(newSortBy)
      setSortOrder("asc")
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setFilterType("")
    setFilterModel("")
    setSortBy("type")
    setSortOrder("asc")
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
              <h1 className="text-2xl font-bold text-slate-800">All Vehicles</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters and Search */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by type or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-white/80 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Filter by Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/80 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">All Types</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Model */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Model</label>
              <select
                value={filterModel}
                onChange={(e) => setFilterModel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/80 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">All Models</option>
                {uniqueModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/80 focus:border-indigo-500 focus:outline-none"
              >
                <option value="type">Type</option>
                <option value="model">Model</option>
                <option value="rate">Hourly Rate</option>
                <option value="battery">Battery Life</option>
              </select>
            </div>

            {/* Sort Order & Clear */}
            <div className="flex space-x-2">
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="flex items-center px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors duration-200"
                title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
              >
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors duration-200"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-slate-600">
            Showing {filteredVehicles.length} of {vehicles.length} vehicles
          </div>
        </div>

        {/* Vehicles Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-slate-600">Loading vehicles...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-12">
            <Bike className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">No vehicles found matching your criteria</p>
            <button
              onClick={clearFilters}
              className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.bikeId}
                className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-white/20 overflow-hidden"
              >
                <div className="p-6">
                  {/* Vehicle Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{vehicle.type}</h3>
                      <p className="text-slate-600 font-medium">{vehicle.model}</p>
                    </div>
                    <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      <Battery className="h-4 w-4" />
                      <span className="text-sm font-semibold">{vehicle.batteryLife}</span>
                    </div>
                  </div>

                  {/* Vehicle Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Access Code:</span>
                      <span className="font-mono bg-slate-100 px-2 py-1 rounded text-sm">{vehicle.accessCode}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Hourly Rate:
                      </span>
                      <span className="font-bold text-indigo-600 text-lg">${vehicle.hourlyRate}</span>
                    </div>

                    {vehicle.discount && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Discount:</span>
                        <span className="font-semibold text-orange-600">{vehicle.discount}</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  {vehicle.features && vehicle.features.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm text-slate-600 mb-2">Features:</p>
                      <div className="flex flex-wrap gap-1">
                        {vehicle.features.map((feature, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Book Button */}
                  <Link
                    to="/booking"
                    className="w-full bg-gradient-to-r from-indigo-500 to-blue-400 text-white font-semibold py-3 px-4 rounded-lg hover:from-indigo-600 hover:to-blue-500 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl text-center block"
                  >
                    Book This Vehicle
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}