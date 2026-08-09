import React, {useState} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function Report(){
  const [file, setFile] = useState<File | null>(null)
  const [latitude, setLatitude] = useState('23.0225')
  const [longitude, setLongitude] = useState('72.5714')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [imgNatural, setImgNatural] = useState<{w:number,h:number}|null>(null)
  const [imgRendered, setImgRendered] = useState<{w:number,h:number,offsetX:number,offsetY:number}|null>(null)
  const navigate = useNavigate()

  const upload = async () => {
    if(!file) return
    setLoading(true)
    const form = new FormData()
    form.append('file', file)
    form.append('latitude', latitude)
    form.append('longitude', longitude)
    form.append('description', 'Uploaded from demo')
    try{
      const res = await axios.post('http://localhost:8000/api/reports/analyze', form, { headers: {'Content-Type': 'multipart/form-data'} })
      setResult(res.data)
    }catch(e){
      alert('Analysis failed')
    }finally{setLoading(false)}
  }

  const createReport = async () => {
    if(!result) return
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
      image_path: result.image_url
    }
    try{
      const res = await axios.post('http://localhost:8000/api/reports', payload)
      navigate('/dashboard')
    }catch(e){
      alert('Create failed')
    }
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold">Report an Infrastructure Problem</h2>
      <div className="mt-4">
        <input type="file" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
      </div>
      <div className="mt-2 flex gap-2">
        <input className="border p-2" value={latitude} onChange={e=>setLatitude(e.target.value)} />
        <input className="border p-2" value={longitude} onChange={e=>setLongitude(e.target.value)} />
      </div>
      <div className="mt-4">
        <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={upload} disabled={loading}>{loading? 'Analyzing...':'Analyze Report'}</button>
      </div>

      {result && (
        <div className="mt-6 p-4 border rounded">
          <h3 className="font-bold">AI Analysis</h3>
          <div className="mt-2 flex gap-4">
            <div className="w-1/3">
              {result.image_url ? (
                <div style={{position:'relative'}}>
                  <img id="analysis-img" src={`http://localhost:8000${result.image_url}`} alt="analysis" style={{width:'100%'}} onLoad={(e:any)=>{
                    const img = e.target as HTMLImageElement
                    setImgNatural({w: img.naturalWidth, h: img.naturalHeight})
                    const rect = img.getBoundingClientRect()
                    setImgRendered({w: rect.width, h: rect.height, offsetX: rect.left, offsetY: rect.top})
                  }} />
                  {((result.analysis.detections && result.analysis.detections.length > 0) || result.analysis.bbox) && imgNatural && imgRendered && (
                    (()=>{
                      const detections = result.analysis.detections?.length ? result.analysis.detections : (result.analysis.bbox ? [{class_name: result.analysis.issue_type, confidence: result.analysis.confidence, bbox: result.analysis.bbox}] : [])
                      return detections.map((det:any, index:number) => {
                        const [x1,y1,x2,y2] = det.bbox || [0,0,0,0]
                        const scaleX = imgRendered.w / imgNatural.w
                        const scaleY = imgRendered.h / imgNatural.h
                        const left = x1 * scaleX
                        const top = y1 * scaleY
                        const width = (x2 - x1) * scaleX
                        const height = (y2 - y1) * scaleY
                        return <div key={index} style={{position:'absolute', left, top, width, height, border: '3px solid rgba(255,0,0,0.8)', pointerEvents: 'none'}} />
                      })
                    })()
                  )}
                </div>
              ) : <div className="p-8 bg-gray-100">No image</div>}
            </div>
            <div className="flex-1">
              <p><strong>Issue:</strong> {result.analysis.issue_type} ({Math.round(result.analysis.confidence*100)}%)</p>
              <p><strong>Detections:</strong> {result.analysis.num_detections ?? 0}</p>
              {result.analysis.image_width && result.analysis.image_height && (
                <p><strong>Image size:</strong> {result.analysis.image_width} x {result.analysis.image_height}</p>
              )}
              <p><strong>Severity:</strong> {result.severity.severity_score}/10</p>
              <p><strong>Safety Risk:</strong> {result.analysis.safety_risk}</p>
              <p><strong>Priority:</strong> {result.priority.priority_label} ({result.priority.priority_score})</p>
              <p><strong>Reason:</strong></p>
              <ul className="list-disc ml-6">
                {result.severity.factors.map((f:any,i:any)=> <li key={i}>{f}</li>)}
                {result.priority.reason.map((f:any,i:any)=> <li key={`p${i}`}>{f}</li>)}
              </ul>
              {result.analysis.detections && result.analysis.detections.length > 0 && (
                <div className="mt-2">
                  <strong>Detections</strong>
                  <ul className="list-disc ml-6">
                    {result.analysis.detections.map((det:any, index:number) => (
                      <li key={index}>{det.class_name} ({Math.round(det.confidence*100)}%) {det.bbox ? `[${det.bbox.map((n:number)=>Math.round(n)).join(', ')}]` : ''}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.analysis.model_error && (
                <div className="mt-2 text-sm text-red-600">Model error: {result.analysis.model_error}</div>
              )}
              <p className="mt-2"><strong>Similar reports:</strong> {result.duplicate.count || 0}</p>
              <div className="mt-2">
                <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={createReport}>Create Report</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
