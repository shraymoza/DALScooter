"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  Bike,
  Battery,
  DollarSign,
  MessageCircle,
  Star,
  ThumbsUp,
  ThumbsDown,
  Minus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  Clock,
  MessageSquare,
} from "lucide-react"

const VehicleTypeCarousel = ({ type, bikes }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const itemsPerPage = 3
  const totalPages = Math.ceil(bikes.length / itemsPerPage)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages)
  }

  const getCurrentPageItems = () => {
    const startIndex = currentIndex * itemsPerPage
    return bikes.slice(startIndex, startIndex + itemsPerPage)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-3xl font-bold text-gray-900">{type}s</h3>
        {bikes.length > itemsPerPage && (
          <div className="flex items-center space-x-2">
            <button
              onClick={prevSlide}
              className="p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 border border-gray-200 hover:border-indigo-300"
              disabled={totalPages <= 1}
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 hover:text-indigo-600" />
            </button>
            <span className="text-sm text-gray-500 px-3">
              {currentIndex + 1} of {totalPages}
            </span>
            <button
              onClick={nextSlide}
              className="p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 border border-gray-200 hover:border-indigo-300"
              disabled={totalPages <= 1}
            >
              <ChevronRight className="h-5 w-5 text-gray-600 hover:text-indigo-600" />
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {getCurrentPageItems().map((bike) => (
            <div
              key={bike.bikeId}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold text-gray-900">{bike.model}</h4>
                  <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    <Battery className="h-4 w-4" />
                    <span className="text-sm font-semibold">{bike.batteryLife}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center mb-6">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5" />
                      <span className="text-2xl font-bold">{bike.hourlyRate}</span>
                      <span className="text-sm">/hr</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Access Code:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">{bike.accessCode}</span>
                  </div>

                  {bike.discount && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-semibold text-orange-600">{bike.discount}</span>
                    </div>
                  )}
                </div>

                {bike.features && bike.features.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Features:</p>
                    <div className="flex flex-wrap gap-2">
                      {bike.features.map((feature, index) => (
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
              </div>
            </div>
          ))}
        </div>

        {/* Dots indicator for mobile */}
        {bikes.length > itemsPerPage && (
          <div className="flex justify-center mt-6 space-x-2 md:hidden">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex ? "bg-indigo-600 w-6" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showChatbot, setShowChatbot] = useState(false)
  const [feedbacks, setFeedbacks] = useState([])
  const [feedbackLoading, setFeedbackLoading] = useState(true)

  const API_BASE = import.meta.env.VITE_BIKE_CRUD_API

  const FEEDBACK_API = import.meta.env.VITE_FEEDBACK_API

  const fetchVehicles = async () => {
    try {
      const res = await fetch(`${API_BASE}/bikes`)
      const data = await res.json()
      setVehicles(data)
    } catch (error) {
      console.error("Error fetching vehicles:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch(`${FEEDBACK_API}/get-feedback`)
      if (response.ok) {
        const data = await response.json()
        // Get latest 4 feedbacks for homepage display
        const latestFeedbacks = Array.isArray(data)
          ? data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 4)
          : []
        setFeedbacks(latestFeedbacks)
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error)
      setFeedbacks([])
    } finally {
      setFeedbackLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles()
    fetchFeedbacks()
  }, [])

  const scrollToVehicles = () => {
    document.getElementById("vehicles-section")?.scrollIntoView({
      behavior: "smooth",
    })
  }

  const groupVehiclesByType = (vehicles) => {
    return vehicles.reduce((acc, vehicle) => {
      if (!acc[vehicle.type]) {
        acc[vehicle.type] = []
      }
      acc[vehicle.type].push(vehicle)
      return acc
    }, {})
  }

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800"
      case "negative":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case "positive":
        return <ThumbsUp className="h-4 w-4" />
      case "negative":
        return <ThumbsDown className="h-4 w-4" />
      default:
        return <Minus className="h-4 w-4" />
    }
  }

  const groupedVehicles = groupVehiclesByType(vehicles)

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Bike className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">DALScooter</h1>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
              >
                Signup
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Eco-friendly rides at your{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              fingertips
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Choose from eBikes, Gyroscooters, or Segways — no account needed to explore our amazing fleet of
            eco-friendly vehicles
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
            <div className="flex items-center space-x-2 text-gray-700">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span>Electric Powered</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <Shield className="h-5 w-5 text-green-500" />
              <span>Safe & Secure</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <Clock className="h-5 w-5 text-blue-500" />
              <span>24/7 Available</span>
            </div>
          </div>

          <button
            onClick={scrollToVehicles}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:-translate-y-1 shadow-xl hover:shadow-2xl"
          >
            Explore Our Fleet
            <ChevronDown className="ml-2 h-5 w-5 animate-bounce" />
          </button>
        </div>
      </section>

      {/* Vehicle Availability & Tariffs Section */}
      <section id="vehicles-section" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Available Rides & Rates</h2>
            <p className="text-xl text-gray-600">Choose the perfect ride for your journey</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">Loading our amazing fleet...</p>
            </div>
          ) : (
            <div className="space-y-16">
              {Object.entries(groupedVehicles).map(([type, bikes]) => (
                <VehicleTypeCarousel key={type} type={type} bikes={bikes} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Chatbot Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Need Help?</h2>
            <p className="text-xl text-gray-600">Our virtual assistant is here to help you navigate and get started</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Virtual Assistant</h3>
                  <p className="text-gray-700 mb-6 text-lg">
                    "Hi there! 👋 Ask me how to register, navigate the site, or learn about our amazing vehicles. I'm
                    here to make your DALScooter experience smooth and enjoyable!"
                  </p>
                  <button
                    onClick={() => setShowChatbot(!showChatbot)}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Chat with Assistant
                  </button>
                </div>
              </div>

              {showChatbot && (
                <div className="mt-8 bg-white rounded-xl p-6 shadow-lg border">
                  <div className="space-y-4">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <p className="text-gray-800">
                        <strong>Assistant:</strong> Welcome to DALScooter! Here are some things I can help you with:
                      </p>
                      <ul className="mt-2 space-y-1 text-gray-700">
                        <li>• How to create an account and get started</li>
                        <li>• Information about our vehicle types and rates</li>
                        <li>• Booking process and requirements</li>
                        <li>• Campus locations and pickup points</li>
                      </ul>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Full chat functionality available after registration!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Customer Feedback & Sentiment Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Riders Say</h2>
            <p className="text-xl text-gray-600">Real feedback from our amazing community</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {feedbackLoading ? (
              <div className="col-span-full text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-gray-600">Loading customer reviews...</p>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-600">Unable to load customer reviews at this time.</p>
                <p className="text-gray-500 text-sm mt-1">Please check back later.</p>
              </div>
            ) : (
              feedbacks.map((feedback, index) => (
                <div
                  key={feedback.feedbackId || feedback.id || index}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < (feedback.rating || 0) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                    <div
                      className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(feedback.sentiment)}`}
                    >
                      {getSentimentIcon(feedback.sentiment)}
                      <span className="capitalize">{feedback.sentiment || "neutral"}</span>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4 leading-relaxed">"{feedback.comment || feedback.text}"</p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      {feedback.userEmail ? feedback.userEmail.split("@")[0] : feedback.userName || "Anonymous"}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                        {feedback.model || feedback.bikeType}
                      </span>
                      {feedback.type && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          {feedback.type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add link to view all feedback */}
          <div className="text-center mt-8">
            <Link
              to="/public-feedback"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
            >
              View All Customer Reviews
              <MessageSquare className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Bike className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">DALScooter</h3>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Your eco-friendly transportation solution. Ride smart, ride green, ride with DALScooter.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <a href="#vehicles-section" className="hover:text-white transition-colors">
                    Our Fleet
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Dalhousie University</li>
                <li>Halifax, NS</li>
                <li>support@dalscooter.ca</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 DALScooter. All rights reserved. Ride responsibly.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}