import { useState } from 'react'
import { Download, Eye, X } from 'lucide-react'
import jsPDF from 'jspdf'

const CATEGORY_NAMES = [
  'Ijro Intizomi', 'Yoshlar Balansi', 'Yoshlar Bandligi',
  "Bo'sh Vaqtni Tashkil", 'Ijtimoiy Profilaktika', 'Murojaatlar bilan Ishlash',
  'Brand Loyihalari', "Ta'lim Muassasalari", 'Zamonaviy Kasblar', 'Nomenklatura',
]

const MAX_SCORES = [20, 5, 15, 15, 10, 5, 10, 5, 5, 10]

const MAHALLALAR = [
  { id: 1,  name: 'Markaziy mahalla',    scores: [20, 5, 14, 13, 9,  5, 9,  5, 4, 9]  },
  { id: 2,  name: 'Yangi mahalla',       scores: [18, 4, 13, 12, 8,  4, 8,  4, 3, 8]  },
  { id: 3,  name: 'Bog\'iston mahalla',  scores: [19, 5, 15, 15, 10, 5, 10, 5, 5, 10] },
  { id: 4,  name: 'Guliston mahalla',    scores: [15, 3, 11, 10, 7,  3, 7,  3, 2, 7]  },
  { id: 5,  name: 'Navro\'z mahalla',    scores: [17, 4, 12, 12, 8,  4, 8,  4, 3, 8]  },
  { id: 6,  name: 'Mehr mahalla',        scores: [14, 2, 10, 9,  6,  2, 6,  2, 1, 6]  },
  { id: 7,  name: 'Baxt mahalla',        scores: [16, 4, 11, 11, 7,  4, 7,  4, 2, 7]  },
  { id: 8,  name: 'Fayz mahalla',        scores: [13, 2, 9,  8,  5,  2, 5,  2, 1, 5]  },
  { id: 9,  name: 'Shofirkon mahalla',   scores: [20, 5, 15, 15, 10, 5, 10, 5, 5, 10] },
  { id: 10, name: 'Oqtepa mahalla',      scores: [12, 1, 8,  7,  4,  1, 4,  1, 1, 4]  },
].map(d => ({ ...d, total: d.scores.reduce((a, b) => a + b, 0) }))
 .sort((a, b) => b.total - a.total)

function getRankStyle(index, total) {
  if (index < 3) return { row: 'bg-green-50 border-l-4 border-green-500', badge: 'bg-green-100 text-green-700' }
  if (index >= total - 3) return { row: 'bg-red-50 border-l-4 border-red-500', badge: 'bg-red-100 text-red-700' }
  return { row: 'bg-yellow-50 border-l-4 border-yellow-500', badge: 'bg-yellow-100 text-yellow-700' }
}

function getRankLabel(index) {
  if (index === 0) return "🥇 1-o'rin"
  if (index === 1) return "🥈 2-o'rin"
  if (index === 2) return "🥉 3-o'rin"
  return `${index + 1}-o'rin`
}

function generatePDF(district, allDistricts) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(`${district.name} — KPI Reytingi`, 20, 20)
  doc.setFontSize(12)
  doc.text(`Jami Ballar: ${district.total}`, 20, 35)
  const rank = allDistricts.findIndex(d => d.id === district.id) + 1
  doc.text(`O'rin: ${rank} / ${allDistricts.length}`, 20, 45)
  doc.setFontSize(10)
  let y = 60
  doc.text("Yo'nalish", 20, y)
  doc.text('Ball', 150, y)
  y += 10
  district.scores.forEach((score, i) => {
    doc.text(CATEGORY_NAMES[i], 20, y)
    doc.text(`${score} / ${MAX_SCORES[i]}`, 150, y)
    y += 8
    if (y > 260) { doc.addPage(); y = 20 }
  })
  doc.setFontSize(8)
  doc.text(`Yaratilgan: ${new Date().toLocaleString('uz-UZ')}`, 20, doc.internal.pageSize.height - 10)
  doc.save(`${district.name}-reyting.pdf`)
}

export function DistrictsRanking() {
  const [activeTab, setActiveTab] = useState('umumiy')
  const [selectedCat, setSelectedCat] = useState(0)
  const [preview, setPreview] = useState(null)

  const sortedByCat = [...MAHALLALAR].sort((a, b) => b.scores[selectedCat] - a.scores[selectedCat])

  const catStats = (() => {
    const total = MAHALLALAR.length
    const maxPossible = MAX_SCORES[selectedCat] * total
    const scored = MAHALLALAR.reduce((s, d) => s + d.scores[selectedCat], 0)
    const completed = MAHALLALAR.filter(d => d.scores[selectedCat] === MAX_SCORES[selectedCat]).length
    return {
      pct: Math.round((scored / maxPossible) * 100),
      avg: Math.round(scored / total * 10) / 10,
      scored, maxPossible, completed, total,
    }
  })()

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Mahallalar Reytingi</h2>
        <p className="text-slate-600 text-sm">10 yo'nalish bo'yicha jami ballar asosida tartiblangan</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-lg p-2 border border-slate-200">
        {[['umumiy', "Umumiy Reyting"], ['yonalish', "Yo'nalishlar Bo'yicha"]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-6 py-2 font-medium rounded transition-colors ${activeTab === key ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Umumiy reyting */}
      {activeTab === 'umumiy' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded"><p className="text-sm font-semibold text-green-900">Eng yaxshi 3 ta</p></div>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded"><p className="text-sm font-semibold text-yellow-900">O'rtacha</p></div>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded"><p className="text-sm font-semibold text-red-900">Eng past 3 ta</p></div>
          </div>

          <div className="space-y-3">
            {MAHALLALAR.map((d, i) => {
              const s = getRankStyle(i, MAHALLALAR.length)
              return (
                <div key={d.id} className={`rounded-lg p-4 border ${s.row} hover:shadow-md transition-all`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${s.badge}`}>{getRankLabel(i)}</span>
                        <h3 className="text-lg font-semibold text-slate-900 truncate">{d.name}</h3>
                      </div>
                      <p className="text-2xl font-bold text-slate-900 mb-3">Jami: {d.total} ball</p>
                      <div className="grid grid-cols-5 gap-2">
                        {d.scores.map((score, ci) => (
                          <div key={ci} className="bg-white/60 rounded p-2 text-center">
                            <p className="text-xs text-slate-600 truncate">{CATEGORY_NAMES[ci].substring(0, 12)}</p>
                            <p className="text-sm font-bold text-slate-900">{score}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setPreview(d)} className="p-2 hover:bg-blue-100 rounded text-blue-600"><Eye className="w-5 h-5" /></button>
                      <button onClick={() => generatePDF(d, MAHALLALAR)} className="p-2 hover:bg-blue-100 rounded text-blue-600"><Download className="w-5 h-5" /></button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Yo'nalish bo'yicha */}
      {activeTab === 'yonalish' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <p className="text-sm font-semibold text-slate-700 mb-3">Yo'nalish tanlang:</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {CATEGORY_NAMES.map((name, i) => (
                <button key={i} onClick={() => setSelectedCat(i)}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${selectedCat === i ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-sm text-slate-600 font-medium">Bajarilish %</p><p className="text-3xl font-bold text-blue-600">{catStats.pct}%</p></div>
              <div><p className="text-sm text-slate-600 font-medium">O'rtacha Ball</p><p className="text-3xl font-bold text-slate-900">{catStats.avg}</p></div>
              <div><p className="text-sm text-slate-600 font-medium">Jami</p><p className="text-3xl font-bold text-green-600">{catStats.scored}/{catStats.maxPossible}</p></div>
              <div><p className="text-sm text-slate-600 font-medium">To'liq bajarildi</p><p className="text-3xl font-bold text-emerald-600">{catStats.completed}/{catStats.total}</p></div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{CATEGORY_NAMES[selectedCat]} — Reyting</h3>
            <div className="space-y-3">
              {sortedByCat.map((d, i) => {
                const s = getRankStyle(i, sortedByCat.length)
                return (
                  <div key={d.id} className={`rounded-lg p-4 border ${s.row} hover:shadow-md transition-all`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${s.badge}`}>{getRankLabel(i)}</span>
                        <h4 className="text-lg font-semibold text-slate-900">{d.name}</h4>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{d.scores[selectedCat]} ball</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">{preview.name} — Tafsiliy Reyting</h3>
              <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-slate-600">Jami Ballar</p>
                <p className="text-2xl font-bold text-blue-600">{preview.total} / {MAX_SCORES.reduce((a, b) => a + b, 0)}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded">
                <p className="text-sm font-semibold text-slate-700 mb-2">10 Yo'nalish bo'yicha</p>
                <div className="space-y-2">
                  {preview.scores.map((score, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">{CATEGORY_NAMES[i]}</span>
                      <span className="font-semibold text-slate-900">{score} / {MAX_SCORES[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-sm text-slate-600">O'rin</p>
                <p className="text-lg font-bold text-green-600">
                  {MAHALLALAR.findIndex(d => d.id === preview.id) + 1} / {MAHALLALAR.length}
                </p>
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-slate-200">
              <button onClick={() => setPreview(null)} className="flex-1 px-4 py-2 bg-slate-100 border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-200">Yopish</button>
              <button onClick={() => generatePDF(preview, MAHALLALAR)} className="flex-1 px-4 py-2 bg-blue-600 rounded text-sm font-medium text-white hover:bg-blue-700">PDF Yuklash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
