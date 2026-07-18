import { useState, useEffect } from 'react'
import { Download, FileDown } from 'lucide-react'
import { api } from '../services/api'

// Short labels keyed by direction key — used when deriving from API directions
const SHORT_LABELS = {
  '1_ijro': 'Ijro', '2_balans': 'Balans', '3_bandlik': 'Bandlik',
  '4_bosh_vaqt': "Bo'sh Vaqt", '5_profilaktika': 'Profilak.',
  '6_murojaat': 'Murojaat', '7_brend': 'Brend', '8_talim': "Ta'lim",
  '9_startap': 'Startap', '10_nomenklatura': 'Nomen.',
}

// Fallback hardcoded list (used if directions prop not provided)
const FALLBACK_DIRECTIONS = [
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

// MAX_TOTAL computed per render from active DIRECTIONS (see component)

function pct(score, max) {
  return max ? Math.round((score / max) * 100) : 0
}

function rowStyle(rank, total) {
  if (rank <= 3)         return { row: 'bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30', badge: 'bg-emerald-100 text-emerald-700 border border-emerald-300', bar: 'bg-emerald-500' }
  if (rank > total - 3) return { row: 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30',                 badge: 'bg-red-100 text-red-700 border border-red-300',             bar: 'bg-red-400'     }
  return                        { row: 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30',         badge: 'bg-amber-100 text-amber-700 border border-amber-300',       bar: 'bg-amber-400'   }
}

function ScoreCell({ score, max }) {
  const p = pct(score, max)
  const cls = p >= 80 ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : p >= 50 ? 'text-amber-700 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
  return <span className={cls}>{score > 0 ? score : <span className="text-slate-300 dark:text-slate-600">—</span>}</span>
}

async function generatePDF(row, allRows, DIRECTIONS) {
  const { default: jsPDF } = await import('jspdf')
  const MAX_TOTAL = DIRECTIONS.reduce((s, d) => s + d.max, 0)
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

async function generateFullPDF(rows, DIRECTIONS) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const MAX_TOTAL = DIRECTIONS.reduce((s, d) => s + d.max, 0)
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' })
  const dateStr = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })

  doc.setFontSize(13)
  doc.text("Asaka tumani yoshlar yetakchilari — Umumiy KPI Reytingi", 14, 12)
  doc.setFontSize(8)
  doc.setTextColor(100)
  doc.text(dateStr, 14, 19)
  doc.setTextColor(0)

  const head = [['#', "MFY nomi", ...DIRECTIONS.map(d => `${d.short}\n/${d.max}`), `Jami\n/${MAX_TOTAL}`]]
  const body = rows.map((row, idx) => [
    idx + 1,
    row.name + (row.full_name ? `\n${row.full_name}` : ''),
    ...row.scores,
    row.total,
  ])

  autoTable(doc, {
    head,
    body,
    startY: 23,
    margin: { left: 7, right: 7 },
    styles: { fontSize: 7, cellPadding: 1.8, halign: 'center', valign: 'middle', lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0:  { cellWidth: 8 },
      1:  { cellWidth: 40, halign: 'left' },
      12: { cellWidth: 18, fontStyle: 'bold' },
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return
      const rank = data.row.index + 1
      const total = rows.length

      if (rank <= 3)           data.cell.styles.fillColor = [209, 250, 229]
      else if (rank > total - 3) data.cell.styles.fillColor = [254, 226, 226]
      else                     data.cell.styles.fillColor = [254, 243, 199]

      const col = data.column.index
      if (col >= 2 && col <= 11) {
        const score = Number(data.cell.raw)
        const max = DIRECTIONS[col - 2].max
        if (max > 0 && score > 0) {
          const p = (score / max) * 100
          if (p >= 80)      data.cell.styles.textColor = [5, 150, 105]
          else if (p >= 50) data.cell.styles.textColor = [180, 83, 9]
          else              data.cell.styles.textColor = [220, 38, 38]
        }
      }

      if (col === 12) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fontSize = 8.5
        const p = pct(Number(data.cell.raw), MAX_TOTAL)
        if (p >= 80)      data.cell.styles.textColor = [5, 150, 105]
        else if (p >= 50) data.cell.styles.textColor = [180, 83, 9]
        else              data.cell.styles.textColor = [220, 38, 38]
      }
    },
  })

  // Legend
  const finalY = (doc.lastAutoTable?.finalY ?? 180) + 8
  doc.setFontSize(7)
  doc.setFillColor(209, 250, 229); doc.rect(7, finalY, 4, 4, 'F')
  doc.setTextColor(0); doc.text("Top 3", 13, finalY + 3)
  doc.setFillColor(254, 243, 199); doc.rect(30, finalY, 4, 4, 'F')
  doc.text("O'rtacha", 36, finalY + 3)
  doc.setFillColor(254, 226, 226); doc.rect(60, finalY, 4, 4, 'F')
  doc.text("Eng past 3", 66, finalY + 3)

  doc.save(`umumiy-reyting-${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ─── Umumiy reyting: to'liq jadval ──────────────────────────────────────────
function UmumiyReyting({ rows, DIRECTIONS }) {
  const MAX_TOTAL = DIRECTIONS.reduce((s, d) => s + d.max, 0)
  if (!rows.length) return <p className="text-slate-400 text-sm py-8 text-center">Ma'lumot yo'q</p>

  return (
    <div className="space-y-5">
      <div className="flex gap-4 text-xs font-medium text-slate-600 dark:text-slate-300 flex-wrap pb-1 items-center">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-400 inline-block" />Top 3 — eng yaxshi</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400 inline-block" />O'rtacha</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400 inline-block" />Eng past 3</span>
        <span className="flex items-center gap-1.5 text-slate-400">Jami max: {MAX_TOTAL} ball</span>
        <button
          onClick={() => generateFullPDF(rows, DIRECTIONS)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
        >
          <FileDown className="w-3.5 h-3.5" />
          Jadval PDF
        </button>
      </div>

      <div className="overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm max-h-[calc(100vh-12rem)]">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-30">
            <tr className="bg-slate-800 text-white text-xs">
              <th className="sticky left-0 z-40 bg-slate-800 px-3 py-3 text-center w-10">#</th>
              <th className="sticky left-10 z-40 bg-slate-800 px-4 py-3 text-left w-40">MFY nomi</th>
              {DIRECTIONS.map(d => (
                <th key={d.key} className="px-2 py-3 text-center font-medium">
                  <div className="font-semibold text-xs leading-snug">{d.label}</div>
                  <div className="text-slate-400 text-[10px] font-normal mt-0.5">max {d.max}</div>
                </th>
              ))}
              <th className="px-3 py-3 text-center font-bold bg-slate-700 min-w-20">
                <div>Jami</div>
                <div className="text-slate-400 text-[10px] font-normal mt-0.5">/{MAX_TOTAL}</div>
              </th>
              <th className="px-2 py-3 text-center w-10">PDF</th>
            </tr>
            <tr className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[10px] border-b border-slate-200 dark:border-slate-600">
              <td className="sticky left-0 bg-slate-100 dark:bg-slate-700 z-40 px-3 py-1.5" />
              <td className="sticky left-10 bg-slate-100 dark:bg-slate-700 z-40 px-4 py-1.5 font-semibold text-slate-600 dark:text-slate-300 text-xs">Maksimal ball →</td>
              {DIRECTIONS.map(d => (
                <td key={d.key} className="px-2 py-1.5 text-center font-bold text-slate-700 dark:text-slate-200">{d.max}</td>
              ))}
              <td className="px-3 py-1.5 text-center font-bold text-slate-800 dark:text-slate-100 bg-slate-200 dark:bg-slate-600">{MAX_TOTAL}</td>
              <td />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const rank = idx + 1
              const c = rowStyle(rank, rows.length)
              return (
                <tr key={row.id} className={`border-t border-slate-100 dark:border-slate-700 transition-colors ${c.row}`}>
                  <td className={`sticky left-0 z-10 px-3 py-2.5 text-center ${c.row}`}>
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${c.badge}`}>
                      {rank}
                    </span>
                  </td>
                  <td className={`sticky left-10 z-10 px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-100 ${c.row}`}>
                    {row.name} MFY
                    {row.full_name && (
                      <span className="block text-xs text-slate-400 font-normal">{row.full_name}</span>
                    )}
                  </td>
                  {row.scores.map((score, i) => (
                    <td key={i} className="px-2 py-2.5 text-center text-sm">
                      <ScoreCell score={score} max={DIRECTIONS[i].max} />
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-center bg-white/40 dark:bg-slate-800/40">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{row.total}</span>
                    <div className="text-[10px] text-slate-400">{pct(row.total, MAX_TOTAL)}%</div>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <button
                      onClick={() => generatePDF(row, rows, DIRECTIONS)}
                      className="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 transition-colors"
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
function YonalishReyting({ rows, DIRECTIONS }) {
  const [selIdx, setSelIdx] = useState(0)
  if (!rows.length) return <p className="text-slate-400 text-sm py-8 text-center">Ma'lumot yo'q</p>

  const dir = DIRECTIONS[selIdx]
  const sorted = [...rows].sort((a, b) => b.scores[selIdx] - a.scores[selIdx])
  const totalScore = rows.reduce((s, r) => s + r.scores[selIdx], 0)
  const fullCount = rows.filter(r => r.scores[selIdx] >= dir.max).length

  return (
    <div className="space-y-4">
      {/* Yo'nalish tugmalari */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Yo'nalish tanlang</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {DIRECTIONS.map((d, i) => (
            <button
              key={d.key}
              onClick={() => setSelIdx(i)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left leading-snug ${
                selIdx === i
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              <div className="line-clamp-2">{d.label}</div>
              <div className={`text-[10px] mt-0.5 ${selIdx === i ? 'text-blue-200' : 'text-slate-400'}`}>max: {d.max}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">Tanlangan yo'nalish</p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 leading-tight">{dir.label}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400">O'rtacha ball</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{(totalScore / rows.length).toFixed(1)}</p>
          <p className="text-xs text-slate-400">/ {dir.max}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400">Bajarilish</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{pct(totalScore, dir.max * rows.length)}%</p>
          <p className="text-xs text-slate-400">{totalScore} / {dir.max * rows.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400">To'liq bajardi</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{fullCount}</p>
          <p className="text-xs text-slate-400">/ {rows.length} ta MFY</p>
        </div>
      </div>

      {/* Reyting ro'yxati — header sticky, list scrollable */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Sticky direction title */}
        <div className="sticky top-0 z-20 px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{dir.label} — Reyting</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">{rows.length} ta MFY</span>
        </div>
        <div className="overflow-y-auto max-h-[calc(100vh-32rem)] divide-y divide-slate-100 dark:divide-slate-700">
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
                  <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {row.name} MFY
                    {row.full_name && <span className="text-slate-400 font-normal text-xs ml-1.5">· {row.full_name}</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${c.bar}`} style={{ width: `${p}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 w-8 text-right">{p}%</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{row.scores[selIdx]}</span>
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
export function DistrictsRanking({ initialTab = 'umumiy', month, monthFrom, monthTo, hideTabs = false, directions: directionsProp = null }) {
  // Build DIRECTIONS from API prop when available, so max_score stays in sync with DB
  const DIRECTIONS = directionsProp && directionsProp.length
    ? directionsProp
        .filter(d => d.is_active !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(d => ({ key: d.key, short: SHORT_LABELS[d.key] || d.key, label: d.label, max: d.max_score }))
    : FALLBACK_DIRECTIONS
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState(initialTab)

  // Support both old `month` prop and new range props
  const resolvedFrom = monthFrom || month || null
  const resolvedTo = monthTo || month || null

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.getDistrictsRanking(resolvedFrom, resolvedTo)
      .then(setRows)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [resolvedFrom, resolvedTo])

  return (
    <div className="space-y-5 p-5 dark:text-slate-100">
      {!hideTabs && (
        <div className="flex gap-2">
          {[['umumiy', 'Umumiy Reyting'], ['yonalish', "Yo'nalishlar Bo'yicha"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
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
        <UmumiyReyting rows={rows} DIRECTIONS={DIRECTIONS} />
      ) : (
        <YonalishReyting rows={rows} DIRECTIONS={DIRECTIONS} />
      )}
    </div>
  )
}
