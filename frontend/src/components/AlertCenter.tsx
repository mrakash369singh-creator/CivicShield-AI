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

const priorityTone = (priority: string) => {
  const value = priority?.toUpperCase() || ''
  if (value.includes('CRIT')) return 'bg-red-500/10 text-red-200 border-red-500/30'
  if (value.includes('HIGH')) return 'bg-amber-500/10 text-amber-200 border-amber-500/30'
  if (value.includes('MED')) return 'bg-yellow-500/10 text-yellow-200 border-yellow-500/30'
  return 'bg-emerald-500/10 text-emerald-200 border-emerald-500/30'
}

const iconForPriority = (priority: string) => {
  const value = priority?.toUpperCase() || ''
  if (value.includes('CRIT')) return '⛔'
  if (value.includes('HIGH')) return '⚠️'
  if (value.includes('MED')) return '📍'
  return '✓'
}

export default function AlertCenter({ alerts, onMarkRead }: { alerts: AlertItem[]; onMarkRead: (id: number) => void }) {
  return (
    <div className="glass-panel overflow-hidden rounded-[30px] border border-slate-700/80 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-xl text-red-300 ring-1 ring-red-400/20">🚨</div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">Live alert center</p>
            <h3 className="mt-1 text-xl font-semibold text-white">City operations monitoring</h3>
          </div>
        </div>
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
          System online
        </span>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">
            ✓ City operating normally — no active critical alerts.
          </div>
        )}

        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`hover-lift rounded-[22px] border p-4 ${alert.is_read ? 'border-slate-700 bg-slate-900/45' : 'border-red-500/20 bg-red-500/5'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`mt-1 flex h-10 w-10 items-center justify-center rounded-xl border text-base ${priorityTone(alert.priority)}`}>
                  {iconForPriority(alert.priority)}
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">{alert.priority}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{alert.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
              </div>

              <button
                className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200 transition hover:border-sky-400/40 hover:bg-sky-500/20"
                onClick={() => onMarkRead(alert.id)}
              >
                {alert.is_read ? 'Read' : 'Mark read'}
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-300">{alert.message}</p>

            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-400">
              <span>
                Report: <Link className="text-sky-300 hover:text-sky-200" to={`/reports/${alert.report_id}`}>{alert.report_id}</Link>
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-950/80 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                {alert.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
