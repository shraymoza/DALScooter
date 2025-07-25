"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, BarChart3, Users, TrendingUp, Activity, Calendar, DollarSign } from "lucide-react"

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState("7d")

  const stats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalBookings: 3456,
    revenue: 45678,
    avgRating: 4.7,
    loginStats: {
      successful: 2341,
      failed: 23,
    },
  }

  const recentFeedback = [
    { id: 1, user: "John D.", rating: 5, comment: "Excellent service!", vehicle: "eBike", date: "2024-01-15" },
    {
      id: 2,
      user: "Sarah M.",
      rating: 4,
      comment: "Great experience overall.",
      vehicle: "Gyroscooter",
      date: "2024-01-14",
    },
    { id: 3, user: "Mike R.", rating: 5, comment: "Amazing! Highly recommend.", vehicle: "Segway", date: "2024-01-14" },
    { id: 4, user: "Lisa K.", rating: 3, comment: "Good but could be better.", vehicle: "eBike", date: "2024-01-13" },
    {
      id: 5,
      user: "Tom W.",
      rating: 5,
      comment: "Perfect for campus travel.",
      vehicle: "Gyroscooter",
      date: "2024-01-13",
    },
  ]

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
              <BarChart3 className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-800">Admin Analytics</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Time Range Selector */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg bg-white/80 focus:border-indigo-500 focus:outline-none"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-blue-100 text-sm mt-1">+12% from last month</p>
              </div>
              <Users className="h-12 w-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Users</p>
                <p className="text-3xl font-bold">{stats.activeUsers.toLocaleString()}</p>
                <p className="text-green-100 text-sm mt-1">+8% from last month</p>
              </div>
              <Activity className="h-12 w-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Bookings</p>
                <p className="text-3xl font-bold">{stats.totalBookings.toLocaleString()}</p>
                <p className="text-purple-100 text-sm mt-1">+15% from last month</p>
              </div>
              <Calendar className="h-12 w-12 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Revenue</p>
                <p className="text-3xl font-bold">${stats.revenue.toLocaleString()}</p>
                <p className="text-orange-100 text-sm mt-1">+22% from last month</p>
              </div>
              <DollarSign className="h-12 w-12 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Login Statistics */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Login Statistics</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-green-50/50 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-800">Successful Logins</p>
                  <p className="text-2xl font-bold text-green-600">{stats.loginStats.successful.toLocaleString()}</p>
                </div>
                <div className="text-green-600">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-800">Failed Logins</p>
                  <p className="text-2xl font-bold text-red-600">{stats.loginStats.failed}</p>
                </div>
                <div className="text-red-600">
                  <Activity className="h-8 w-8" />
                </div>
              </div>
              <div className="p-4 bg-slate-50/50 rounded-lg">
                <p className="font-semibold text-slate-800 mb-2">Success Rate</p>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full"
                    style={{
                      width: `${(stats.loginStats.successful / (stats.loginStats.successful + stats.loginStats.failed)) * 100}%`,
                    }}
                  ></div>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  {(
                    (stats.loginStats.successful / (stats.loginStats.successful + stats.loginStats.failed)) *
                    100
                  ).toFixed(1)}
                  % success rate
                </p>
              </div>
            </div>
          </div>

          {/* User Activity */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
            <h3 className="text-xl font-bold text-slate-800 mb-6">User Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg">
                <span className="text-slate-700">New Registrations</span>
                <span className="font-bold text-indigo-600">+47 today</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg">
                <span className="text-slate-700">Active Sessions</span>
                <span className="font-bold text-green-600">234 current</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg">
                <span className="text-slate-700">Bookings Today</span>
                <span className="font-bold text-blue-600">89 bookings</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg">
                <span className="text-slate-700">Average Rating</span>
                <span className="font-bold text-yellow-600">{stats.avgRating}/5.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Feedback */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <h3 className="text-xl font-bold text-slate-800 mb-6">Recent Customer Feedback</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200/50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Rating</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Vehicle</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Comment</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentFeedback.map((feedback) => (
                  <tr
                    key={feedback.id}
                    className="border-b border-slate-100/50 hover:bg-slate-50/30 transition-colors duration-200"
                  >
                    <td className="py-3 px-4 font-medium text-slate-800">{feedback.user}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${i < feedback.rating ? "text-yellow-400" : "text-gray-300"}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                        {feedback.vehicle}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{feedback.comment}</td>
                    <td className="py-3 px-4 text-slate-500 text-sm">{feedback.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}