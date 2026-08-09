import React, { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

function statusStepLabel(status: string) {
  const mapping: Record<string, string> = {
    REPORTED: 'Reported',
    VERIFIED: 'Verified',
    ASSIGNED: 'Assigned',
    'IN PROGRESS': 'In Progress',
    RESOLVED: 'Resolved',
  }
  return mapping[status] || status
}

const steps = ['REPORTED', 'VERIFIED', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED']

export default function Track() {
  const [reportId, setReportId] = useState('')
  const [report, setReport] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchReport = async () => {
    setError(null)
    setReport(null)
    if (!reportId) {
      setError('Enter your report ID.')
      return
    }
    setLoading(true)
    try {
      const res = await axios.get(`http://localhost:8000/api/public/reports/${reportId}`)
      setReport(res.data)
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('No report found.')
      } else {
        setError('Unable to load report. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  const currentStepIndex = report ? steps.indexOf(report.status) : -1

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <header className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-700">CivicShield AI</p>
          <h1 className="text-4xl md:text-5xl font-bold mt-3">Citizen Portal</h1>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">Track your civic complaint with a report ID and see the latest status, priority, department and expected resolution deadline.</p>
        </header>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-10">
          <h2 className="text-2xl font-semibold">Track Your Report</h2>
          <p className="mt-2 text-slate-500">Enter your report ID to see the latest information available to citizens.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <input
              className="flex-1 border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="CS-XXXXXXXX"
              value={reportId}
              onChange={(e) => setReportId(e.target.value)}
            />
            <button
              className="rounded-xl bg-sky-700 text-white px-6 py-3 hover:bg-sky-800 disabled:bg-slate-400"
              onClick={fetchReport}
              disabled={loading}
            >
              {loading ? 'Checking…' : 'Track Report'}
            </button>
          </div>
          {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
        </div>

        {report && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500">Report ID</p>
                <p className="mt-2 text-xl font-semibold">{report.report_id}</p>
                <p className="mt-4 text-sm text-slate-600">Reported date</p>
                <p className="mt-1 text-base">{new Date(report.reported_date).toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500">Current Status</p>
                <p className="mt-2 text-xl font-semibold capitalize">{report.status.toLowerCase()}</p>
                <p className="mt-4 text-sm text-slate-600">Expected resolution</p>
                <p className="mt-1 text-base">{report.sla_deadline ? new Date(report.sla_deadline).toLocaleString() : 'N/A'}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500">Priority</p>
                <p className="mt-2 text-xl font-semibold">{report.priority_level}</p>
                <p className="mt-4 text-sm text-slate-600">Department</p>
                <p className="mt-1 text-base">{report.department || 'Unassigned'}</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold">Report Timeline</h3>
                <div className="mt-6 space-y-4">
                  {steps.map((step, index) => {
                    const completed = index <= currentStepIndex
                    return (
                      <div key={step} className="flex items-start gap-4">
                        <div className={`mt-1 h-8 w-8 rounded-full border flex items-center justify-center ${completed ? 'bg-sky-700 text-white border-sky-700' : 'border-slate-300 text-slate-500'}`}>
                          {completed ? '✓' : index + 1}
                        </div>
                        <div>
                          <p className={`font-semibold ${completed ? 'text-slate-900' : 'text-slate-500'}`}>{statusStepLabel(step)}</p>
                          <p className="text-sm text-slate-500">{step === report.status ? 'Current stage' : ''}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-6 border-t pt-4 text-sm text-slate-600">
                  <p><strong>SLA Status:</strong> {report.sla_status}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold">Report Details</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div>
                    <p className="text-slate-500">Issue</p>
                    <p className="mt-1 font-medium">{report.issue}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">SLA Status</p>
                    <p className="mt-1 font-medium">{report.sla_status}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Resolution status</p>
                    <p className="mt-1 font-medium">{report.resolution_status || 'Not available'}</p>
                  </div>
                </div>

                {(report.image_url || report.resolution_image_url) && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <p className="text-slate-500">Current image</p>
                      {report.image_url ? <img src={report.image_url} alt="report" className="mt-3 rounded-3xl w-full object-cover" /> : <p className="mt-2 text-sm text-slate-500">No image available</p>}
                    </div>
                    {report.status === 'RESOLVED' && report.resolution_image_url && (
                      <div>
                        <p className="text-slate-500">Before / After</p>
                        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="rounded-3xl overflow-hidden border border-slate-200">
                            <p className="bg-slate-100 px-3 py-2 text-sm font-semibold">Before</p>
                            <img src={report.image_url} alt="before" className="w-full h-48 object-cover" />
                          </div>
                          <div className="rounded-3xl overflow-hidden border border-slate-200">
                            <p className="bg-slate-100 px-3 py-2 text-sm font-semibold">After</p>
                            <img src={report.resolution_image_url} alt="after" className="w-full h-48 object-cover" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 text-center text-sm text-slate-500">
          <p>Authority dashboard remains separate. This portal displays public-safe report status only.</p>
          <Link to="/dashboard" className="inline-block mt-3 text-sky-700 underline">Go to Authority Dashboard</Link>
        </div>
      </div>
    </div>
  )
}
