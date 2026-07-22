import { useState, useEffect, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import ASAKA_COORDS from '../asaka_geometry.json'

const ASAKA_CENTER = [40.6700, 72.2207]
const REFRESH_MS = 15000

const MASK_GEOJSON = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [[-180,-90],[180,-90],[180,90],[-180,90],[-180,-90]],
      ASAKA_COORDS.coordinates[0],
    ],
  },
}

function getStatus(v) {
  if (!v.latitude || !v.longitude) return 'offline'
  if (v.time && (Date.now() / 1000 - v.time) > 900) return 'offline'
  if (v.speed > 2) return 'moving'
  return 'stopped'
}

const STATUS = {
  moving:  { color: '#22c55e', label: 'Harakatda' },
  stopped: { color: '#ef4444', label: "To'xtagan" },
  offline: { color: '#94a3b8', label: 'Oflayn' },
}

function makeIcon(status, isSelected) {
  const { color } = STATUS[status]
  const pulse = status === 'moving'
    ? `@keyframes gp{0%,100%{box-shadow:0 0 0 0 ${color}70}50%{box-shadow:0 0 0 10px ${color}00}}`
    : ''
  const border = isSelected ? `outline:3px solid #2563eb;outline-offset:2px;` : ''
  const html = `<style>${pulse}</style><div style="width:36px;height:36px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:17px;cursor:pointer;${pulse ? 'animation:gp 1.5s infinite;' : ''}${border}">🚛</div>`
  return L.divIcon({ html, className: '', iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -22] })
}

function FlyTo({ vehicle }) {
  const map = useMap()
  const prev = useRef(null)
  useEffect(() => {
    if (!vehicle?.latitude) return
    const key = `${vehicle.latitude},${vehicle.longitude}`
    if (key === prev.current) return
    prev.current = key
    map.flyTo([vehicle.latitude, vehicle.longitude], 16, { duration: 1.2 })
  }, [vehicle, map])
  return null
}

function MapView({ vehicles, selected, onSelect }) {
  return (
    <MapContainer center={ASAKA_CENTER} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" maxZoom={19} />

      <GeoJSON data={MASK_GEOJSON} pathOptions={{ fillColor: '#ffffff', fillOpacity: 0.75, color: '#3b82f6', weight: 2.5, fillRule: 'evenodd' }} />

      {vehicles.map(v => {
        if (!v.latitude || !v.longitude) return null
        const s = getStatus(v)
        const isSel = selected?.id === v.id
        return (
          <Marker key={v.id} position={[v.latitude, v.longitude]}
            icon={makeIcon(s, isSel)} zIndexOffset={isSel ? 1000 : 0}
            eventHandlers={{ click: () => onSelect(isSel ? null : v) }}>
            <Popup minWidth={190}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{v.name}</p>
              <p style={{ color: STATUS[s].color, fontWeight: 600 }}>● {STATUS[s].label}</p>
              <p>🚀 {v.speed ? `${Math.round(v.speed)} km/soat` : '0 km/soat'}</p>
              {v.time && <p>🕐 {new Date(v.time * 1000).toLocaleTimeString('uz-UZ')}</p>}
            </Popup>
          </Marker>
        )
      })}

      <FlyTo vehicle={selected} />
    </MapContainer>
  )
}

export function GpsPage() {
  const [vehicles, setVehicles]     = useState([])
  const [selected, setSelected]     = useState(null)
  const [filter, setFilter]         = useState('all')
  const [search, setSearch]         = useState('')
  const [error, setError]           = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [mapH, setMapH]             = useState(window.innerHeight - 65)

  useEffect(() => {
    function measure() {
      const hdr = document.getElementById('admin-header')
      setMapH(window.innerHeight - (hdr ? hdr.offsetHeight : 65))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/gps/vehicles/', { credentials: 'include' })
      if (!res.ok) throw new Error(res.status)
      const data = await res.json()
      setVehicles(data)
      setLastUpdate(new Date())
      setError(null)
    } catch (e) {
      setError('Wialon ulanmagan: ' + e.message)
    }
  }, [])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, REFRESH_MS)
    return () => clearInterval(t)
  }, [refresh])

  const counts = { moving: 0, stopped: 0, offline: 0 }
  vehicles.forEach(v => counts[getStatus(v)]++)

  const filtered = vehicles.filter(v => {
    if (filter !== 'all' && getStatus(v) !== filter) return false
    if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ef4444', fontWeight: 600 }}>
        ⚠️ {error}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: `${mapH}px`, overflow: 'hidden', maxWidth: '1800px', width: '100%', margin: '0 auto' }}>
      {/* Sidebar */}
      <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#0f172a', color: 'white', overflow: 'hidden', borderRight: '1px solid #1e293b' }}>
        {/* Status counts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, padding: 8, borderBottom: '1px solid #1e293b' }}>
          {Object.entries(counts).map(([s, n]) => (
            <button key={s} onClick={() => setFilter(filter === s ? 'all' : s)}
              style={{ background: filter === s ? '#334155' : '#1e293b', border: filter === s ? '2px solid white' : '2px solid transparent', borderRadius: 8, padding: '6px 2px', cursor: 'pointer', color: 'white' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS[s].color, margin: '0 auto 2px' }} />
              <div style={{ fontWeight: 700, fontSize: 14 }}>{n}</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>{STATUS[s].label.split(' ')[0]}</div>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding: '6px 8px', borderBottom: '1px solid #1e293b' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..."
            style={{ width: '100%', background: '#1e293b', border: 'none', borderRadius: 8, padding: '6px 10px', color: 'white', fontSize: 12, boxSizing: 'border-box', outline: 'none' }} />
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(v => {
            const s = getStatus(v)
            const isSel = selected?.id === v.id
            const speed = v.speed ? `${Math.round(v.speed)} km/h` : ''
            const time = v.time ? new Date(v.time * 1000).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '—'
            return (
              <button key={v.id} onClick={() => setSelected(isSel ? null : v)}
                style={{ width: '100%', textAlign: 'left', padding: '10px 10px', borderBottom: '1px solid #1e293b', background: isSel ? '#1e293b' : 'transparent', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', borderLeft: isSel ? '3px solid #3b82f6' : '3px solid transparent' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS[s].color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {speed && <div style={{ fontSize: 10, color: '#4ade80', fontFamily: 'monospace' }}>{speed}</div>}
                  <div style={{ fontSize: 10, color: '#64748b' }}>{time}</div>
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && <p style={{ color: '#64748b', fontSize: 12, textAlign: 'center', padding: 24 }}>Topilmadi</p>}
        </div>

        <div style={{ padding: 8, borderTop: '1px solid #1e293b', textAlign: 'center', fontSize: 11, color: '#64748b' }}>
          {vehicles.length} ta mashina
          {lastUpdate && <span> · {lastUpdate.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>}
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapView vehicles={vehicles} selected={selected} onSelect={setSelected} />
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, background: 'white', borderRadius: 20, padding: '6px 12px', boxShadow: '0 2px 8px rgba(0,0,0,.15)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          Jonli · har {REFRESH_MS / 1000}s
        </div>
      </div>
    </div>
  )
}
