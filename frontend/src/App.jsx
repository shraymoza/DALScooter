import { Routes, Route, useLocation } from "react-router-dom"
import Home from "./components/Home"
import Register from "./components/Register"
import Login from "./components/Login"
import ConfirmAccount from "./components/ConfirmAccount"
import Dashboard from "./components/Dashboard"
import Booking from "./components/Booking"
import Feedback from "./components/Feedback"
import PublicFeedback from "./components/PublicFeedback"
import FranchiseManagement from "./components/FranchiseManagement"
import AdminAnalytics from "./components/AdminAnalytics"
import VirtualAssistant from "./components/VirtualAssistant"
import AdminDashboard from "./components/AdminDashboard"
import Vehicles from "./components/Vehicles"
import Complaints from "./components/Complaints"
import { getUserGroup } from "./utils/auth"

export default function App() {
  const location = useLocation()
  const hideVirtualAssistant =
    location.pathname === "/" ||
    location.pathname === "/home" ||
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/confirm" ||
    location.pathname === "/public-feedback"

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/confirm" element={<ConfirmAccount />} />
        <Route path="/public-feedback" element={<PublicFeedback />} />
        <Route
          path="/dashboard"
          element={getUserGroup().includes("BikeFranchise") ? <AdminDashboard /> : <Dashboard />}
        />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/franchise" element={<FranchiseManagement />} />
        <Route path="/admin" element={<AdminAnalytics />} />
        <Route path="/complaints" element={<Complaints />} />
      </Routes>
      {!hideVirtualAssistant && <VirtualAssistant />}
    </div>
  )
}