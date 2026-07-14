import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import jsPDF from 'jspdf'
import { api } from '../services/api'

const DIRECTIONS = [
  { key: '1_ijro',          short: 'Ijro',        label: 'Ijro Intizomi',            max: 20 },
  { key: '2_balans',        short: 'Balans',       label: 'Yoshlar Balansi',          max: 5  },
  { key: '3_bandlik',       short: 'Bandlik',      label: 'Yoshlar Bandligi',         max: 15 },
  { key: '4_bosh_vaqt',    short: "Bo'sh Vaqt",   label: "Bo'sh Vaqtni Tashkil",    max: 15 },
  { key: '5_profilaktika',  short: 'Profilak.',    label: 'Ijtimoiy Profilaktika',    max: 10 },
  { key: '6_murojaat',      short: 'Murojaat',     label: 'Murojaatlar',              max: 5  },
  { key: '7_brend',         short: 'Brend',        label: 'Brand Loyihalari',         max: 10 },
  { key: '8_talim',         short: "Ta'lim",       label: "Ta'lim Muassasalari",      max: 5  },
  { key: '9_startap',       short: 'Startap',      label: 'Zamonaviy Kasblar',        max: 5  },
  { key: '10_nomenklatura', short: 'Nomen.',       label: 'Nomenklatura Hujjatlar',   max: 10 },
]

const MAX_TOTAL = DIRECTIONS.reduce((s, d) => s + d.max, 0)

function pct(score, max) {
  return max ? Math.round((score / max) * 100) : 0
}

function rowStyle(rank, total) {
  if (rank <= 3)         return { row: 'bg-emerald-50 hover:bg-emerald-100', badge: 'bg-emerald-100 text-emerald-700 border border-emerald-300', bar: 'bg-emerald-500' }
  if (rank > total - 3) return { row: 'bg-red-50 hover:bg-red-100',         badge: 'bg-red-100 text-red-700 border border-red-300',             bar: 'bg-red-400'     }
  return                        { row: 'bg-amber-50 hover:bg-amber-100',     badge: 'bg-amber-100 text-amber-700 border border-amber-300',       bar: 'bg-amber-400'   }
}

function ScoreCell({ score, max }) {
  const p = pct(score, max)
  const cls = p >= 80 ? 'text-emerald-700 font-semibold' : p >= 50 ? 'text-amber-700' : 'text-red-600'
  return <span className={cls}>{score > 0 ? score : <span className="text-slate-300">—</span>}</span>
}

function generatePDF(row, allRows) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(`${row.name} MFY — KPI Reytingi`, 14, 18)
  doc.setFontSize(11)
  const rank = allRows.findIndex(r => r.id === row.id) + 1
  doc.text(`Jami: ${row.total} / ${MAX_TOTAL} ball  |  O'rin: ${rank} / ${allRows.length}`, 14, 28)
  doc.setFontSize(9)
  let y = 42
  DIRECTIONS.forEach((d, i) => {
    doc.text(d.label, 14, y)
    doc.text(`${row.scores[i]} / ${d.max}`, 155, y)
    y += 8
  })
  doc.setFontSize(7)
  doc.text(`Yaratilgan: ${new Date().toLocaleString('uz-UZ')}`, 14, 285)
  doc.save(`${row.name}-reyting.pdf`)
}

// ─── Umumiy reyting: to'liq jadval ──────────────────────────────────────────
function UmumiyReyting({ rows }) {
  if (!rows.length) return <p className="text-slate-400 text-sm py-8 text-center">Ma'lumot yo'q</p>

  return (
    <div className="space-y-5">
      <div className="flex gap-4 text-xs font-medium text-slate-600 flex-wrap pb-1">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-400 inline-block" />Top 3 — eng yaxshi</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400 inline-block" />O'rtacha</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400 inline-block" />Eng past 3</span>
        <span className="flex items-center gap-1.5 ml-auto text-slate-400">Jami max: {MAX_TOTAL} ball</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm border-collapse min-w-max">
          <thead>
            <tr className="bg-slate-800 text-white text-xs">
              <th className="sticky left-0 z-20 bg-slate-800 px-3 py-3 text-center w-10">#</th>
              <th className="sticky left-10 z-20 bg-slate-800 px-4 py-3 text-left min-w-44">MFY nomi</th>
              {DIRECTIONS.map(d => (
                <th key={d.key} className="px-2 py-3 text-center font-medium">
                  <div className="font-semibold">{d.short}</div>
                  <div className="text-slate-400 text-[10px] font-normal mt-0.5">max {d.max}</div>
                </th>
              ))}
              <th className="px-3 py-3 text-center font-bold bg-slate-700 min-w-20">
                <div>Jami</div>
                <div className="text-slate-400 text-[10px] font-normal mt-0.5">/{MAX_TOTAL}</div>
              </th>
              <th className="px-2 py-3 text-center w-10">PDF</th>
            </tr>
            <tr className="bg-slate-100 text-slate-500 text-[10px] border-b border-slate-200">
              <td className="sticky left-0 bg-slate-100 z-20 px-3 py-1.5" />
              <td className="sticky left-10 bg-slate-100 z-20 px-4 py-1.5 font-semibold text-slate-600 text-xs">Maksimal ball →</td>
              {DIRECTIONS.map(d => (
                <td key={d.key} className="px-2 py-1.5 text-center font-bold text-slate-700">{d.max}</td>
              ))}
              <td className="px-3 py-1.5 text-center font-bold text-slate-800 bg-slate-200">{MAX_TOTAL}</td>
              <td />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const rank = idx + 1
              const c = rowStyle(rank, rows.length)
              return (
                <tr key={row.id} className={`border-t border-slate-100 transition-colors ${c.row}`}>
                  <td className={`sticky left-0 z-10 px-3 py-2.5 text-center ${c.row}`}>
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${c.badge}`}>
                      {rank}
                    </span>
                  </td>
                  <td className={`sticky left-10 z-10 px-4 py-2.5 font-semibold text-slate-800 whitespace-nowrap ${c.row}`}>
                    {row.name} MFY
                  </td>
                  {row.scores.map((score, i) => (
                    <td key={i} className="px-2 py-2.5 text-center text-sm">
                      <ScoreCell score={score} max={DIRECTIONS[i].max} />
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-center bg-white/40">
                    <span className="font-bold text-slate-900">{row.total}</span>
                    <div className="text-[10px] text-slate-400">{pct(row.total, MAX_TOTAL)}%</div>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <button
                      onClick={() => generatePDF(row, rows)}
                      className="p-1.5 rounded hover:bg-blue-100 text-blue-500 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Yo'nalish bo'yicha reyting ──────────────────────────────────────────────
function YonalishReyting({ rows }) {
  const [selIdx, setSelIdx] = useState(0)
  if (!rows.length) return <p className="text-slate-400 text-sm py-8 text-center">Ma'lumot yo'q</p>

  const dir = DIRECTIONS[selIdx]
  const sorted = [...rows].sort((a, b) => b.scores[selIdx] - a.scores[selIdx])
  const totalScore = rows.reduce((s, r) => s + r.scores[selIdx], 0)
  const fullCount = rows.filter(r => r.scores[selIdx] >= dir.max).length

  return (
    <div className="space-y-5">
      {/* Yo'nalish tugmalari */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Yo'nalish tanlang</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {DIRECTIONS.map((d, i) => (
            <button
              key={d.key}
              onClick={() => setSelIdx(i)}
              className={`px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                selIdx === i
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              <div>{d.short}</div>
              <div className={`text-[10px] mt-0.5 ${selIdx === i ? 'text-blue-200' : 'text-slate-400'}`}>max: {d.max}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-xs text-slate-500">Tanlangan yo'nalish</p>
          <p className="text-base font-bold text-slate-800 mt-1 leading-tight">{dir.label}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500">O'rtacha ball</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{(totalScore / rows.length).toFixed(1)}</p>
          <p className="text-xs text-slate-400">/ {dir.max}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500">Bajarilish</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{pct(totalScore, dir.max * rows.length)}%</p>
          <p className="text-xs text-slate-400">{totalScore} / {dir.max * rows.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500">To'liq bajardi</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{fullCount}</p>
          <p className="text-xs text-slate-400">/ {rows.length} ta MFY</p>
        </div>
      </div>

      {/* Reyting ro'yxati */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">{dir.label} — Reyting</h3>
          <span className="text-xs text-slate-500">{rows.length} ta MFY</span>
        </div>
        <div className="divide-y divide-slate-100">
          {sorted.map((row, idx) => {
            const rank = idx + 1
            const c = rowStyle(rank, sorted.length)
            const p = pct(row.scores[selIdx], dir.max)
            return (
              <div key={row.id} className={`flex items-center gap-4 px-5 py-3 ${c.row} transition-colors`}>
                <span className={`flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${c.badge}`}>
                  {rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{row.name} MFY</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${c.bar}`} style={{ width: `${p}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 flex-shrink-0 w-8 text-right">{p}%</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xl font-bold text-slate-900">{row.scores[selIdx]}</span>
                  <span className="text-sm text-slate-400"> / {dir.max}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Asosiy komponent ─────────────────────────────────────────────────────────
export function DistrictsRanking({ initialTab = 'umumiy', month, hideTabs = false }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.getDistrictsRanking(month)
      .then(setRows)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [month])

  return (
    <div className="space-y-5 p-5">
      {!hideTabs && (
        <div className="flex gap-2">
          {[['umumiy', 'Umumiy Reyting'], ['yonalish', "Yo'nalishlar Bo'yicha"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">{error}</div>
      ) : activeTab === 'umumiy' ? (
        <UmumiyReyting rows={rows} />
      ) : (
        <YonalishReyting rows={rows} />
      )}
    </div>
  )
}
