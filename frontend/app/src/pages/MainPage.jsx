import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Menu, Briefcase, Hourglass, MapPin, Sun, Moon, Navigation, Search } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { tileLayerOffline, downloadTile, saveTile, getStorageLength } from 'leaflet.offline'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { routes as routesApi, userRoutes, pointPhotos } from '../api/index.js'
import FilterItem from '../components/FilterItem.jsx'
import WeatherWidget from '../components/WeatherWidget.jsx'
import './MainPage.css'

const MOOD_API_MAP = {
  'Спокійний':    'calm',
  'Активний':     'adventurous',
  'Пізнавальний': 'curious',
}

const BUDGET_MAP = {
  'Низький':  { budget_max__lte: 50 },
  'Середній': { budget_max__lte: 200 },
  'Високий':  { budget_max__gte: 200 },
}

const TIME_MAP = {
  '1 година':  { duration__lte: 60 },
  'Пів дня':   { duration__lte: 240 },
  'Весь день': { duration__lte: 480 },
}

const DESTINATION_MAP = {
  'Парки': { category: 'parks' },
  'Музеї': { category: 'museums' },
  'Кафе':  { category: 'cafes' },
}

const DEFAULT_CENTER = [49.8397, 24.0297] // Lviv
const DEFAULT_ZOOM = 13

const LVIV_BOUNDS = L.latLngBounds([[49.77, 23.92], [49.90, 24.15]])
const OFFLINE_ZOOMS = [12, 13, 14, 15]
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

async function fetchOsrmRoute(waypoints) {
  const coords = waypoints
    .map((pt) => `${parseFloat(pt.longitude)},${parseFloat(pt.latitude)}`)
    .join(';')
  const url =
    `https://router.project-osrm.org/route/v1/foot/${coords}` +
    `?overview=full&geometries=geojson`
  const res = await fetch(url)
  const data = await res.json()
  if (data.code === 'Ok' && data.routes?.[0]) {
    return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
  }
  return null
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

function nearestPointIdx(startLat, startLng, points) {
  let minDist = Infinity
  let minIdx = 0
  points.forEach((pt, i) => {
    const d = distanceKm(
      startLat, startLng,
      parseFloat(pt.latitude), parseFloat(pt.longitude)
    )
    if (d < minDist) { minDist = d; minIdx = i }
  })
  return minIdx
}

// Creates the green "S" start marker icon
function makeStartIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:#22c55e;color:#fff;font-weight:700;font-size:12px;
      width:28px;height:28px;border-radius:50%;display:flex;
      align-items:center;justify-content:center;
      border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);">S</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

// Reusable helper: place or replace the start marker on the map
function placeStartMarker(map, lat, lng, startMarkerRef, setStartPoint) {
  if (startMarkerRef.current) {
    startMarkerRef.current.remove()
    startMarkerRef.current = null
  }
  const marker = L.marker([lat, lng], { icon: makeStartIcon(), draggable: true })
    .addTo(map)
    .bindPopup('Початкова точка')
  marker.on('dragend', (ev) => {
    const pos = ev.target.getLatLng()
    setStartPoint({ lat: pos.lat, lng: pos.lng })
  })
  startMarkerRef.current = marker
  setStartPoint({ lat, lng })
}

export default function MainPage() {
  const { currentUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const mapRef = useRef(null)
  const leafletRef = useRef(null)
  const markersRef = useRef([])
  const routeMarkersRef = useRef([])   // markers for selected route points
  const polylineRef = useRef(null)
  const startMarkerRef = useRef(null)
  const walkingLineRef = useRef(null)
  const tileLayerRef = useRef(null)
  const searchTimerRef = useRef(null)

  const [openSection, setOpenSection] = useState('mood')
  const [selectedMood, setSelectedMood] = useState(null)
  const [selectedBudget, setSelectedBudget] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [selectedDestination, setSelectedDestination] = useState(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [savedRouteIds, setSavedRouteIds] = useState(new Set())
  const [selectedRouteId, setSelectedRouteId] = useState(null)
  const [savingId, setSavingId] = useState(null)
  const [startPoint, setStartPoint] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Offline
  const [offlineStatus, setOfflineStatus] = useState('idle')
  const [offlineProgress, setOfflineProgress] = useState(0)

  // Feature 1 & 2
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [locating, setLocating] = useState(false)

  // Leaflet init
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return

    const map = L.map(mapRef.current, { zoomControl: false }).setView(DEFAULT_CENTER, DEFAULT_ZOOM)
    L.control.zoom({ position: 'bottomleft' }).addTo(map)

    const offlineLayer = tileLayerOffline(TILE_URL, {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    })
    offlineLayer.addTo(map)
    tileLayerRef.current = offlineLayer
    leafletRef.current = map

    getStorageLength().then((count) => {
      if (count > 0) setOfflineStatus('done')
    })

    map.on('click', (e) => {
      placeStartMarker(map, e.latlng.lat, e.latlng.lng, startMarkerRef, setStartPoint)
    })

    return () => {
      map.remove()
      leafletRef.current = null
    }
  }, [])

  // Clear markers when results change
  useEffect(() => {
    const map = leafletRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
    routeMarkersRef.current.forEach((m) => m.remove())
    routeMarkersRef.current = []
    if (polylineRef.current) { polylineRef.current.remove(); polylineRef.current = null }
    if (walkingLineRef.current) { walkingLineRef.current.remove(); walkingLineRef.current = null }

    results.forEach((route) => {
      const points = route.points ?? []
      if (points.length > 0) {
        points.forEach((pt, i) => {
          const marker = L.marker([pt.latitude, pt.longitude])
            .addTo(map)
            .bindPopup(`<b>${route.name}</b><br>${pt.name ?? ''}`)
          markersRef.current.push(marker)
          if (i === 0 && results.indexOf(route) === 0) {
            map.setView([pt.latitude, pt.longitude], DEFAULT_ZOOM)
          }
        })
      }
    })

    const saved = new Set(results.filter((r) => r.is_saved).map((r) => r.id))
    setSavedRouteIds(saved)
  }, [results])

  const toggleSection = (section) =>
    setOpenSection(openSection === section ? null : section)

  // Feature 1: GPS geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation || locating) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const map = leafletRef.current
        if (!map) { setLocating(false); return }
        placeStartMarker(map, coords.latitude, coords.longitude, startMarkerRef, setStartPoint)
        map.setView([coords.latitude, coords.longitude], 15)
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 10000 }
    )
  }

  // Feature 2: Nominatim address search
  const handleSearchChange = (e) => {
    const q = e.target.value
    setSearchQuery(q)
    clearTimeout(searchTimerRef.current)
    if (q.length < 3) { setSearchResults([]); return }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=ua&accept-language=uk`
        )
        const data = await res.json()
        setSearchResults(data)
      } catch {
        setSearchResults([])
      }
    }, 400)
  }

  const handleSelectAddress = (result) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    const map = leafletRef.current
    if (!map) return
    placeStartMarker(map, lat, lng, startMarkerRef, setStartPoint)
    map.setView([lat, lng], 15)
    setSearchQuery(result.display_name.split(',').slice(0, 2).join(',').trim())
    setSearchResults([])
  }

  const handleFindPath = async () => {
    setLoading(true)
    setSearched(true)
    setSelectedRouteId(null)

    const filters = {}
    if (selectedMood) filters.mood = MOOD_API_MAP[selectedMood]
    if (selectedBudget) Object.assign(filters, BUDGET_MAP[selectedBudget])
    if (selectedTime) Object.assign(filters, TIME_MAP[selectedTime])
    if (selectedDestination) Object.assign(filters, DESTINATION_MAP[selectedDestination])

    try {
      const res = await routesApi.getList(filters)
      const data = res.data.results ?? res.data

      if (startPoint && data.length) {
        const RADIUS_KM = 3
        const FALLBACK_N = 10
        const withDist = data.map((r) => {
          const pt = r.first_point
          const dist = pt
            ? distanceKm(startPoint.lat, startPoint.lng,
                         parseFloat(pt.latitude), parseFloat(pt.longitude))
            : Infinity
          return { ...r, _distKm: dist }
        })
        withDist.sort((a, b) => a._distKm - b._distKm)
        const nearby = withDist.filter((r) => r._distKm <= RADIUS_KM)
        setResults(nearby.length > 0 ? nearby : withDist.slice(0, FALLBACK_N))
      } else {
        setResults(data)
      }
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (routeId) => {
    if (savedRouteIds.has(routeId) || savingId === routeId) return
    setSavingId(routeId)
    try {
      await userRoutes.save(routeId)
      setSavedRouteIds((prev) => new Set([...prev, routeId]))
    } catch (err) {
      if (err?.response?.status === 400 || err?.response?.status === 409) {
        setSavedRouteIds((prev) => new Set([...prev, routeId]))
      }
    } finally {
      setSavingId(null)
    }
  }

  const handleSelectRoute = async (route) => {
    const map = leafletRef.current
    if (!map) return

    const newId = route.id === selectedRouteId ? null : route.id
    setSelectedRouteId(newId)

    if (polylineRef.current) { polylineRef.current.remove(); polylineRef.current = null }
    if (walkingLineRef.current) { walkingLineRef.current.remove(); walkingLineRef.current = null }
    // Clean up previous route point markers
    routeMarkersRef.current.forEach((m) => m.remove())
    routeMarkersRef.current = []

    if (!newId) return

    try {
      const res = await routesApi.getDetail(route.id)
      const points = res.data.points ?? []
      if (points.length < 2) return

      const entryIdx = startPoint
        ? nearestPointIdx(startPoint.lat, startPoint.lng, points)
        : 0
      const safeIdx = entryIdx < points.length - 1 ? entryIdx : Math.max(0, points.length - 2)

      const OSRM_CACHE_KEY = `osrm-${route.id}`
      let fullCoords = null

      try {
        const cached = localStorage.getItem(OSRM_CACHE_KEY)
        if (cached) fullCoords = JSON.parse(cached)
      } catch { /* ігноруємо */ }

      if (!fullCoords) {
        try {
          const routed = await fetchOsrmRoute(points)
          if (routed) {
            fullCoords = routed
            try { localStorage.setItem(OSRM_CACHE_KEY, JSON.stringify(routed)) } catch { /* full */ }
          }
        } catch { /* офлайн */ }

        if (!fullCoords) {
          fullCoords = points.map((pt) => [parseFloat(pt.latitude), parseFloat(pt.longitude)])
        }
      }

      let coords = fullCoords
      if (startPoint && fullCoords.length > 1) {
        let minDist = Infinity
        let nearestCoordIdx = 0
        fullCoords.forEach(([lat, lng], i) => {
          const d = distanceKm(startPoint.lat, startPoint.lng, lat, lng)
          if (d < minDist) { minDist = d; nearestCoordIdx = i }
        })
        const sliceFrom = nearestCoordIdx < fullCoords.length - 1
          ? nearestCoordIdx
          : Math.max(0, fullCoords.length - 2)
        coords = fullCoords.slice(sliceFrom)
      }

      const routeSlice = points.slice(safeIdx)

      const polyline = L.polyline(coords, {
        color: '#6366f1', weight: 4, opacity: 0.85, lineJoin: 'round',
      }).addTo(map)
      polylineRef.current = polyline

      // Feature 6: Add point markers with photo popups + user upload
      points.forEach((pt) => {
        const adminPhotoHtml = pt.image_url
          ? `<img src="${pt.image_url}" alt="${pt.name ?? ''}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;display:block;margin-top:6px;" />`
          : ''
        const userPhotosHtml = (pt.user_photos ?? [])
          .map((p) => `<img src="${p.image_url}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;display:block;" />`)
          .join('')
        const popupHtml = `
          <div style="font-family:sans-serif;max-width:190px;">
            <b style="font-size:13px;">${pt.name ?? ''}</b>
            ${pt.description ? `<br><span style="font-size:11px;color:#555;">${pt.description}</span>` : ''}
            ${pt.duration_at_stop ? `<br><span style="font-size:11px;color:#888;">⏱ ${pt.duration_at_stop} хв</span>` : ''}
            ${adminPhotoHtml}
            <div id="pt-photos-${pt.id}" style="display:flex;flex-direction:column;gap:4px;margin-top:${userPhotosHtml ? '4px' : '0'};">
              ${userPhotosHtml}
            </div>
            <label style="display:inline-flex;align-items:center;gap:4px;margin-top:8px;cursor:pointer;font-size:11px;color:#6366f1;font-weight:500;user-select:none;">
              📷 Додати фото
              <input type="file" accept="image/*" id="pt-upload-${pt.id}" style="display:none;" />
            </label>
            <div id="pt-status-${pt.id}" style="font-size:11px;color:#888;min-height:14px;margin-top:2px;"></div>
          </div>`

        const m = L.marker([parseFloat(pt.latitude), parseFloat(pt.longitude)])
          .addTo(map)
          .bindPopup(popupHtml, { maxWidth: 220 })

        // Attach upload handler once popup opens
        m.on('popupopen', () => {
          const input = document.getElementById(`pt-upload-${pt.id}`)
          if (!input || input._listenerAdded) return
          input._listenerAdded = true

          input.addEventListener('change', async (e) => {
            const file = e.target.files[0]
            if (!file) return
            const statusEl = document.getElementById(`pt-status-${pt.id}`)
            const photosEl = document.getElementById(`pt-photos-${pt.id}`)
            if (statusEl) statusEl.textContent = 'Завантаження…'
            const formData = new FormData()
            formData.append('image', file)
            try {
              const res = await pointPhotos.upload(pt.id, formData)
              if (photosEl) {
                const img = document.createElement('img')
                img.src = res.data.image_url
                img.style.cssText = 'width:100%;height:90px;object-fit:cover;border-radius:6px;display:block;'
                photosEl.appendChild(img)
              }
              if (statusEl) {
                statusEl.style.color = '#22c55e'
                statusEl.textContent = '✓ Фото додано!'
                setTimeout(() => { statusEl.textContent = ''; statusEl.style.color = '#888' }, 2500)
              }
            } catch {
              if (statusEl) {
                statusEl.style.color = '#ef4444'
                statusEl.textContent = '✗ Помилка завантаження'
                setTimeout(() => { statusEl.textContent = ''; statusEl.style.color = '#888' }, 2500)
              }
            }
            e.target.value = '' // скидаємо, щоб можна було завантажити те саме фото ще раз
          })
        })

        routeMarkersRef.current.push(m)
      })

      if (startPoint) {
        const entryPt = routeSlice[0]
        const walkWaypoints = [
          { latitude: startPoint.lat,   longitude: startPoint.lng },
          { latitude: entryPt.latitude, longitude: entryPt.longitude },
        ]
        let walkCoords
        try {
          walkCoords = await fetchOsrmRoute(walkWaypoints) ?? [
            [startPoint.lat, startPoint.lng],
            [parseFloat(entryPt.latitude), parseFloat(entryPt.longitude)],
          ]
        } catch {
          walkCoords = [
            [startPoint.lat, startPoint.lng],
            [parseFloat(entryPt.latitude), parseFloat(entryPt.longitude)],
          ]
        }
        walkingLineRef.current = L.polyline(walkCoords, {
          color: '#f97316', weight: 3, opacity: 0.85, dashArray: '10, 8',
        }).addTo(map)
      }

      map.fitBounds(polyline.getBounds(), { padding: [40, 40] })
    } catch {
      // ігноруємо
    }
  }

  const handleClearStart = () => {
    if (startMarkerRef.current) { startMarkerRef.current.remove(); startMarkerRef.current = null }
    if (walkingLineRef.current) { walkingLineRef.current.remove(); walkingLineRef.current = null }
    setStartPoint(null)
  }

  const handleSaveOffline = async () => {
    const layer = tileLayerRef.current
    const map = leafletRef.current
    if (!layer || !map) return

    setOfflineStatus('downloading')
    setOfflineProgress(0)

    let allTiles = []
    for (const zoom of OFFLINE_ZOOMS) {
      const area = L.bounds(
        map.project(LVIV_BOUNDS.getNorthWest(), zoom),
        map.project(LVIV_BOUNDS.getSouthEast(), zoom)
      )
      allTiles = allTiles.concat(layer.getTileUrls(area, zoom))
    }

    const total = allTiles.length
    let saved = 0
    const BATCH = 10

    for (let i = 0; i < total; i += BATCH) {
      const batch = allTiles.slice(i, i + BATCH)
      await Promise.all(
        batch.map(async (tile) => {
          try {
            const blob = await downloadTile(tile.url)
            await saveTile(tile, blob)
          } catch {
            // skip
          }
          saved++
          setOfflineProgress(Math.round((saved / total) * 100))
        })
      )
    }

    setOfflineStatus('done')
  }

  const displayName = currentUser
    ? (currentUser.first_name || currentUser.email)
    : ''

  return (
    <div className="app-container">
      <div ref={mapRef} className="map-background" />

      {!startPoint && (
        <div className="map-hint">📍 Клікни на карту щоб встановити початкову точку</div>
      )}

      {/* Feature 1: Locate me */}
      <button
        className="locate-btn"
        onClick={handleLocateMe}
        disabled={locating}
        title="Визначити моє місцезнаходження"
      >
        <Navigation size={16} style={{ opacity: locating ? 0.4 : 1 }} />
      </button>

      <button
        className="offline-btn"
        onClick={handleSaveOffline}
        disabled={offlineStatus !== 'idle'}
      >
        {offlineStatus === 'idle' && '💾 Зберегти карту офлайн'}
        {offlineStatus === 'downloading' && `⏳ ${offlineProgress}%`}
        {offlineStatus === 'done' && '✅ Карта збережена'}
      </button>

      <aside className={`sidebar${sidebarOpen ? '' : ' sidebar--collapsed'}`}>
        <div className="sidebar-header">
          <span className="logo">SEARCH4YOU</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Feature 3: Theme toggle */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Темна тема' : 'Світла тема'}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <Menu size={20} className="menu-icon" onClick={() => setSidebarOpen(o => !o)} />
          </div>
        </div>

        {/* Feature 2: Address search */}
        {sidebarOpen && (
          <div className="address-search">
            <div className="address-search-input-wrap">
              <Search size={14} className="search-icon-inside" />
              <input
                className="address-search-input"
                type="text"
                placeholder="Пошук адреси…"
                value={searchQuery}
                onChange={handleSearchChange}
                onBlur={() => setTimeout(() => setSearchResults([]), 150)}
              />
            </div>
            {searchResults.length > 0 && (
              <div className="address-dropdown">
                {searchResults.map((r) => (
                  <div
                    key={r.place_id}
                    className="address-dropdown-item"
                    onMouseDown={() => handleSelectAddress(r)}
                  >
                    {r.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {sidebarOpen && <div className="filters-container">
          <FilterItem
            id="mood"
            label="Настрій"
            icon={<Briefcase size={18} />}
            isOpen={openSection === 'mood'}
            onToggle={() => toggleSection('mood')}
          >
            {['Спокійний', 'Активний', 'Пізнавальний'].map((m) => (
              <div
                key={m}
                className={`mood-option${selectedMood === m ? ' active' : ''}`}
                onClick={() => setSelectedMood(selectedMood === m ? null : m)}
              >{m}</div>
            ))}
          </FilterItem>

          <FilterItem
            id="budget"
            label="Бюджет"
            icon={<span style={{fontWeight:700,fontSize:15,lineHeight:1}}>₴</span>}
            isOpen={openSection === 'budget'}
            onToggle={() => toggleSection('budget')}
          >
            {['Низький', 'Середній', 'Високий'].map((b) => (
              <div
                key={b}
                className={`mood-option${selectedBudget === b ? ' active' : ''}`}
                onClick={() => setSelectedBudget(selectedBudget === b ? null : b)}
              >{b}</div>
            ))}
          </FilterItem>

          <FilterItem
            id="time"
            label="Час"
            icon={<Hourglass size={18} />}
            isOpen={openSection === 'time'}
            onToggle={() => toggleSection('time')}
          >
            {['1 година', 'Пів дня', 'Весь день'].map((t) => (
              <div
                key={t}
                className={`mood-option${selectedTime === t ? ' active' : ''}`}
                onClick={() => setSelectedTime(selectedTime === t ? null : t)}
              >{t}</div>
            ))}
          </FilterItem>

          <FilterItem
            id="destination"
            label="Місце"
            icon={<MapPin size={18} />}
            isOpen={openSection === 'destination'}
            onToggle={() => toggleSection('destination')}
          >
            {['Парки', 'Музеї', 'Кафе'].map((d) => (
              <div
                key={d}
                className={`mood-option${selectedDestination === d ? ' active' : ''}`}
                onClick={() => setSelectedDestination(selectedDestination === d ? null : d)}
              >{d}</div>
            ))}
          </FilterItem>
        </div>}

        {sidebarOpen && <div className="sidebar-footer">
          {startPoint && (
            <button className="clear-start-btn" onClick={handleClearStart}>
              ✕ Скинути початкову точку
            </button>
          )}
          <button
            className="find-path-btn"
            onClick={handleFindPath}
            disabled={loading}
          >
            {loading ? 'Шукаємо…' : 'Знайти маршрут'}
          </button>
        </div>}
      </aside>

      {searched && sidebarOpen && (
        <div className="results-panel">
          <h3>Маршрути {results.length > 0 ? `(${results.length})` : ''}</h3>
          {startPoint && results.length > 0 && (
            <p className="sort-hint">
              📍 {results[results.length - 1]?._distKm <= 3
                ? `Маршрути в радіусі 3 км від вас`
                : `${results.length} найближчих маршрутів`}
            </p>
          )}
          {loading && <p className="loading-text">Завантаження…</p>}
          {!loading && results.length === 0 && (
            <p className="loading-text">Маршрутів не знайдено. Спробуйте інші фільтри.</p>
          )}
          {results.map((route) => {
            const isSaved = savedRouteIds.has(route.id)
            const isSaving = savingId === route.id
            const isSelected = selectedRouteId === route.id
            return (
              <div
                key={route.id}
                className={`route-card${isSelected ? ' route-card--selected' : ''}`}
                onClick={() => handleSelectRoute(route)}
                style={{ cursor: 'pointer' }}
              >
                <div className="route-card-name">{route.name}</div>
                {startPoint && route._distKm !== undefined && route._distKm !== Infinity && (
                  <div className="route-distance">
                    📍 {route._distKm < 1
                      ? `${Math.round(route._distKm * 1000)} м від вас`
                      : `${route._distKm.toFixed(1)} км від вас`}
                  </div>
                )}
                <div className="route-card-meta">
                  {route.estimated_duration} хв · {route.budget_max ?? 0} грн
                  {route.avg_rating ? ` · ★ ${Number(route.avg_rating).toFixed(1)}` : ''}
                </div>
                <button
                  className={`save-btn${isSaved ? ' save-btn--saved' : ''}`}
                  disabled={isSaved || isSaving}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSave(route.id)
                  }}
                >
                  {isSaving ? '…' : isSaved ? '✓ Збережено' : 'Зберегти'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <WeatherWidget city="Lviv" />

      <Link to="/account" className="user-profile">
        <div className="avatar">👤</div>
        <div className="user-info">
          <span className="user-name">{displayName}</span>
          <span className="user-email">{currentUser?.email}</span>
        </div>
      </Link>
    </div>
  )
}
