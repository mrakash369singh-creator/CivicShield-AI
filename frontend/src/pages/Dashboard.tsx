import React, {useEffect, useState} from 'react'
import axios from 'axios'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Link } from 'react-router-dom'
import AlertCenter from '../components/AlertCenter'

const colorForPriority = (p: string) => {
  if(p==='CRITICAL') return 'red'
  if(p==='HIGH') return 'orange'
  if(p==='MEDIUM') return 'yellow'
  return 'green'
}

export default function Dashboard(){
  const [stats, setStats] = useState<any>(null)
  const [reports, setReports] = useState<any[]>([])
  const [mapIssues, setMapIssues] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(()=>{
    axios.get('http://localhost:8000/api/dashboard/stats').then(r=>setStats(r.data))
    axios.get('http://localhost:8000/api/reports').then(r=>setReports(r.data))
    axios.get('http://localhost:8000/api/map/issues').then(r=>setMapIssues(r.data))
    axios.get('http://localhost:8000/api/alerts').then(r=>setAlerts(r.data))
  },[])

  const issueData = stats?.distribution || []
  const priorityData = stats?.priority_distribution || []
  const statusData = stats?.status_distribution || []

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold">Authority Dashboard</h2>
      {stats && (
        <div className="mt-4 grid grid-cols-5 gap-4">
          <div className="p-4 bg-white shadow rounded">Total Reports<br/>{stats.total}</div>
          <div className="p-4 bg-white shadow rounded">Critical<br/>{stats.critical}</div>
          <div className="p-4 bg-white shadow rounded">High<br/>{stats.high}</div>
          <div className="p-4 bg-white shadow rounded">Average Priority<br/>{stats.average_priority_score}</div>
          <div className="p-4 bg-white shadow rounded">Recommended Depts<br/>{stats.recommended_departments?.length || 0}</div>
        </div>
      )}
      {stats && (
        <div className="mt-4 grid grid-cols-5 gap-4">
          <div className="p-4 bg-white shadow rounded">Avg Resolution Score<br/>{stats.average_resolution_score}</div>
          <div className="p-4 bg-white shadow rounded">Verified Resolved<br/>{stats.verified_resolved}</div>
          <div className="p-4 bg-white shadow rounded">Likely Resolved<br/>{stats.likely_resolved}</div>
          <div className="p-4 bg-white shadow rounded">Needs Review<br/>{stats.needs_review}</div>
          <div className="p-4 bg-white shadow rounded">Not Resolved<br/>{stats.not_resolved}</div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white p-4 shadow rounded">
          <h3 className="font-semibold">Map</h3>
          <div style={{height: '400px'}} className="mt-2">
            <MapContainer center={[23.0225,72.5714]} zoom={13} style={{height:'100%', width:'100%'}}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {mapIssues.map((m,i)=> (
                m.lat && m.lon && (
                  <React.Fragment key={m.id}>
                    <Marker position={[m.lat, m.lon]} icon={L.divIcon({className: 'custom-marker', html: `<span style="background:${colorForPriority(m.priority)};display:block;width:14px;height:14px;border-radius:50%;border:2px solid white"></span>`})}>
                      <Popup>
                        <div>
                          <div><strong>{m.issue_type}</strong></div>
                          <div>Priority: {m.priority}</div>
                          <div>Severity: {m.severity}</div>
                          <div>Status: {m.status}</div>
                          <div>Location: {m.lat.toFixed(5)}, {m.lon.toFixed(5)}</div>
                          <div>Reports here: {mapIssues.filter(x=> x.lat && x.lon && Math.abs(x.lat - m.lat) < 0.00001 && Math.abs(x.lon - m.lon) < 0.00001).length}</div>
                          <div><Link to={`/reports/${m.id}`}>Open Details</Link></div>
                        </div>
                      </Popup>
                    </Marker>
                    {/* hotspot via circle with radius scaled by priority_score */}
                    <Circle center={[m.lat, m.lon]} radius={Math.max(50, (m.priority_score||10)*10)} pathOptions={{color: colorForPriority(m.priority), fillOpacity: 0.12}} />
                  </React.Fragment>
                )
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="col-span-1 space-y-4">
          <div className="bg-white p-4 shadow rounded">
            <h4 className="font-semibold">Issue Distribution</h4>
            <div style={{height:150}}>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={issueData} dataKey="count" nameKey="issue_type" outerRadius={50} fill="#8884d8">
                    {issueData.map((entry:any, index:any) => (
                      <Cell key={`cell-${index}`} fill={['#8884d8','#82ca9d','#ffc658','#ff7f50','#a4de6c'][index%5]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-4 shadow rounded">
            <h4 className="font-semibold">Priority Distribution</h4>
            <div style={{height:150}}>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={priorityData}>
                  <XAxis dataKey="priority" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-4 shadow rounded">
            <h4 className="font-semibold">Status Distribution</h4>
            <div style={{height:150}}>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={statusData}>
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div className="bg-white p-4 shadow rounded">
            <h3 className="font-semibold">SLA Overview</h3>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex justify-between"><span>Critical</span><span>{stats.sla_critical}</span></div>
              <div className="flex justify-between"><span>Due Soon</span><span>{stats.sla_due_soon}</span></div>
              <div className="flex justify-between"><span>SLA Breached</span><span>{stats.sla_breached}</span></div>
              <div className="flex justify-between"><span>Resolved Within SLA</span><span>{stats.sla_completed}</span></div>
              <div className="flex justify-between"><span>Avg Resolution Time</span><span>{Math.round((stats.average_resolution_time_seconds||0)/3600)}h</span></div>
              <div className="flex justify-between"><span>SLA Compliance</span><span>{stats.sla_compliance_rate}%</span></div>
            </div>
          </div>

          <div className="bg-white p-4 shadow rounded">
            <h3 className="font-semibold">Recent Reports</h3>
            <div className="mt-2 space-y-2 text-sm">
              {reports.slice(0,10).map(r=> (
                <div key={r.id} className="p-2 border rounded">{r.external_id} — {r.issue_type} — {r.priority} — <Link to={`/reports/${r.id}`}>Details</Link></div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6">
        <AlertCenter alerts={alerts} onMarkRead={async (id:number)=>{
          await axios.post(`http://localhost:8000/api/alerts/${id}/read`)
          const r = await axios.get('http://localhost:8000/api/alerts')
          setAlerts(r.data)
        }} />
      </div>
    </div>
  )
}
