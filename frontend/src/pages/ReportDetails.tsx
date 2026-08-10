import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams, Link } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'

const statusSteps = ['REPORTED', 'VERIFIED', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED']

function formatDuration(seconds: number | null | undefined) {
  if (seconds == null || Number.isNaN(seconds)) return 'N/A'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hrs}h ${mins}m`
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'N/A'
  const date = new Date(value)
  return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    RESOLVED: 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20',
    'IN PROGRESS': 'bg-cyan-500/10 text-cyan-200 border border-cyan-500/20',
    VERIFIED: 'bg-slate-500/10 text-slate-200 border border-slate-500/20',
    ASSIGNED: 'bg-violet-500/10 text-violet-200 border border-violet-500/20',
    REPORTED: 'bg-amber-500/10 text-amber-200 border border-amber-500/20',
  }
  return map[status] || 'bg-slate-500/10 text-slate-200 border border-slate-500/20'
}

function priorityBadge(priority: string) {
  const map: Record<string, string> = {
    CRITICAL: 'bg-rose-500/10 text-rose-200 border border-rose-500/20',
    HIGH: 'bg-orange-500/10 text-orange-200 border border-orange-500/20',
    MEDIUM: 'bg-amber-500/10 text-amber-200 border border-amber-500/20',
    LOW: 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20',
  }
  return map[priority] || 'bg-slate-500/10 text-slate-200 border border-slate-500/20'
}

function slaBadge(status: string) {
  const map: Record<string, string> = {
    'ON TRACK': 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20',
    'DUE SOON': 'bg-amber-500/10 text-amber-200 border border-amber-500/20',
    BREACHED: 'bg-rose-500/10 text-rose-200 border border-rose-500/20',
    COMPLETED: 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20',
  }
  return map[status] || 'bg-slate-500/10 text-slate-200 border border-slate-500/20'
}

export default function ReportDetails() {
  const { id } = useParams()
  const [report, setReport] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [selectedDept, setSelectedDept] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('REPORTED')
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [uploadingResolution, setUploadingResolution] = useState(false)
  const [resolutionFile, setResolutionFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    axios.get(`${API_BASE_URL}/api/reports/${id}`).then((r) => {
      setReport(r.data)
      setSelectedStatus(r.data?.status || 'REPORTED')
    })
    axios.get(`${API_BASE_URL}/api/reports/${id}/timeline`).then((r) => setTimeline(r.data))
    axios.get(`${API_BASE_URL}/api/departments`).then((r) => setDepartments(r.data))
  }, [id])

  const refreshReport = async () => {
    if (!id) return
    const r = await axios.get(`${API_BASE_URL}/api/reports/${id}`)
    setReport(r.data)
    setSelectedStatus(r.data?.status || 'REPORTED')
  }

  const updateTimeline = async () => {
    if (!id) return
    const tl = await axios.get(`${API_BASE_URL}/api/reports/${id}/timeline`)
    setTimeline(tl.data)
  }

  const handleAssign = async () => {
    if (!selectedDept || !id) return
    try {
      await axios.post(`${API_BASE_URL}/api/reports/${id}/assign`, new URLSearchParams({ department_id: selectedDept }))
      await refreshReport()
      await updateTimeline()
    } catch (err) {
      alert('Assignment failed')
    }
  }

  const handleStatusUpdate = async () => {
    if (!id) return
    setStatusUpdating(true)
    try {
      await axios.post(`${API_BASE_URL}/api/reports/${id}/status`, new URLSearchParams({ status: selectedStatus }))
      await refreshReport()
      await updateTimeline()
    } catch (err) {
      alert('Status update failed')
    }
    setStatusUpdating(false)
  }

  const handleResolutionUpload = async () => {
    if (!id || !resolutionFile) return
    const formData = new FormData()
    formData.append('file', resolutionFile)
    setUploadingResolution(true)
    setUploadError(null)
    try {
      await axios.post(`${API_BASE_URL}/api/reports/${id}/resolution-evidence`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await refreshReport()
      await updateTimeline()
      setResolutionFile(null)
    } catch (err) {
      setUploadError('Unable to upload resolution evidence. Please try again.')
    } finally {
      setUploadingResolution(false)
    }
  }

  const currentStatus = report?.status || 'UNKNOWN'
  const currentPriority = report?.priority_level || report?.priority || 'Not available'
  const confidencePct = report?.confidence != null ? Math.round(report.confidence * 100) : null
  const severityValue = report?.severity != null ? Number(report.severity) : null
  const priorityScore = report?.priority_score != null ? Number(report.priority_score) : null
  const priorityReasons = Array.isArray(report?.priority_reasons)
    ? report.priority_reasons
    : report?.priority_reasons
      ? [report.priority_reasons]
      : []
  const assignedDepartment = report?.department || report?.recommended_department || 'Not available'
  const locationText = report?.latitude != null && report?.longitude != null ? `${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}` : 'Not available'
  const imageUrl = report?.image_url || report?.image_path || null
  const resolutionImageUrl = report?.resolution_image_url || null
  const slaTarget = report?.sla_target_hours != null ? `${report.sla_target_hours} hours` : 'N/A'
  const slaDeadline = report?.sla_deadline ? formatDate(report.sla_deadline) : 'N/A'
  const slaStatus = report?.sla_status || 'N/A'
  const slaRemaining = report?.sla_remaining_seconds != null ? formatDuration(report.sla_remaining_seconds) : 'N/A'
  const departmentReason = report?.department_reason || 'No recommendation details available.'
  const hotspotDetected = Boolean(report?.hotspot_detected)
  const hotspotRadius = report?.hotspot_radius_meters != null ? `${Math.round(report.hotspot_radius_meters)} m` : 'N/A'
  const hotspotReason = report?.hotspot_reason || 'No hotspot identified.'
  const relatedReportCount = report?.related_report_count ?? 0
  const relatedReportIds = Array.isArray(report?.related_report_ids) ? report.related_report_ids : []
  const currentStatusIndex = Math.max(0, statusSteps.indexOf(currentStatus))
  const slaClass = slaBadge(slaStatus)
  const priorityClass = priorityBadge(currentPriority)

  const openInMaps = () => {
    if (report?.latitude == null || report?.longitude == null) return
    const lat = report.latitude
    const lon = report.longitude
    const mapUrl = `https://www.google.com/maps?q=${lat},${lon}`
    window.open(mapUrl, '_blank', 'noopener')
  }

  const handleQuickAssign = async () => {
    // Try to auto-select department by name and assign
    if (!report) return
    const recName = report.recommended_department
    if (!recName) return
    const match = departments.find((d) => d.name && d.name.toLowerCase() === String(recName).toLowerCase())
    if (match) {
      setSelectedDept(String(match.id))
      try {
        await axios.post(`${API_BASE_URL}/api/reports/${report.id}/assign`, new URLSearchParams({ department_id: String(match.id) }))
        await refreshReport()
        await updateTimeline()
      } catch (err) {
        alert('Assignment failed')
      }
    } else {
      alert('Recommended department not found in department list. Please assign using the Authority Actions card.')
    }
  }

  if (!report) {
    return <div className="min-h-screen bg-[#020b16] p-6 text-slate-100">Loading report details…</div>
  }

  return (
    <div className="min-h-screen bg-[#020b16] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <header className="glass-panel rounded-[20px] border border-slate-700/80 p-6 shadow-[0_14px_40px_rgba(2,6,23,0.6)] md:p-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <Link to="/reports" className="text-sm font-medium text-slate-300 hover:text-white">← Back to Reports</Link>
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">Report</div>
                <div className="mt-1 flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">{report.external_id || `#${report.id}`}</h1>
                  <div className="text-lg font-semibold text-slate-200">{report.issue_type || 'Issue'}</div>
                  <div className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${priorityClass}`}>{currentPriority}</div>
                  <div className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${slaClass}`}>{slaStatus}</div>
                </div>
                <div className="mt-2 text-sm text-slate-400">Location: <span className="font-mono text-slate-100">{locationText}</span></div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={openInMaps} className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-400/40 hover:text-cyan-100">
                ↗ Open in Maps
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-[18px] border border-slate-700 bg-slate-900/60 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Confidence</div>
              <div className="mt-2 text-2xl font-semibold text-white">{confidencePct != null ? `${confidencePct}%` : 'N/A'}</div>
            </div>
            <div className="rounded-[18px] border border-slate-700 bg-slate-900/60 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Severity</div>
              <div className="mt-2 text-2xl font-semibold text-white">{severityValue != null ? `${severityValue}/10` : 'N/A'}</div>
            </div>
            <div className="rounded-[18px] border border-slate-700 bg-slate-900/60 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Safety Risk</div>
              <div className="mt-2 text-2xl font-semibold text-white">{report.safety_risk || 'N/A'}</div>
            </div>
            <div className="rounded-[18px] border border-slate-700 bg-slate-900/60 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Priority Score</div>
              <div className="mt-2 text-2xl font-semibold text-white">{priorityScore != null ? `${priorityScore}/100` : 'N/A'}</div>
              <div className="mt-1 text-sm text-slate-300">{currentPriority}</div>
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <section className="glass-panel rounded-[30px] border border-slate-700/80 p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-lg font-semibold text-white">
                  <span className="text-xl">🤖</span>
                  <span>AI Incident Analysis</span>
                </div>
                <span className="rounded-full border border-slate-600 bg-slate-900/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Analysis
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: 'Detected Issue', value: report.issue_type || 'Unknown', accent: 'bg-cyan-400' },
                  { label: 'Confidence', value: confidencePct != null ? `${confidencePct}%` : 'N/A', progress: confidencePct ?? 0, barColor: 'bg-emerald-400' },
                  { label: 'Severity', value: severityValue != null ? `${severityValue}/10` : 'N/A', progress: severityValue != null ? Math.min(100, severityValue * 10) : 0, barColor: 'bg-orange-400' },
                  { label: 'Safety Risk', value: report.safety_risk || 'N/A', accent: 'bg-red-400' },
                  { label: 'Priority Score', value: priorityScore != null ? `${priorityScore}/100` : 'N/A', progress: priorityScore != null ? priorityScore : 0, barColor: 'bg-violet-400' },
                  { label: 'Priority Level', value: currentPriority, accent: 'bg-blue-400' },
                ].map((item) => (
                  <div key={item.label} className="hover-lift rounded-[24px] border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">{item.label}</div>
                    <div className="mt-3 text-lg font-semibold text-white">{item.value}</div>
                    {item.progress !== undefined && (
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                        <div className={`${item.barColor} h-full rounded-full`} style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[24px] border border-slate-700 bg-slate-900/60 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Why this priority?</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {priorityReasons.length > 0 ? priorityReasons.map((reason: any, idx: number) => (
                    <span key={idx} className="rounded-full border border-slate-600 bg-slate-950/80 px-3 py-1.5 text-sm text-slate-200">
                      ✓ {reason}
                    </span>
                  )) : <span className="text-sm text-slate-400">No priority reasons available.</span>}
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="glass-panel rounded-[30px] border border-slate-700/80 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-lg font-semibold text-white">
                    <span className="text-xl">🤖</span>
                    <span>AI Recommendation</span>
                  </div>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">High Confidence</span>
                </div>

                <div className="rounded-[24px] border border-slate-700 bg-slate-900/60 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Recommended Department</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{report.recommended_department || assignedDepartment}</div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{departmentReason}</p>
                </div>

                <button onClick={handleQuickAssign} className="mt-4 w-full rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100 transition hover:brightness-110">
                  Confirm Assignment
                </button>
              </div>

              <div className="glass-panel rounded-[30px] border border-slate-700/80 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-lg font-semibold text-white">
                    <span className="text-xl">⏱</span>
                    <span>SLA Intelligence</span>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${slaClass}`}>{slaStatus}</span>
                </div>

                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2"><span>Priority</span><span className="font-medium text-white">{currentPriority}</span></div>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2"><span>Target</span><span className="font-medium text-white">{slaTarget}</span></div>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2"><span>Deadline</span><span className="font-medium text-white">{slaDeadline}</span></div>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2"><span>Remaining</span><span className="font-medium text-white">{slaRemaining}</span></div>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2"><span>Status</span><span className="font-medium text-white">{slaStatus}</span></div>
                </div>
              </div>
            </section>

            {hotspotDetected && (
              <section className="glass-panel rounded-[30px] border border-red-500/20 bg-red-500/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-lg font-semibold text-white">
                    <span className="text-xl">🔥</span>
                    <span>Civic Hotspot Detected</span>
                  </div>
                  <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-200">Critical hotspot</span>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[22px] border border-red-500/20 bg-slate-900/60 p-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Related reports</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{relatedReportCount}</div>
                  </div>
                  <div className="rounded-[22px] border border-red-500/20 bg-slate-900/60 p-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Radius</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{hotspotRadius}</div>
                  </div>
                  <div className="rounded-[22px] border border-red-500/20 bg-slate-900/60 p-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Hotspot reason</div>
                    <div className="mt-2 text-sm text-slate-200">{hotspotReason}</div>
                  </div>
                </div>
              </section>
            )}

            <section className="glass-panel rounded-[30px] border border-slate-700/80 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-lg font-semibold text-white">
                  <span className="text-xl">📷</span>
                  <span>Incident Evidence</span>
                </div>
                <span className="rounded-full border border-slate-600 bg-slate-900/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">Evidence Center</span>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="overflow-hidden rounded-[24px] border border-slate-700 bg-slate-900/60">
                  <div className="border-b border-slate-700 bg-slate-900/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Original Evidence</div>
                  {imageUrl ? <img src={imageUrl} alt="Original report" className="h-72 w-full object-cover transition duration-300 hover:scale-[1.02]" /> : <div className="flex h-72 items-center justify-center text-slate-400">No image available</div>}
                </div>

                <div className="overflow-hidden rounded-[24px] border border-slate-700 bg-slate-900/60">
                  <div className="border-b border-slate-700 bg-slate-900/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Resolution Evidence</div>
                  {resolutionImageUrl ? <img src={resolutionImageUrl} alt="Resolution evidence" className="h-72 w-full object-cover transition duration-300 hover:scale-[1.02]" /> : <div className="flex h-72 flex-col items-center justify-center gap-3 px-5 text-center text-slate-400"><span className="text-4xl">📷</span><span>No resolution evidence uploaded yet.</span></div>}
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.2fr_1.8fr]">
              <div className="glass-panel rounded-[30px] border border-slate-700/80 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-lg font-semibold text-white">
                    <span className="text-xl">✓</span>
                    <span>AI Resolution Verification</span>
                  </div>
                </div>

                <div className="flex items-center justify-center py-3">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border border-emerald-500/30 bg-[radial-gradient(circle,_rgba(16,185,129,0.18),_rgba(15,23,42,0.7)_60%)] text-2xl font-semibold text-emerald-300">
                    {report.resolution_score != null ? `${Math.round(report.resolution_score * 100)} / 100` : 'N/A'}
                  </div>
                </div>

                <div className="mt-3 rounded-[22px] border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300">
                  <div className="font-semibold text-white">{report.resolution_status || 'Likely resolved'}</div>
                  <div className="mt-2">{report.resolution_reasons || 'Visual improvement detected.'}</div>
                </div>
              </div>

              <div className="glass-panel rounded-[30px] border border-slate-700/80 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-lg font-semibold text-white">
                    <span className="text-xl">📋</span>
                    <span>Authority Actions</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[22px] border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Department</div>
                    <select className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950/80 px-3 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                      <option value="">Select department</option>
                      {departments.map((dept) => (
                        <option key={dept.id || dept.name} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                    <button className="mt-3 w-full rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100 hover:bg-cyan-500/15" onClick={handleAssign}>
                      Confirm Assignment
                    </button>
                  </div>

                  <div className="rounded-[22px] border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Status</div>
                    <select className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950/80 px-3 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                      {statusSteps.map((step) => (
                        <option key={step} value={step}>{step}</option>
                      ))}
                    </select>
                    <button className="mt-3 w-full rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100 hover:bg-emerald-500/15" onClick={handleStatusUpdate} disabled={statusUpdating}>
                      {statusUpdating ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>

                  <div className="rounded-[22px] border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Resolution Evidence</div>
                    <input type="file" className="mt-3 w-full rounded-xl border border-slate-600 bg-slate-950/80 px-3 py-3 text-sm text-slate-200" onChange={(e) => setResolutionFile(e.target.files?.[0] || null)} />
                    <button className="mt-3 w-full rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-100 hover:bg-violet-500/15" onClick={handleResolutionUpload} disabled={uploadingResolution || !resolutionFile}>
                      {uploadingResolution ? 'Uploading...' : 'Upload Resolution Evidence'}
                    </button>
                    {uploadError && <p className="mt-2 text-sm text-rose-300">{uploadError}</p>}
                  </div>
                </div>
              </div>
            </section>

            <section className="glass-panel rounded-[30px] border border-slate-700/80 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-lg font-semibold text-white">
                  <span className="text-xl">↗</span>
                  <span>Status Workflow</span>
                </div>
              </div>

              <div className="timeline-line relative flex flex-wrap gap-4 md:gap-5">
                {statusSteps.map((step, index) => {
                  const isDone = index <= currentStatusIndex
                  const isCurrent = step === currentStatus
                  return (
                    <div key={step} className="relative flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold ${isDone ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : isCurrent ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200' : 'border-slate-600 bg-slate-900/80 text-slate-400'}`}>
                        {isDone ? '✓' : index + 1}
                      </div>
                      <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-300">{step}</div>
                      {index < statusSteps.length - 1 && <div className="hidden h-px w-8 bg-slate-700 md:block" />}
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="glass-panel rounded-[30px] border border-slate-700/80 p-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Location</div>
              <div className="mt-3 font-mono text-lg text-white">{locationText}</div>
              {report.latitude != null && report.longitude != null && (
                <div className="mt-3 overflow-hidden rounded-lg border border-slate-700 bg-slate-900/60" style={{ height: 160 }}>
                  <MapContainer center={[report.latitude, report.longitude]} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[report.latitude, report.longitude]} />
                  </MapContainer>
                </div>
              )}

              <button onClick={openInMaps} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100 hover:border-cyan-400/40 hover:text-cyan-100">
                ↗ Open in Maps
              </button>
            </div>

            <div className="glass-panel rounded-[30px] border border-slate-700/80 p-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Activity Timeline</div>
              <div className="timeline-line relative mt-5 space-y-4">
                {timeline.length > 0 ? timeline.map((entry) => (
                  <div key={entry.id || `${entry.action}-${entry.timestamp}`} className="relative pl-8">
                    <span className="absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 text-[10px] text-cyan-200">•</span>
                    <div className="rounded-[18px] border border-slate-700 bg-slate-900/60 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">{entry.status || entry.action || 'Timeline Event'}</div>
                      <div className="mt-2 text-sm text-white">{entry.message || entry.note || 'Status updated'}</div>
                      <div className="mt-2 text-[11px] text-slate-400">{formatDate(entry.timestamp || entry.created_at)}</div>
                    </div>
                  </div>
                )) : <div className="rounded-[18px] border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-300">No timeline entries yet.</div>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

