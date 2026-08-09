import React from 'react'
import { Link } from 'react-router-dom'

type AlertItem = {
  id: number
  report_id: number
  type: string
  title: string
  message: string
  priority: string
  timestamp: string
  is_read: boolean
}

export default function AlertCenter({ alerts, onMarkRead }: { alerts: AlertItem[]; onMarkRead: (id: number) => void }){
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-xl font-semibold">Alert Center</h3>
      <div className="mt-3 space-y-3">
        {alerts.length === 0 && <p className="text-sm text-gray-600">No alerts at this time.</p>}
        {alerts.map(alert => (
          <div key={alert.id} className={`p-3 border rounded ${alert.is_read ? 'bg-gray-50' : 'bg-red-50'}`}>
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="font-semibold">{alert.title}</p>
                <p className="text-xs text-gray-600">{new Date(alert.timestamp).toLocaleString()}</p>
              </div>
              <button className="text-sm text-blue-600" onClick={() => onMarkRead(alert.id)}>{alert.is_read ? 'Read' : 'Mark read'}</button>
            </div>
            <p className="text-sm mt-2">{alert.message}</p>
            <div className="mt-2 text-xs text-gray-700">Report: <Link className="text-blue-600" to={`/reports/${alert.report_id}`}>{alert.report_id}</Link> • Priority: {alert.priority}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
