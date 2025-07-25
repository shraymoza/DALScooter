"use client"

import { useState } from "react"
import { MessageCircle, X, Send, Bot, User } from "lucide-react"
import { getUserGroup } from "../utils/auth"

export default function VirtualAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      message: "Hello! I'm your DALScooter virtual assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")

  const userGroups = getUserGroup()
  const isAdmin = userGroups.includes("BikeFranchise")

  const quickQuestions = isAdmin
    ? [
        "How do I add a new vehicle?",
        "How to get booking details?",
        "How to update rental rates?",
        "How to manage discounts?",
        "How to handle customer issues?",
      ]
    : [
        "How do I register?",
        "What vehicle types are available?",
        "How do I book a ride?",
        "What are the rental rates?",
        "How do I provide feedback?",
        "How to get my access code?",
      ]

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      message: inputMessage,
      timestamp: new Date(),
    }

    setMessages([...messages, userMessage])

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        type: "bot",
        message: getBotResponse(inputMessage),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botResponse])
    }, 1000)

    setInputMessage("")
  }

  const getBotResponse = (userInput) => {
    const input = userInput.toLowerCase()

    if (isAdmin) {
      // Admin-specific responses
      if (input.includes("add") && (input.includes("vehicle") || input.includes("bike"))) {
        return "To add a new vehicle, go to Franchise Management → Vehicle Management → Add Vehicle. Fill in the vehicle type, model, access code, hourly rate, and features."
      } else if (input.includes("booking") && (input.includes("reference") || input.includes("details"))) {
        return "To get booking details by reference code, I can help you find the bike number and usage duration. Please provide the booking reference code (format: BK-XXXXXX)."
      } else if (input.includes("rate") || input.includes("price") || input.includes("rental")) {
        return "To update rental rates, go to Franchise Management → select the vehicle → edit hourly rate. Current rates: eBike ($12/hr), Gyroscooter ($15/hr), Segway ($18/hr)."
      } else if (input.includes("discount")) {
        return "To manage discounts, go to Franchise Management → Vehicle Management → select vehicle → update discount field. You can set percentage discounts for each vehicle type."
      } else if (input.includes("customer") && input.includes("issue")) {
        return "For customer issues, check the issue tickets in the admin panel. You can respond to customer communications asynchronously through the messaging system."
      } else if (input.match(/^BK-\d{6}$/)) {
        // Simulate booking lookup
        return `Booking Reference ${input}: Vehicle - eBike #EB001, Access Code: 4829, Duration: 2 hours (10:00 AM - 12:00 PM), Location: Halifax Downtown`
      }
    } else {
      // Regular user responses
      if (input.includes("register") || input.includes("sign up")) {
        return 'To register, click on the "Register" button on the login page. You\'ll need to provide your email, create a password, and answer a security question.'
      } else if (input.includes("book") || input.includes("reserve")) {
        return "To book a ride, go to the Booking page from your dashboard. Select your vehicle type, date, time, and pickup location. Daily bookings are available."
      } else if (input.includes("access code") || input.includes("booking reference")) {
        return "Please provide your booking reference number (format: BK-XXXXXX), and I can help you find your vehicle access code and usage duration."
      } else if (input.match(/^BK-\d{6}$/)) {
        // Simulate booking lookup for regular users
        return `Your Booking ${input}: Access Code: 4829, Vehicle: eBike at Halifax Downtown, Duration: 2 hours. Enjoy your ride!`
      } else if (input.includes("feedback") || input.includes("review")) {
        return "You can provide feedback through the Feedback page in your dashboard. Rate your experience and help us improve our service!"
      }
    }

    // Common responses
    if (input.includes("vehicle") || input.includes("bike") || input.includes("scooter")) {
      return "We offer three types of vehicles: eBikes ($12/hr), Gyroscooters ($15/hr), and Segways ($18/hr). All are eco-friendly and perfect for campus travel!"
    } else if (input.includes("rate") || input.includes("price") || input.includes("cost")) {
      return "Our rental rates are: eBike - $12/hr, Gyroscooter - $15/hr, Segway - $18/hr. Special discounts may apply!"
    } else if (input.includes("navigate") || input.includes("help")) {
      return isAdmin
        ? "I can help you navigate the admin panel, manage vehicles, view analytics, handle bookings, and respond to customer feedback. What would you like to do?"
        : "I can help you navigate the site, book rides, provide feedback, and find your booking information. What would you like to know?"
    } else {
      return isAdmin
        ? "I'm here to help with franchise operations! You can ask me about adding vehicles, managing bookings, updating rates, handling customer issues, or navigating the admin panel."
        : "I'm here to help with DALScooter services! You can ask me about registration, booking, vehicle types, rates, feedback, or finding your access codes."
    }
  }

  const handleQuickQuestion = (question) => {
    const userMessage = {
      id: messages.length + 1,
      type: "user",
      message: question,
      timestamp: new Date(),
    }

    setMessages([...messages, userMessage])

    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        type: "bot",
        message: getBotResponse(question),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botResponse])
    }, 1000)
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 z-50 ${
          isAdmin
            ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            : "bg-gradient-to-r from-indigo-500 to-blue-400 hover:from-indigo-600 hover:to-blue-500"
        } text-white`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 flex flex-col z-40">
          {/* Header */}
          <div
            className={`p-4 rounded-t-2xl text-white ${
              isAdmin ? "bg-gradient-to-r from-red-500 to-red-600" : "bg-gradient-to-r from-indigo-500 to-blue-400"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Bot className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">{isAdmin ? "Admin Assistant" : "DALScooter Assistant"}</h3>
                <p className="text-xs opacity-90">
                  {isAdmin ? "Franchise Support • Ready to help" : "Online • Ready to help"}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-2 ${
                  msg.type === "user" ? "flex-row-reverse space-x-reverse" : ""
                }`}
              >
                <div
                  className={`p-2 rounded-full ${
                    msg.type === "user" ? (isAdmin ? "bg-red-500" : "bg-indigo-500") : "bg-slate-200"
                  }`}
                >
                  {msg.type === "user" ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-slate-600" />
                  )}
                </div>
                <div
                  className={`max-w-xs p-3 rounded-2xl ${
                    msg.type === "user"
                      ? isAdmin
                        ? "bg-red-500 text-white"
                        : "bg-indigo-500 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Questions */}
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-1">
              {quickQuestions.slice(0, 3).map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-full transition-colors duration-200"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200/50">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={isAdmin ? "Ask about franchise operations..." : "Type your message..."}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white/80 focus:border-indigo-500 focus:outline-none text-sm"
              />
              <button
                type="submit"
                className={`p-2 rounded-lg transition-colors duration-200 text-white ${
                  isAdmin ? "bg-red-500 hover:bg-red-600" : "bg-indigo-500 hover:bg-indigo-600"
                }`}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}