"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  BarChart3,
  Settings,
  MessageSquare,
  Calendar,
  LogOut,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Shield,
  Bike,
  Star,
} from "lucide-react"

export default function AdminDashboard() {
  const [adminEmail, setAdminEmail] = useState("")
  const [showWelcome, setShowWelcome] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const email = localStorage.getItem("userEmail")
    if (email) {
      setAdminEmail(email)
    }
  }, [])

  // Auto-hide welcome notification after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false)
    }, 10000)

    return () => clearTimeout(timer)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userGroup")
    navigate("/")
  }

  const adminQuickLinks = [
    {
      title: "Admin Analytics",
      description: "View detailed system analytics and reports",
      icon: BarChart3,
      link: "/admin",
      gradient: "from-blue-600 to-blue-800",
      bgGradient: "from-blue-50 to-blue-100",
      iconBg: "bg-blue-500",
    },
    {
      title: "Franchise Management",
      description: "Manage vehicle fleet and franchise operations",
      icon: Settings,
      link: "/franchise",
      gradient: "from-emerald-600 to-emerald-800",
      bgGradient: "from-emerald-50 to-emerald-100",
      iconBg: "bg-emerald-500",
    },
    {
      title: "Customer Feedback",
      description: "Review and respond to customer feedback",
      icon: MessageSquare,
      link: "/feedback",
      gradient: "from-purple-600 to-purple-800",
      bgGradient: "from-purple-50 to-purple-100",
      iconBg: "bg-purple-500",
    },
    {
      title: "Booking Overview",
      description: "Monitor all bookings and reservations",
      icon: Calendar,
      link: "/booking",
      gradient: "from-orange-600 to-orange-800",
      bgGradient: "from-orange-50 to-orange-100",
      iconBg: "bg-orange-500",
    },
  ]

  const quickStats = [
    {
      title: "Total Users",
      value: "1,247",
      change: "+12%",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Bookings",
      value: "89",
      change: "+5%",
      icon: Activity,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Revenue Today",
      value: "$2,340",
      change: "+18%",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Avg Rating",
      value: "4.8",
      change: "+0.2",
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 shadow-2xl border-b border-slate-600">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Admin Control Center</h1>
                <p className="text-slate-300 text-lg">DALScooter Management Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/complaints"
                className="flex items-center space-x-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
              >
                <MessageSquare className="h-5 w-5" />
                <span>Complaints</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Notification Banner - Auto-hide after 10 seconds */}
        {showWelcome && (
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-xl mb-6 shadow-lg relative">
            <button
              onClick={() => setShowWelcome(false)}
              className="absolute top-2 right-2 text-green-100 hover:text-white text-xl font-bold"
            >
              ×
            </button>
            <p className="font-semibold">✅ Welcome! You have successfully signed in as a Franchise Operator.</p>
            <p className="text-green-100 text-sm">
              You have administrative privileges and multi-factor authentication is enabled.
            </p>
          </div>
        )}

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl shadow-2xl p-8 mb-8 border border-slate-600">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">{adminEmail.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Welcome back, Administrator</h2>
              <p className="text-slate-300 text-lg">
                Logged in as: <span className="font-semibold text-red-400">{adminEmail}</span>
                <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                  Franchise Operator
                </span>
              </p>
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
            <p className="text-slate-200 text-lg leading-relaxed">
              🚀 You have administrative privileges to manage the entire DALScooter platform. Monitor operations, manage
              franchises, and ensure optimal service delivery.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl shadow-xl p-6 border border-slate-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <span className="text-green-400 text-sm font-semibold bg-green-900/30 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
              </div>
              <h3 className="text-slate-300 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-white text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Admin Quick Links */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Bike className="h-8 w-8 mr-3 text-indigo-400" />
            Administrative Functions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {adminQuickLinks.map((link, index) => (
              <Link
                key={index}
                to={link.link}
                className="group relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-slate-600 hover:border-slate-500"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${link.bgGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                ></div>
                <div className="relative p-8">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`p-4 rounded-2xl ${link.iconBg} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                    >
                      <link.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-white mb-2 group-hover:text-slate-100 transition-colors duration-200">
                        {link.title}
                      </h4>
                      <p className="text-slate-300 text-base leading-relaxed group-hover:text-slate-200 transition-colors duration-200">
                        {link.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center text-slate-400 group-hover:text-slate-300 transition-colors duration-200">
                    <span className="text-sm font-medium">Access Panel</span>
                    <TrendingUp className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl shadow-2xl p-8 border border-slate-600">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Activity className="h-8 w-8 mr-3 text-green-400" />
            System Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-300 font-medium">Server Status</span>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-white text-lg font-semibold">Online</p>
              <p className="text-slate-400 text-sm">99.9% uptime</p>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-300 font-medium">Database</span>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-white text-lg font-semibold">Connected</p>
              <p className="text-slate-400 text-sm">Response: 12ms</p>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-300 font-medium">API Services</span>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-white text-lg font-semibold">Operational</p>
              <p className="text-slate-400 text-sm">All endpoints active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}