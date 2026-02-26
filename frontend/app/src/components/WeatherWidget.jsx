import { useState, useEffect } from 'react'
import { weather as weatherApi } from '../api/index.js'

export default function WeatherWidget({ city = 'Lviv' }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    weatherApi.get(city)
      .then((res) => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [city])

  if (loading) return (
    <div style={styles.widget}>
      <span style={styles.loading}>⏳ Loading weather…</span>
    </div>
  )

  if (error || !data) return (
    <div style={styles.widget}>
      <span style={styles.loading}>🌡️ Weather unavailable</span>
    </div>
  )

  const iconUrl = `https://openweathermap.org/img/wn/${data.icon}@2x.png`

  return (
    <div style={styles.widget}>
      <img src={iconUrl} alt={data.description} style={styles.icon} />
      <div style={styles.info}>
        <div style={styles.temp}>{Math.round(data.temp)}°C</div>
        <div style={styles.city}>{data.city}</div>
        <div style={styles.desc}>{data.description}</div>
      </div>
      <div style={styles.extra}>
        <div>💧 {data.humidity}%</div>
        <div>💨 {data.wind_speed} m/s</div>
      </div>
    </div>
  )
}

const styles = {
  widget: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 10,
    background: 'white',
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 180,
  },
  icon: {
    width: 48,
    height: 48,
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  temp: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1a2b3c',
    lineHeight: 1,
  },
  city: {
    fontSize: 12,
    fontWeight: 600,
    color: '#444',
  },
  desc: {
    fontSize: 11,
    color: '#888',
    textTransform: 'capitalize',
  },
  extra: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: 11,
    color: '#666',
    gap: 2,
    marginLeft: 4,
  },
  loading: {
    fontSize: 12,
    color: '#888',
  },
}
