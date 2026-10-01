import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Hero from './pages/Hero'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AddDoctor from './pages/AddDoctor'
import ListDoctors from './pages/ListDoctors'
import Appointments from './pages/Appointments'
import ServiceDashboard from './pages/ServiceDashboard'
import AddService from './pages/AddService'
import ListServices from './pages/ListServices'
import ServiceAppointments from './pages/ServiceAppointments'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'

function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-blue-50">
      <Navbar />
      {children}
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Hero />} />
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard" element={
        <ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>
      } />
      <Route path="/add-doctor" element={
        <ProtectedRoute><AdminLayout><AddDoctor /></AdminLayout></ProtectedRoute>
      } />
      <Route path="/doctors" element={
        <ProtectedRoute><AdminLayout><ListDoctors /></AdminLayout></ProtectedRoute>
      } />
      <Route path="/appointments" element={
        <ProtectedRoute><AdminLayout><Appointments /></AdminLayout></ProtectedRoute>
      } />
      <Route path="/service-dashboard" element={
        <ProtectedRoute><AdminLayout><ServiceDashboard /></AdminLayout></ProtectedRoute>
      } />
      <Route path="/add-service" element={
        <ProtectedRoute><AdminLayout><AddService /></AdminLayout></ProtectedRoute>
      } />
      <Route path="/services" element={
        <ProtectedRoute><AdminLayout><ListServices /></AdminLayout></ProtectedRoute>
      } />
      <Route path="/service-appointments" element={
        <ProtectedRoute><AdminLayout><ServiceAppointments /></AdminLayout></ProtectedRoute>
      } />

      <Route path="*" element={<Hero />} />
    </Routes>
  )
}

export default App
