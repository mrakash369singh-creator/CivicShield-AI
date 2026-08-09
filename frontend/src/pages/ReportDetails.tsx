import React, {useEffect, useState} from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'

const statusSteps = ['REPORTED', 'VERIFIED', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED']

function formatDuration(seconds: number | null | undefined) {
  if (seconds == null || Number.isNaN(seconds)) return 'Not available'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hrs}h ${mins}m`
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not available'
  const date = new Date(value)
  return isNaN(date.getTime()) ? 'Not available' : date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    RESOLVED: 'bg-emerald-100 text-emerald-800',
    'IN PROGRESS': 'bg-sky-100 text-sky-800',
    VERIFIED: 'bg-slate-100 text-slate-800',
    ASSIGNED: 'bg-violet-100 text-violet-800',
    REPORTED: 'bg-gray-100 text-gray-800',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

function slaBadge(status: string) {
  const map: Record<string, string> = {
    'ON TRACK': 'bg-emerald-100 text-emerald-800',
    'DUE SOON': 'bg-amber-100 text-amber-800',
    BREACHED: 'bg-rose-100 text-rose-800',
    COMPLETED: 'bg-emerald-100 text-emerald-800',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

function progressLabel(value: number | null | undefined, max: number, suffix = '') {
  if (value == null || Number.isNaN(value)) return 'Not available'
  return `${value}${suffix}`
}

export default function ReportDetails(){
  const { id } = useParams()
  const [report, setReport] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [selectedDept, setSelectedDept] = useState<string>('')
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [resolutionFile, setResolutionFile] = useState<File | null>(null)
  const [uploadingResolution, setUploadingResolution] = useState(false)

  useEffect(()=>{
    if(!id) return
    axios.get(`http://localhost:8000/api/reports/${id}`).then(r=>setReport(r.data))
    axios.get(`http://localhost:8000/api/reports/${id}/timeline`).then(r=>setTimeline(r.data))
    axios.get('http://localhost:8000/api/departments').then(r=>setDepartments(r.data))
  },[id])

  const refreshReport = async () => {
    if(!id) return
    const r = await axios.get(`http://localhost:8000/api/reports/${id}`)
    setReport(r.data)
  }

  const updateTimeline = async () => {
    if(!id) return
    const tl = await axios.get(`http://localhost:8000/api/reports/${id}/timeline`)
    setTimeline(tl.data)
  }

  const currentStatus = report?.status || 'UNKNOWN'
  const currentPriority = report?.priority_level || report?.priority || 'Not available'
  const confidencePct = report?.confidence != null ? Math.round(report.confidence * 100) : null
  const severityValue = report?.severity != null ? Number(report.severity) : null
  const priorityScore = report?.priority_score != null ? Number(report.priority_score) : null
  const priorityReasons = Array.isArray(report?.priority_reasons) ? report.priority_reasons : (report?.priority_reasons ? [report.priority_reasons] : [])
  const assignedDepartment = report?.department || report?.recommended_department || 'Not available'
  const locationText = report?.latitude != null && report?.longitude != null ? `${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}` : 'Not available'
  const imageUrl = report?.image_url || report?.image_path || null
  const resolutionImageUrl = report?.resolution_image_url || null
  const slaTarget = report?.sla_target_hours != null ? `${report.sla_target_hours} hours` : 'Not available'
  const slaDeadline = report?.sla_deadline ? formatDate(report.sla_deadline) : 'Not available'
  const slaStatus = report?.sla_status || 'Not available'
  const slaRemaining = report?.sla_remaining_seconds != null ? formatDuration(report.sla_remaining_seconds) : 'Not available'
  const departmentReason = report?.department_reason || 'No recommendation details available.'

  if(!report) return <div className="p-6 min-h-screen bg-slate-50 text-slate-900">Loading report details…</div>

  return (
    <div className="p-6 min-h-screen bg-slate-50 text-slate-900">
      <div className="space-y-6">
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Civic Issue Report</div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold uppercase tracking-[0.08em] text-slate-700">{report.issue_type || 'Unknown'}</span>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold uppercase ${statusBadge(currentStatus)}`}>{currentStatus}</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Report ID</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{report.external_id || `#${report.id}`}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Priority</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{currentPriority}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Reported</div>
              <div className="mt-2 text-sm text-slate-900">{formatDate(report.created_at)}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Location</div>
              <div className="mt-2 text-sm text-slate-900">{locationText}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Department</div>
              <div className="mt-2 text-sm text-slate-900">{assignedDepartment}</div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                  <span>🤖</span>
                  <span>AI Analysis</span>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Analysis</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Issue</div>
                  <div className="mt-3 text-lg font-semibold text-slate-900">{report.issue_type || 'Unknown'}</div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Confidence</div>
                  <div className="mt-3 text-lg font-semibold text-slate-900">{confidencePct != null ? `${confidencePct}%` : 'Not available'}</div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${confidencePct ?? 0}%` }} />
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Severity</div>
                  <div className="mt-3 text-lg font-semibold text-slate-900">{severityValue != null ? `${severityValue}/10` : 'Not available'}</div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${Math.min(100, (severityValue ?? 0) * 10)}%` }} />
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Safety Risk</div>
                  <div className="mt-3 text-lg font-semibold text-slate-900">{report.safety_risk || 'Not available'}</div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Priority</div>
                  <div className="mt-3 text-lg font-semibold text-slate-900">{priorityScore != null ? `${priorityScore}/100` : 'Not available'}</div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-fuchsia-500 transition-all" style={{ width: `${priorityScore ?? 0}%` }} />
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Priority Level</div>
                  <div className="mt-3 text-lg font-semibold text-slate-900">{currentPriority}</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Why this priority?</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {priorityReasons.length > 0 ? priorityReasons.map((reason:any, idx:any) => (
                    <span key={idx} className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm text-slate-700">✓ {reason}</span>
                  )) : <div className="text-sm text-slate-500">No priority reasons available.</div>}
                </div>
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-slate-900">🏢 Recommended Department</div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-700">Recommendation</span>
                </div>
                <div className="mt-4 text-xl font-semibold text-slate-900">{report.recommended_department || 'Not available'}</div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{departmentReason}</p>
                <button className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700" onClick={async () => {
                  if (!selectedDept || !id) return
                  try {
                    await axios.post(`http://localhost:8000/api/reports/${id}/assign`, new URLSearchParams({ department_id: selectedDept }))
                    await refreshReport()
                    await updateTimeline()
                  } catch (e) {
                    alert('Assignment failed')
                  }
                }}>Confirm Assignment</button>
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-lg font-semibold text-slate-900">⏱ Service Level Agreement</div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Priority</div>
                    <div className="mt-2 text-base font-semibold text-slate-900">{currentPriority}</div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Target</div>
                    <div className="mt-2 text-base font-semibold text-slate-900">{slaTarget}</div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Deadline</div>
                    <div className="mt-2 text-base font-semibold text-slate-900">{slaDeadline}</div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Remaining</div>
                    <div className="mt-2 text-base font-semibold text-slate-900">{slaRemaining}</div>
                  </div>
                </div>
                <div className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${slaBadge(slaStatus)}">
                  <span className="h-2.5 w-2.5 rounded-full bg-current"></span>
                  <span className={slaBadge(slaStatus)}>{slaStatus}</span>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-lg font-semibold text-slate-900">📍 Location</div>
                  <div className="mt-2 text-sm text-slate-600">{locationText}</div>
                </div>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">View on Map</a>
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="text-lg font-semibold text-slate-900">Original Report Image</div>
                <span className="text-sm text-slate-500">Captured evidence</span>
              </div>
              <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                {imageUrl ? (
                  <img className="h-full w-full object-cover" src={imageUrl} alt="Original report" />
                ) : (
                  <div className="flex min-h-[260px] items-center justify-center px-6 py-20 text-sm text-slate-500">Image unavailable</div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="text-lg font-semibold text-slate-900">Status Workflow</div>
                <div className="text-sm text-slate-500">Current phase</div>
              </div>
              <div className="mt-6 flex flex-col gap-4 md:flex-row md:gap-4">
                {statusSteps.map((step, index) => {
                  const isActive = statusSteps.indexOf(currentStatus) >= index
                  return (
                    <div key={step} className="flex items-start gap-4 md:flex-1 md:flex-col">
                      <div className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>{index + 1}</div>
                      <div className="min-w-0">
                        <div className={`text-sm font-semibold ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>{step}</div>
                        {isActive && <div className="mt-1 text-xs text-slate-500">{index === statusSteps.indexOf(currentStatus) ? 'Current' : 'Completed'}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-slate-900">🔍 Resolution Verification</div>
                  <div className="mt-1 text-sm text-slate-500">Before / after evidence</div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Before</div>
                  {imageUrl ? (
                    <img src={imageUrl} alt="Before repair" className="mt-4 mx-auto h-56 w-full max-w-full rounded-3xl object-cover" />
                  ) : (
                    <div className="mt-4 flex h-56 items-center justify-center rounded-3xl bg-white text-sm text-slate-500">Original image unavailable</div>
                  )}
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">After</div>
                  {resolutionImageUrl ? (
                    <img src={resolutionImageUrl} alt="After repair" className="mt-4 mx-auto h-56 w-full max-w-full rounded-3xl object-cover" />
                  ) : (
                    <div className="mt-4 flex h-56 flex-col items-center justify-center rounded-3xl bg-white text-sm text-slate-500">
                      <p className="mb-2">No resolution evidence uploaded yet.</p>
                      <p className="text-xs text-slate-400">Upload an after image to verify the repair.</p>
                    </div>
                  )}
                </div>
              </div>

              {resolutionImageUrl && report.resolution_status && (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-sm font-semibold text-slate-900">AI Verification</div>
                  <div className="mt-3 flex items-center gap-3 text-3xl font-semibold text-slate-900">{report.resolution_score ?? 0}/100</div>
                  <div className={`mt-3 inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold ${report.resolution_status === 'VERIFIED RESOLVED' ? 'bg-emerald-100 text-emerald-800' : report.resolution_status === 'LIKELY RESOLVED' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                    {report.resolution_status === 'VERIFIED RESOLVED' ? '✓ VERIFIED RESOLVED' : report.resolution_status === 'LIKELY RESOLVED' ? '✓ LIKELY RESOLVED' : `⚠ ${report.resolution_status}`}
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    {(report.resolution_reasons || []).map((reason:any, idx:any) => (
                      <p key={idx}>✓ {reason}</p>
                    ))}
                  </div>
                  {report.resolution_verified_at && <p className="mt-4 text-xs text-slate-500">Verified at {formatDate(report.resolution_verified_at)}</p>}
                </div>
              )}
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="text-lg font-semibold text-slate-900">🕒 Timeline</div>
                <div className="text-sm text-slate-500">Activity history</div>
              </div>
              <div className="mt-6 space-y-4">
                {timeline.length > 0 ? timeline.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex h-full flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-slate-900" />
                      {index < timeline.length - 1 && <div className="mt-1 h-full w-px bg-slate-200" />}
                    </div>
                    <div className="flex-1 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-900">{item.status}</div>
                      <div className="mt-1 text-sm text-slate-600">{item.note}</div>
                      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">{formatDate(item.timestamp)}</div>
                    </div>
                  </div>
                )) : <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">No timeline events available yet.</div>}
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-lg font-semibold text-slate-900">Report Actions</div>
              <div className="mt-5 space-y-5">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-700">Department</div>
                  <select className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900" value={selectedDept} onChange={e=>setSelectedDept(e.target.value)}>
                    <option value="">Select department</option>
                    {departments.map((d:any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <button className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800" onClick={async () => {
                    if (!selectedDept || !id) return
                    try {
                      await axios.post(`http://localhost:8000/api/reports/${id}/assign`, new URLSearchParams({ department_id: selectedDept }))
                      await refreshReport()
                      await updateTimeline()
                    } catch (e) {
                      alert('Assignment failed')
                    }
                  }}>Confirm Assignment</button>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-700">Status</div>
                  <div className="mt-3">
                    <select className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900" value={currentStatus} onChange={async (e) => {
                      if (!id) return
                      const nextStatus = e.target.value
                      setStatusUpdating(true)
                      try {
                        await axios.post(`http://localhost:8000/api/reports/${id}/status`, new URLSearchParams({ status: nextStatus }))
                        await refreshReport()
                        await updateTimeline()
                      } catch (err) {
                        alert('Status update failed')
                      }
                      setStatusUpdating(false)
                    }}>
                      {statusSteps.map(step => <option key={step} value={step}>{step}</option>)}
                    </select>
                  </div>
                  <button className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60" disabled={statusUpdating} onClick={async () => {
                    if (!id) return
                    setStatusUpdating(true)
                    try {
                      await axios.post(`http://localhost:8000/api/reports/${id}/status`, new URLSearchParams({ status: currentStatus }))
                      await refreshReport()
                      await updateTimeline()
                    } catch (err) {
                      alert('Status update failed')
                    }
                    setStatusUpdating(false)
                  }}>{statusUpdating ? 'Updating…' : 'Update Status'}</button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
