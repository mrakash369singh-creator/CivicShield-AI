import React from 'react'
import { Link } from 'react-router-dom'

export default function Landing(){
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-sky-50 to-white">
      <div className="max-w-4xl p-8 bg-white shadow rounded">
        <h1 className="text-3xl font-bold">From Citizen Reports to Smarter Infrastructure Decisions</h1>
        <p className="mt-4 text-gray-600">CivicShield AI uses computer vision and intelligent prioritization to help authorities detect, verify and resolve infrastructure problems faster.</p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link to="/report" className="px-4 py-2 bg-blue-600 text-white rounded">Report an Issue</Link>
          <Link to="/dashboard" className="px-4 py-2 border rounded">Authority Dashboard</Link>
          <Link to="/track" className="px-4 py-2 bg-sky-100 text-sky-800 rounded">Citizen Tracking</Link>
        </div>
      </div>
    </div>
  )
}
