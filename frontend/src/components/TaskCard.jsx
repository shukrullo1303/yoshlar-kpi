import { useState, useRef } from 'react'
import { CheckCircle2, Clock, XCircle, Upload, X, FileText, Eye } from 'lucide-react'

const STATUS_CONFIG = {
  yashil:  { icon: CheckCircle2, label: 'Tasdiqlandi', color: 'text-green-600', bg: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-800', bar: 'bg-green-500' },
  sariq:   { icon: Clock,        label: 'Kutilmoqda',  color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-800', bar: 'bg-amber-500' },
  qizil:   { icon: XCircle,      label: 'Rad etildi',  color: 'text-red-600',   bg: 'bg-red-50 border-red-200',     badge: 'bg-red-100 text-red-800',     bar: 'bg-red-500' },
}

export function TaskCard({ task }) {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [previewFile, setPreviewFile] = useState(null)
  const fileInputRef = useRef(null)

  const cfg = STATUS_CONFIG[task.indicator] || STATUS_CONFIG.sariq
  const Icon = cfg.icon

  const handleFileUpload = (e) => {
    const files = e.target.files
    if (!files) return
    const newFiles = Array.from(files).map((f, i) => ({
      id: `${task.direction}-${Date.now()}-${i}`,
      name: f.name,
      uploadedAt: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }))
    setUploadedFiles(prev => [...newFiles, ...prev])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className={`rounded-lg border ${cfg.bg} p-6 hover:shadow-lg transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-slate-900">{task.label}</h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-sm text-slate-600">{task.direction}</p>
        </div>
        <div className="ml-4 text-right">
          <p className="text-2xl font-bold text-slate-900">{task.max_score}</p>
          <p className="text-xs text-slate-500">ball</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-slate-700">Bajarilish: {task.percentage}%</p>
          <p className="text-xs text-slate-600">✅ {task.yashil_count} / ⏳ {task.sariq_count} / ❌ {task.qizil_count}</p>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div className={`h-full ${cfg.bar} transition-all`} style={{ width: `${task.percentage}%` }} />
        </div>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-lg p-3 border border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <Upload className="w-4 h-4 text-blue-600" />
          <p className="text-xs font-semibold text-slate-700">Fayl yuklash</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            Fayl yuklash
          </button>
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.xlsx,.jpg,.png" onChange={handleFileUpload} className="hidden" />
          <button className="flex-1 px-3 py-2 bg-slate-100 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors">
            + Qo'shimcha
          </button>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-2">Yuklangan ({uploadedFiles.length})</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {uploadedFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded border border-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">{file.uploadedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setPreviewFile(file)} className="p-1.5 hover:bg-blue-100 rounded text-blue-600">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setUploadedFiles(prev => prev.filter(f => f.id !== file.id))} className="p-1.5 hover:bg-red-100 rounded text-red-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
        <Icon className={`w-5 h-5 ${cfg.color}`} />
        <p className="text-xs font-medium text-slate-600">{cfg.label}</p>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <p className="font-semibold text-slate-900 truncate">{previewFile.name}</p>
              </div>
              <button onClick={() => setPreviewFile(null)} className="p-1 hover:bg-slate-100 rounded text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-4 bg-slate-50 flex items-center justify-center">
              <div className="text-center text-slate-600">
                <p className="text-sm font-medium mb-2">{previewFile.name}</p>
                <p className="text-xs text-slate-500">Yuklandi: {previewFile.uploadedAt}</p>
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-slate-200">
              <button onClick={() => setPreviewFile(null)} className="flex-1 px-4 py-2 bg-slate-100 border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-200">
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
