"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Plus, Edit, Trash2, Settings, DollarSign, Battery } from "lucide-react"

export default function FranchiseManagement() {
  const [activeTab, setActiveTab] = useState("vehicles")
  const [showAddForm, setShowAddForm] = useState(false)
  const [vehicles, setVehicles] = useState([])

  const API_BASE = import.meta.env.VITE_BIKE_CRUD_API

  const fetchVehicles = async () => {
    try {
      const res = await fetch(`${API_BASE}/bikes`)
      const data = await res.json()
      setVehicles(data)
    } catch (error) {
      console.error("Error fetching vehicles:", error)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [])

  const [newVehicle, setNewVehicle] = useState({
    type: "",
    model: "",
    accessCode: "",
    batteryLife: "",
    hourlyRate: "",
    features: [],
    discount: "",
  })

  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})

  const handleAddVehicle = async (e) => {
    e.preventDefault()
    try {
      const body = {
        ...newVehicle,
        hourlyRate: Number.parseFloat(newVehicle.hourlyRate),
        features: newVehicle.features,
        createdBy: localStorage.getItem("userEmail"),
        createdAt: new Date().toISOString(),
      }
      const res = await fetch(`${API_BASE}/bikes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setNewVehicle({
          type: "",
          model: "",
          accessCode: "",
          batteryLife: "",
          hourlyRate: "",
          features: [],
          discount: "",
        })
        setShowAddForm(false)
        fetchVehicles()
      }
    } catch (error) {
      console.error("Error adding vehicle:", error)
    }
  }

  const handleDeleteVehicle = async (bikeId) => {
    try {
      const res = await fetch(`${API_BASE}/bikes/${bikeId}`, {
        method: "DELETE",
        headers: { Authorization: localStorage.getItem("token") },
      })
      if (res.ok) fetchVehicles()
    } catch (error) {
      console.error("Error deleting vehicle:", error)
    }
  }

  const handleEditVehicle = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_BASE}/bikes/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify(editData),
      })
      if (res.ok) {
        setEditId(null)
        setEditData({})
        fetchVehicles()
      }
    } catch (error) {
      console.error("Error updating vehicle:", error)
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
              <Settings className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-800">Franchise Management</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 mb-8">
          <div className="flex border-b border-slate-200/50">
            <button
              onClick={() => setActiveTab("vehicles")}
              className={`px-6 py-4 font-semibold transition-colors duration-200 ${
                activeTab === "vehicles"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Vehicle Management
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-6 py-4 font-semibold transition-colors duration-200 ${
                activeTab === "analytics"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Analytics
            </button>
          </div>

          {/* Vehicle Management Tab */}
          {activeTab === "vehicles" && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Vehicle Fleet</h2>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-blue-400 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-blue-500 transition-all duration-200"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Vehicle</span>
                </button>
              </div>

              {/* Add Vehicle Form */}
              {showAddForm && (
                <div className="bg-slate-50/50 rounded-xl p-6 mb-6 border border-slate-200/50">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Add New Vehicle</h3>
                  <form onSubmit={handleAddVehicle} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Type *</label>
                        <select
                          value={newVehicle.type}
                          onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white/80 focus:border-indigo-500 focus:outline-none"
                          required
                        >
                          <option value="">Select Type</option>
                          <option value="eBike">eBike</option>
                          <option value="Gyroscooter">Gyroscooter</option>
                          <option value="Segway">Segway</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Model Name *</label>
                        <input
                          type="text"
                          placeholder="e.g., Urban Cruiser"
                          value={newVehicle.model}
                          onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white/80 focus:border-indigo-500 focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Access Code *</label>
                        <input
                          type="text"
                          placeholder="e.g., EB001"
                          value={newVehicle.accessCode}
                          onChange={(e) => setNewVehicle({ ...newVehicle, accessCode: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white/80 focus:border-indigo-500 focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Battery Life *</label>
                        <input
                          type="text"
                          placeholder="e.g., 20h"
                          value={newVehicle.batteryLife}
                          onChange={(e) => setNewVehicle({ ...newVehicle, batteryLife: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white/80 focus:border-indigo-500 focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Hourly Rate ($) *</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 12.00"
                          value={newVehicle.hourlyRate}
                          onChange={(e) => setNewVehicle({ ...newVehicle, hourlyRate: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white/80 focus:border-indigo-500 focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Discount (%)</label>
                        <input
                          type="text"
                          placeholder="e.g., 10"
                          value={newVehicle.discount}
                          onChange={(e) => setNewVehicle({ ...newVehicle, discount: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white/80 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-3">Features</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {["Height Adjustment", "Bluetooth", "GPS", "Shock Absorbers"].map((feature) => (
                            <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newVehicle.features.includes(feature)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewVehicle({ ...newVehicle, features: [...newVehicle.features, feature] })
                                  } else {
                                    setNewVehicle({
                                      ...newVehicle,
                                      features: newVehicle.features.filter((f) => f !== feature),
                                    })
                                  }
                                }}
                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                              />
                              <span className="text-sm text-slate-700">{feature}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">Features</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3"> */}
                        {/*{["Height Adjustment", "Bluetooth", "GPS", "Shock Absorbers"].map((feature) => (*/}
                        {/*  <label key={feature} className="flex items-center space-x-2 cursor-pointer">*/}
                        {/*    <input*/}
                        {/*      type="checkbox"*/}
                        {/*      checked={newVehicle.features.includes(feature)}*/}
                        {/*      onChange={(e) => {*/}
                        {/*        if (e.target.checked) {*/}
                        {/*          setNewVehicle({ ...newVehicle, features: [...newVehicle.features, feature] })*/}
                        {/*        } else {*/}
                        {/*          setNewVehicle({*/}
                        {/*            ...newVehicle,*/}
                        {/*            features: newVehicle.features.filter((f) => f !== feature),*/}
                        {/*          })*/}
                        {/*        }*/}
                        {/*      }}*/}
                        {/*      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"*/}
                        {/*    />*/}
                        {/*    <span className="text-sm text-slate-700">{feature}</span>*/}
                        {/*  </label>*/}
                        {/*))}*/}
                      {/* </div>
                    </div> */}

                    <div className="flex space-x-4 pt-4">
                      <button
                        type="submit"
                        className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 font-medium"
                      >
                        Add Vehicle
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Vehicle List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {vehicles.map((vehicle) => (
                  <div key={vehicle.bikeId} className="bg-white/80 rounded-xl p-6 shadow-lg border border-white/20">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-slate-800">{vehicle.type}</h3>
                      <div className="flex space-x-2">
                        {editId === vehicle.bikeId ? (
                          <form onSubmit={handleEditVehicle} className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                              <select
                                value={editData.type || ""}
                                onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:border-indigo-500 focus:outline-none"
                              >
                                <option value="eBike">eBike</option>
                                <option value="Gyroscooter">Gyroscooter</option>
                                <option value="Segway">Segway</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Model Name</label>
                              <input
                                type="text"
                                value={editData.model || ""}
                                onChange={(e) => setEditData({ ...editData, model: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Access Code</label>
                              <input
                                type="text"
                                value={editData.accessCode || ""}
                                onChange={(e) => setEditData({ ...editData, accessCode: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Battery Life</label>
                              <input
                                type="text"
                                value={editData.batteryLife || ""}
                                onChange={(e) => setEditData({ ...editData, batteryLife: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Hourly Rate ($)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={editData.hourlyRate || ""}
                                onChange={(e) =>
                                  setEditData({ ...editData, hourlyRate: Number.parseFloat(e.target.value) })
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Discount</label>
                              <input
                                type="text"
                                value={editData.discount || ""}
                                onChange={(e) => setEditData({ ...editData, discount: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Features</label>
                              <div className="grid grid-cols-1 gap-2">
                                {["Height Adjustment", "Bluetooth", "GPS", "Shock Absorbers"].map((feature) => (
                                  <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={(editData.features || []).includes(feature)}
                                      onChange={(e) => {
                                        const currentFeatures = editData.features || []
                                        if (e.target.checked) {
                                          setEditData({ ...editData, features: [...currentFeatures, feature] })
                                        } else {
                                          setEditData({
                                            ...editData,
                                            features: currentFeatures.filter((f) => f !== feature),
                                          })
                                        }
                                      }}
                                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-slate-700">{feature}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div className="flex space-x-2 pt-2">
                              <button
                                type="submit"
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
                              >
                                Save Changes
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditId(null)}
                                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors duration-200 font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditId(vehicle.bikeId)
                                setEditData(vehicle)
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteVehicle(vehicle.bikeId)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Model:</span>
                        <span className="font-semibold">{vehicle.model}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Access Code:</span>
                        <span className="font-mono bg-slate-100 px-2 py-1 rounded">{vehicle.accessCode}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 flex items-center">
                          <Battery className="h-4 w-4 mr-1" />
                          Battery:
                        </span>
                        <span className="font-semibold text-green-600">{vehicle.batteryLife}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Rate:
                        </span>
                        <span className="font-semibold">${vehicle.hourlyRate}/hr</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Discount:</span>
                        <span className="font-semibold text-orange-600">{vehicle.discount}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 block mb-2">Features:</span>
                        <div className="flex flex-wrap gap-1">
                          {vehicle.features.map((feature, index) => (
                            <span key={index} className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Fleet Analytics</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-2">Total Vehicles</h3>
                  <p className="text-3xl font-bold">{vehicles.length}</p>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-2">Active Bookings</h3>
                  <p className="text-3xl font-bold">24</p>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-2">Revenue Today</h3>
                  <p className="text-3xl font-bold">$1,248</p>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-2">Avg Rating</h3>
                  <p className="text-3xl font-bold">4.8</p>
                </div>
              </div>

              <div className="bg-white/80 rounded-xl p-6 shadow-lg border border-white/20">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Vehicle Utilization</h3>
                <div className="space-y-4">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.bikeId}
                      className="flex items-center justify-between p-4 bg-slate-50/50 rounded-lg"
                    >
                      <div>
                        <span className="font-semibold">
                          {vehicle.type} - {vehicle.model}
                        </span>
                        <span className="text-slate-600 ml-2">({vehicle.accessCode})</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-32 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${Math.random() * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold">{Math.floor(Math.random() * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}