import React, { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../config'

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

const statusClass = (status: string) => {
  if (status === 'RESOLVED') return 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20'
  if (status === 'IN PROGRESS') return 'bg-cyan-500/10 text-cyan-200 border border-cyan-500/20'
  if (status === 'ASSIGNED') return 'bg-violet-500/10 text-violet-200 border border-violet-500/20'
  if (status === 'VERIFIED') return 'bg-slate-500/10 text-slate-200 border border-slate-500/20'
  return 'bg-amber-500/10 text-amber-200 border border-amber-500/20'
}

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
      const res = await axios.get(`${API_BASE_URL}/api/public/reports/${reportId}`)
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
    <div className="min-h-screen bg-[#020b16] text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:px-8">
        <header className="mb-8 rounded-[30px] border border-slate-700/80 bg-slate-950/60 p-6 text-center shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300">CivicShield AI</p>
          <h1 className="mt-3 text-4xl font-semibold text-white md:text-5xl">Track your civic report</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-300">Follow your issue from submission through verification, assignment, and field resolution.</p>
        </header>

        <div className="glass-panel mb-8 rounded-[30px] border border-slate-700/80 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Enter report ID</label>
              <input
                className="w-full rounded-2xl border border-slate-600 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                placeholder="CS-XXXXXXXX"
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
              />
            </div>
            <button
              className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100 transition hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={fetchReport}
              disabled={loading}
            >
              {loading ? 'Checking…' : 'Track report'}
            </button>
          </div>
          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
        </div>

        {report && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="glass-panel rounded-[26px] border border-slate-700/80 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Report ID</p>
                <p className="mt-2 text-2xl font-semibold text-white">{report.report_id}</p>
                <p className="mt-4 text-sm text-slate-400">Reported</p>
                <p className="mt-1 text-base text-slate-100">{new Date(report.reported_date).toLocaleString()}</p>
              </div>
              <div className="glass-panel rounded-[26px] border border-slate-700/80 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Current status</p>
                <div className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${statusClass(report.status)}`}>
                  {report.status}
                </div>
                <p className="mt-4 text-sm text-slate-400">Expected resolution</p>
                <p className="mt-1 text-base text-slate-100">{report.sla_deadline ? new Date(report.sla_deadline).toLocaleString() : 'Not available'}</p>
              </div>
              <div className="glass-panel rounded-[26px] border border-slate-700/80 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Priority</p>
                <p className="mt-2 text-2xl font-semibold text-white">{report.priority_level}</p>
                <p className="mt-4 text-sm text-slate-400">Department</p>
                <p className="mt-1 text-base text-slate-100">{report.department || 'Unassigned'}</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="glass-panel rounded-[30px] border border-slate-700/80 p-6">
                <h3 className="text-xl font-semibold text-white">Progress timeline</h3>
                <div className="timeline-line relative mt-6 space-y-5">
                  {steps.map((step, index) => {
                    const completed = index <= currentStepIndex
                    const active = report.status === step
                    return (
                      <div key={step} className="relative flex items-start gap-4 pl-8">
                        <div className={`absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold ${completed ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : active ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200' : 'border-slate-700 bg-slate-900/80 text-slate-400'}`}>
                          {completed ? '✓' : index + 1}
                        </div>
                        <div>
                          <p className={`font-semibold ${completed || active ? 'text-white' : 'text-slate-400'}`}>{statusStepLabel(step)}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                            {active ? 'Current stage' : completed ? 'Completed' : 'Pending'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-6 rounded-[20px] border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
                  <span className="text-slate-400">SLA status:</span> {report.sla_status}
                </div>
              </div>

              <div className="glass-panel rounded-[30px] border border-slate-700/80 p-6">
                <h3 className="text-xl font-semibold text-white">Report details</h3>
                <div className="mt-5 space-y-4 text-sm text-slate-300">
                  <div className="rounded-[20px] border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Issue</div>
                    <div className="mt-2 text-lg font-medium text-white">{report.issue}</div>
                  </div>
                  <div className="rounded-[20px] border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">SLA status</div>
                    <div className="mt-2 text-lg font-medium text-white">{report.sla_status}</div>
                  </div>
                  <div className="rounded-[20px] border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Resolution</div>
                    <div className="mt-2 text-lg font-medium text-white">{report.resolution_status || 'Not available'}</div>
                  </div>
                </div>

                {(report.image_url || report.resolution_image_url) && (
                  <div className="mt-6 space-y-4">
                    <div className="overflow-hidden rounded-[20px] border border-slate-700 bg-slate-900/60 p-3">
                      <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Current image</div>
                      {report.image_url ? <img src={report.image_url} alt="report" className="h-52 w-full rounded-2xl object-cover" /> : <p className="text-sm text-slate-400">No image available</p>}
                    </div>
                    {report.status === 'RESOLVED' && report.resolution_image_url && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="overflow-hidden rounded-[20px] border border-slate-700 bg-slate-900/60 p-3">
                          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Before</p>
                          <img src={report.image_url} alt="before" className="h-40 w-full rounded-2xl object-cover" />
                        </div>
                        <div className="overflow-hidden rounded-[20px] border border-slate-700 bg-slate-900/60 p-3">
                          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">After</p>
                          <img src={report.resolution_image_url} alt="after" className="h-40 w-full rounded-2xl object-cover" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 text-center text-sm text-slate-400">
          <p>Authority dashboard remains separate. This portal displays public-safe report status only.</p>
          <Link to="/dashboard" className="mt-3 inline-block text-cyan-300 underline">Go to authority dashboard</Link>
        </div>
      </div>
    </div>
  )
}
