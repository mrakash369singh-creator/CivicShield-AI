import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Link } from 'react-router-dom'
import AlertCenter from '../components/AlertCenter'
import { API_BASE_URL } from '../config'

const colorForPriority = (p: string) => {
  if (p === 'CRITICAL') return '#f87171'
  if (p === 'HIGH') return '#fb923c'
  if (p === 'MEDIUM') return '#fbbf24'
  return '#34d399'
}

const navItems = [
  { label: 'Overview', icon: '⌂', active: true },
  { label: 'Analytics', icon: '📊' },
  { label: 'Live Map', icon: '🗺' },
  { label: 'Alerts', icon: '🚨' },
  { label: 'Reports', icon: '📋' },
  { label: 'Hotspots', icon: '🔥' },
  { label: 'Resolution', icon: '✓' },
  { label: 'Settings', icon: '⚙' },
]

const safeNumber = (value: number | undefined | null, fallback: string | number = '—') => {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback
  return value
}

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [reports, setReports] = useState<any[]>([])
  const [mapIssues, setMapIssues] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/dashboard/stats`).then((r) => setStats(r.data))
    axios.get(`${API_BASE_URL}/api/reports`).then((r) => setReports(r.data))
    axios.get(`${API_BASE_URL}/api/map/issues`).then((r) => setMapIssues(r.data))
    axios.get(`${API_BASE_URL}/api/alerts`).then((r) => setAlerts(r.data))
  }, [])

  const issueData = Array.isArray(stats?.distribution) ? stats.distribution : []
  const priorityData = Array.isArray(stats?.priority_distribution) ? stats.priority_distribution : []
  const statusData = Array.isArray(stats?.status_distribution) ? stats.status_distribution : []
  const reportsNeedingAssignment = reports.filter((report) => !report.department && report.status !== 'RESOLVED').length
  const inProgress = reports.filter((report) => ['ASSIGNED', 'IN PROGRESS'].includes(report.status)).length
  const openIssueCount = reports.filter((report) => report.status !== 'RESOLVED').length
  const hotspotList = reports.filter((report) => report.hotspot_detected)
  const cityHealthPercent = stats?.sla_compliance_rate ?? (stats?.total ? Math.max(0, Math.min(100, (stats?.verified_resolved ?? 0) / stats.total * 100)) : 0)
  const healthStatus = cityHealthPercent >= 75 ? 'Stable' : cityHealthPercent >= 50 ? 'Monitoring' : 'Needs attention'

  return (
    <div className="min-h-screen bg-[#020b16] text-slate-100">
      <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="command-sidebar border-r border-slate-700/80 bg-slate-950/70 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-slate-700/80 pb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-400 to-blue-600 text-lg font-black text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.45)]">
              C
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300">CivicShield AI</div>
              <div className="mt-1 text-sm font-medium text-slate-200">Smart City Command</div>
            </div>
          </div>

          <div className="mt-6 rounded-[26px] border border-slate-700/90 bg-slate-900/70 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">City Status</div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-3xl font-semibold text-white">{stats ? `${Math.round(cityHealthPercent)}%` : '—'}</div>
                <div className="mt-1 text-xs text-slate-400">SLA compliance</div>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-200">{healthStatus}</span>
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition-all ${item.active ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-100 ring-1 ring-cyan-500/30 shadow-[0_0_24px_rgba(34,211,238,0.18)]' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'}`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-base">
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-[26px] border border-slate-700/80 bg-gradient-to-br from-slate-900 to-slate-950 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Operations</div>
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2">
                <span>Dispatch queue</span>
                <span className="font-semibold text-cyan-200">{reportsNeedingAssignment}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2">
                <span>Field response</span>
                <span className="font-semibold text-emerald-200">{inProgress}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2">
                <span>Open issues</span>
                <span className="font-semibold text-amber-200">{openIssueCount}</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="grid-overlay min-h-screen p-4 md:p-6 xl:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="glass-panel flex flex-col gap-4 rounded-[30px] border border-slate-700/80 p-4 md:flex-row md:items-center md:justify-between md:p-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-400">Operations overview</p>
                <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Good morning, Authority</h1>
                <p className="mt-1 text-sm text-slate-300">Civic Infrastructure Intelligence Center</p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
                  <span className="status-pulse inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="font-medium">System operational</span>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-300">
                  <span className="text-slate-400">Last updated:</span> just now
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-black text-slate-950">A</div>
                  <div>
                    <div className="text-sm font-medium text-white">Admin</div>
                    <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Authority</div>
                  </div>
                </div>
              </div>
            </header>

            {stats && (
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                {[
                  { title: 'Total Reports', value: safeNumber(stats.total, 0), icon: '📊', tone: 'cyan' },
                  { title: 'Critical', value: safeNumber(stats.critical, 0), icon: '🚨', tone: 'red' },
                  { title: 'High Priority', value: safeNumber(stats.high, 0), icon: '⚠️', tone: 'orange' },
                  { title: 'Active Issues', value: safeNumber(openIssueCount, 0), icon: '🧭', tone: 'violet' },
                  { title: 'Civic Hotspots', value: hotspotList.length > 0 ? hotspotList.length : '—', icon: '📍', tone: 'amber' },
                  { title: 'Average Priority', value: safeNumber(stats.average_priority_score, 0), icon: '📈', tone: 'emerald' },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="hover-lift glass-panel relative overflow-hidden rounded-[24px] border p-4"
                    style={{
                      borderColor: card.tone === 'red' ? 'rgba(248,113,113,0.24)' : card.tone === 'orange' ? 'rgba(251,146,60,0.24)' : card.tone === 'amber' ? 'rgba(251,191,36,0.24)' : card.tone === 'cyan' ? 'rgba(103,232,249,0.24)' : card.tone === 'violet' ? 'rgba(139,92,246,0.24)' : 'rgba(52,211,153,0.24)',
                      background: card.tone === 'red' ? 'linear-gradient(180deg, rgba(127,29,29,0.28), rgba(15,23,42,0.72))' : card.tone === 'orange' ? 'linear-gradient(180deg, rgba(154,52,18,0.28), rgba(15,23,42,0.72))' : card.tone === 'amber' ? 'linear-gradient(180deg, rgba(120,53,15,0.28), rgba(15,23,42,0.72))' : card.tone === 'cyan' ? 'linear-gradient(180deg, rgba(14,116,144,0.28), rgba(15,23,42,0.72))' : card.tone === 'violet' ? 'linear-gradient(180deg, rgba(76,29,149,0.28), rgba(15,23,42,0.72))' : 'linear-gradient(180deg, rgba(6,78,59,0.28), rgba(15,23,42,0.72))',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">{card.title}</div>
                        <div className="mt-4 text-3xl font-semibold text-white">{card.value}</div>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/60 text-xl">
                        {card.icon}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-300">
                      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                      Live status
                    </div>
                  </div>
                ))}
              </section>
            )}

            <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
              <div className="glass-panel rounded-[30px] border border-slate-700/80 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">AI City Health</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Infrastructure health</h2>
                  </div>
                  <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">Live</span>
                </div>

                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="progress-ring relative h-36 w-36">
                    <div className="relative z-10 flex h-full w-full items-center justify-center text-3xl font-semibold text-white">
                      {stats ? `${Math.round(cityHealthPercent)}%` : '—'}
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Status</div>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-3xl font-semibold text-white">{healthStatus}</span>
                        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">{cityHealthPercent >= 75 ? 'Stable' : 'Needs attention'}</span>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm text-slate-300">
                      <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2">
                        <span>Critical backlog</span>
                        <span className="font-semibold text-red-300">{safeNumber(stats?.critical, 0)}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2">
                        <span>High priority</span>
                        <span className="font-semibold text-orange-300">{safeNumber(stats?.high, 0)}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2">
                        <span>SLA compliance</span>
                        <span className="font-semibold text-emerald-300">{stats?.sla_compliance_rate ?? 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-[30px] border border-slate-700/80 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">AI Priority Intelligence</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">Infrastructure Risk Mix</h2>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Critical', value: safeNumber(stats?.critical, 0), total: stats?.total ?? 1, color: 'bg-red-400' },
                    { label: 'High', value: safeNumber(stats?.high, 0), total: stats?.total ?? 1, color: 'bg-orange-400' },
                    { label: 'Medium', value: safeNumber(stats?.medium, 0), total: stats?.total ?? 1, color: 'bg-amber-400' },
                    { label: 'Low', value: safeNumber(stats?.low, 0), total: stats?.total ?? 1, color: 'bg-emerald-400' },
                  ].map((cat) => (
                    <div key={cat.label}>
                      <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                        <span>{cat.label}</span>
                        <span className="font-medium text-white">{cat.value}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                        <div className={`${cat.color} h-full rounded-full`} style={{ width: `${Math.max(8, (Number(cat.value) / Math.max(cat.total, 1)) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
              <div className="glass-panel overflow-hidden rounded-[30px] border border-slate-700/80 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Live Civic Map</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Civic Infrastructure Map</h2>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    <span className="status-pulse inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    Live
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" />Critical</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-400" />High</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />Medium</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />Low</span>
                </div>

                <div className="overflow-hidden rounded-[24px] border border-slate-700/80 bg-slate-900/60" style={{ height: '420px' }}>
                  <MapContainer center={[23.0225, 72.5714]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {mapIssues.map((m) => (
                      m.lat && m.lon && (
                        <React.Fragment key={m.id}>
                          <Marker
                            position={[m.lat, m.lon]}
                            icon={L.divIcon({
                              className: 'custom-marker',
                              html: `<span style="background:${colorForPriority(m.priority)};display:block;width:16px;height:16px;border-radius:50%;border:2px solid rgba(15,23,42,0.8);box-shadow:0 0 0 8px rgba(15,23,42,0.2)"></span>`,
                            })}
                          >
                            <Popup>
                              <div>
                                <div><strong>{m.issue_type}</strong></div>
                                <div>Priority: {m.priority}</div>
                                <div>Severity: {m.severity}</div>
                                <div>Status: {m.status}</div>
                                <div>Location: {m.lat.toFixed(5)}, {m.lon.toFixed(5)}</div>
                                <div><Link to={`/reports/${m.id}`}>Open Details</Link></div>
                              </div>
                            </Popup>
                          </Marker>
                          <Circle center={[m.lat, m.lon]} radius={Math.max(50, (m.priority_score || 10) * 10)} pathOptions={{ color: colorForPriority(m.priority), fillOpacity: 0.12 }} />
                        </React.Fragment>
                      )
                    ))}
                  </MapContainer>
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-panel rounded-[30px] border border-slate-700/80 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Issue Distribution</p>
                  <div className="mt-4" style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={issueData} dataKey="count" nameKey="issue_type" innerRadius={35} outerRadius={60}>
                          {issueData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={['#38bdf8', '#34d399', '#fbbf24', '#fb923c', '#a78bfa'][index % 5]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-panel rounded-[30px] border border-slate-700/80 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">SLA Overview</p>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2"><span>Critical</span><span className="font-semibold text-white">{safeNumber(stats?.sla_critical, 0)}</span></div>
                    <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2"><span>Due Soon</span><span className="font-semibold text-white">{safeNumber(stats?.sla_due_soon, 0)}</span></div>
                    <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2"><span>Breached</span><span className="font-semibold text-white">{safeNumber(stats?.sla_breached, 0)}</span></div>
                    <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2"><span>Compliance</span><span className="font-semibold text-white">{safeNumber(stats?.sla_compliance_rate, 0)}%</span></div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_1.8fr]">
              <div className="glass-panel rounded-[30px] border border-slate-700/80 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Civic Hotspot Intelligence</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Top Hotspots</h2>

                <div className="mt-5 space-y-4">
                  {hotspotList.length > 0 ? hotspotList.slice(0, 3).map((hotspot, index) => {
                    const priority = hotspot.priority_level || hotspot.priority || 'MEDIUM'
                    const severityTone = priority === 'CRITICAL' ? 'red' : priority === 'HIGH' ? 'orange' : priority === 'MEDIUM' ? 'amber' : 'emerald'
                    return (
                      <div key={hotspot.id} className="hover-lift rounded-[24px] border border-slate-700 bg-slate-900/60 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-lg font-semibold text-white">{hotspot.issue_type}</div>
                            <div className="mt-1 text-sm text-slate-400">{hotspot.recommended_department || hotspot.department || 'Department pending'}</div>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${severityTone === 'red' ? 'border border-red-500/20 bg-red-500/10 text-red-200' : severityTone === 'orange' ? 'border border-orange-500/20 bg-orange-500/10 text-orange-200' : severityTone === 'amber' ? 'border border-amber-500/20 bg-amber-500/10 text-amber-200' : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200'}`}>
                            {priority}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
                          <span>{hotspot.related_report_count ?? 0} related reports</span>
                          <span>{hotspot.latitude != null && hotspot.longitude != null ? `${hotspot.latitude.toFixed(4)}, ${hotspot.longitude.toFixed(4)}` : 'Location pending'}</span>
                        </div>

                        <button className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200 hover:bg-cyan-500/15">
                          View Reports
                        </button>
                      </div>
                    )
                  }) : (
                    <div className="rounded-[24px] border border-dashed border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-300">
                      No active hotspot clusters detected from the current report data.
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-panel rounded-[30px] border border-slate-700/80 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Recent Reports</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Priority Feed</h2>

                <div className="mt-5 space-y-3">
                  {reports.slice(0, 6).map((r) => (
                    <Link key={r.id} to={`/reports/${r.id}`} className="hover-lift block rounded-[20px] border border-slate-700 bg-slate-900/60 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-white">{r.external_id || `#${r.id}`}</div>
                          <div className="mt-1 text-xs text-slate-400">{r.issue_type}</div>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${r.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-200 border border-red-500/20' : r.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-200 border border-orange-500/20' : r.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-200 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20'}`}>
                          {r.priority}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            <div className="pb-8">
              <AlertCenter alerts={alerts} onMarkRead={async (id: number) => {
                await axios.post(`${API_BASE_URL}/api/alerts/${id}/read`)
                const r = await axios.get(`${API_BASE_URL}/api/alerts`)
                setAlerts(r.data)
              }} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
