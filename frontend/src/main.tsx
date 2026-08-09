import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles.css'
import 'leaflet/dist/leaflet.css'
import Landing from './pages/Landing'
import Report from './pages/Report'
import Dashboard from './pages/Dashboard'
import ReportDetails from './pages/ReportDetails'
import Track from './pages/Track'

function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Landing/>} />
        <Route path='/report' element={<Report/>} />
        <Route path='/dashboard' element={<Dashboard/>} />
        <Route path='/reports/:id' element={<ReportDetails/>} />
        <Route path='/track' element={<Track/>} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
