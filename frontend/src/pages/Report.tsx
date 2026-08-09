import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'

export default function Report() {
  const [file, setFile] = useState<File | null>(null)
  const [latitude, setLatitude] = useState('23.0225')
  const [longitude, setLongitude] = useState('72.5714')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(null)
  const [imgRendered, setImgRendered] = useState<{ w: number; h: number; offsetX: number; offsetY: number } | null>(null)
  const navigate = useNavigate()

  const upload = async () => {
    if (!file) return
    setLoading(true)
    const form = new FormData()
    form.append('file', file)
    form.append('latitude', latitude)
    form.append('longitude', longitude)
    form.append('description', 'Uploaded from demo')
    try {
      const res = await axios.post(`${API_BASE_URL}/api/reports/analyze`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setResult(res.data)
    } catch (e) {
      alert('Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const createReport = async () => {
    if (!result) return
    const payload = {
      issue_type: result.analysis.issue_type,
      confidence: result.analysis.confidence,
      severity: result.severity.severity_score,
      safety_risk: result.analysis.safety_risk,
      priority: result.priority.priority_label,
      priority_score: result.priority.priority_score,
      description: 'Created from demo UI',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      image_path: result.image_url,
    }
    try {
      await axios.post(`${API_BASE_URL}/api/reports`, payload)
      navigate('/dashboard')
    } catch (e) {
      alert('Create failed')
    }
  }

  return (
    <div className="min-h-screen bg-[#020b16] text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:px-8">
        <div className="glass-panel overflow-hidden rounded-[30px] border border-slate-700/80 p-6 md:p-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300">CivicShield AI</p>
              <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Report Infrastructure Issue</h1>
              <p className="mt-2 text-sm text-slate-300">Capture a civic issue and trigger AI-powered assessment in seconds.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
              <span className="status-pulse inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              AI Engine Active
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] border border-slate-700 bg-slate-900/60 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Image Input</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Incident Evidence</h2>
                </div>
              </div>

              <label className="group flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-600 bg-slate-950/60 px-6 py-10 text-center transition hover:border-cyan-400/50 hover:bg-slate-900">
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-3xl text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                  📷
                </div>
                <div className="text-lg font-semibold text-white">Drag & drop image or browse</div>
                <div className="mt-2 text-sm text-slate-400">Upload a street, utility, or civic infrastructure issue photo.</div>
                <div className="mt-5 rounded-full border border-slate-600 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                  Select File
                </div>
              </label>

              {file && (
                <div className="mt-4 rounded-[20px] border border-slate-700 bg-slate-950/60 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Selected File</div>
                  <div className="mt-2 text-sm text-slate-200">{file.name}</div>
                </div>
              )}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Latitude</label>
                  <input className="w-full rounded-2xl border border-slate-600 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Longitude</label>
                  <input className="w-full rounded-2xl border border-slate-600 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
                </div>
              </div>

              <div className="mt-6">
                <button
                  className="w-full rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={upload}
                  disabled={loading || !file}
                >
                  {loading ? 'Analyzing...' : 'Analyze Report'}
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-700 bg-slate-900/60 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">AI Summary</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Priority Intelligence</h2>
                </div>
              </div>

              {!result ? (
                <div className="flex min-h-[360px] items-center justify-center rounded-[22px] border border-dashed border-slate-700 bg-slate-950/40 px-5 text-center text-sm text-slate-400">
                  Upload an image to generate an AI-powered civic risk assessment.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-[22px] border border-slate-700 bg-slate-950/60 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Issue Detected</div>
                    <div className="mt-3 text-2xl font-semibold text-white">{result.analysis.issue_type}</div>
                    <div className="mt-2 text-sm text-slate-300">Confidence {Math.round(result.analysis.confidence * 100)}%</div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[20px] border border-slate-700 bg-slate-950/60 p-3">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Severity</div>
                      <div className="mt-2 text-lg font-semibold text-white">{result.severity.severity_score}/10</div>
                    </div>
                    <div className="rounded-[20px] border border-slate-700 bg-slate-950/60 p-3">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Safety Risk</div>
                      <div className="mt-2 text-lg font-semibold text-white">{result.analysis.safety_risk}</div>
                    </div>
                    <div className="rounded-[20px] border border-slate-700 bg-slate-950/60 p-3">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Priority</div>
                      <div className="mt-2 text-lg font-semibold text-white">{result.priority.priority_label}</div>
                    </div>
                    <div className="rounded-[20px] border border-slate-700 bg-slate-950/60 p-3">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Score</div>
                      <div className="mt-2 text-lg font-semibold text-white">{result.priority.priority_score}</div>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-slate-700 bg-slate-950/60 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Recommended Department</div>
                    <div className="mt-2 text-lg font-semibold text-white">Road Maintenance</div>
                  </div>

                  <button
                    className="w-full rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100 transition hover:bg-cyan-500/15"
                    onClick={createReport}
                  >
                    Create Report
                  </button>
                </div>
              )}
            </div>
          </div>

          {result && (
            <div className="mt-6 rounded-[28px] border border-slate-700 bg-slate-900/60 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">AI Analysis Details</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Detected Objects & Reasoning</h2>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="relative overflow-hidden rounded-[24px] border border-slate-700 bg-slate-950/60">
                  {result.image_url ? (
                    <div className="relative">
                      <img
                        id="analysis-img"
                        src={`${API_BASE_URL}${result.image_url}`}
                        alt="analysis"
                        className="h-[360px] w-full object-cover"
                        onLoad={(e: any) => {
                          const img = e.target as HTMLImageElement
                          setImgNatural({ w: img.naturalWidth, h: img.naturalHeight })
                          const rect = img.getBoundingClientRect()
                          setImgRendered({ w: rect.width, h: rect.height, offsetX: rect.left, offsetY: rect.top })
                        }}
                      />
                      {((result.analysis.detections && result.analysis.detections.length > 0) || result.analysis.bbox) && imgNatural && imgRendered && (
                        (() => {
                          const detections = result.analysis.detections?.length
                            ? result.analysis.detections
                            : result.analysis.bbox
                              ? [{ class_name: result.analysis.issue_type, confidence: result.analysis.confidence, bbox: result.analysis.bbox }]
                              : []

                          return detections.map((det: any, index: number) => {
                            const [x1, y1, x2, y2] = det.bbox || [0, 0, 0, 0]
                            const scaleX = imgRendered.w / imgNatural.w
                            const scaleY = imgRendered.h / imgNatural.h
                            const left = x1 * scaleX
                            const top = y1 * scaleY
                            const width = (x2 - x1) * scaleX
                            const height = (y2 - y1) * scaleY
                            return <div key={index} className="pointer-events-none absolute rounded-sm border-[2px] border-rose-400/90 bg-rose-400/10" style={{ left, top, width, height }} />
                          })
                        })()
                      )}
                    </div>
                  ) : (
                    <div className="flex h-[360px] items-center justify-center text-slate-400">No image available</div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="rounded-[20px] border border-slate-700 bg-slate-950/60 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Reasoning</div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-300">
                      {result.severity.factors.map((f: any, i: number) => <li key={i}>• {f}</li>)}
                      {result.priority.reason.map((f: any, i: number) => <li key={`p${i}`}>• {f}</li>)}
                    </ul>
                  </div>

                  {result.analysis.detections && result.analysis.detections.length > 0 && (
                    <div className="rounded-[20px] border border-slate-700 bg-slate-950/60 p-4">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Detected Objects</div>
                      <div className="mt-3 space-y-2 text-sm text-slate-300">
                        {result.analysis.detections.map((det: any, index: number) => (
                          <div key={index} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2">
                            <span>{det.class_name}</span>
                            <span>{Math.round(det.confidence * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-[20px] border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-300">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Duplicate Check</div>
                    <div className="mt-2">Similar reports: {result.duplicate.count || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
