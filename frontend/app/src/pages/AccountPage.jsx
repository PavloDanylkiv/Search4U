import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { user as userApi, userRoutes } from '../api/index.js'
import PathesList from '../components/PathesList.jsx'
import './AccountPage.css'

export default function AccountPage() {
  const { currentUser, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const [pathes,  setPathes]  = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [nameForm, setNameForm] = useState({ first_name: '', last_name: '' })
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    Promise.all([
      userApi.getStats(),
      userRoutes.getList(),
    ])
      .then(([statsRes, routesRes]) => {
        setStats(statsRes.data)
        setPathes(routesRes.data.results ?? routesRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const formatTime = (minutes) => {
    if (!minutes) return '0m'
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60)
      const m = minutes % 60
      return m === 0 ? `${h}h` : `${h}h ${m}m`
    }
    return `${minutes}m`
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleEditName = () => {
    setNameForm({
      first_name: currentUser?.first_name ?? '',
      last_name:  currentUser?.last_name  ?? '',
    })
    setEditingName(true)
  }

  const handleSaveName = async () => {
    setSavingName(true)
    try {
      await updateUser(nameForm)
      setEditingName(false)
    } catch {
      // ignore
    } finally {
      setSavingName(false)
    }
  }

  const displayName = currentUser
    ? [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ') || currentUser.email
    : ''

  return (
    <div className="account-container">
      <header className="page-header">
        <div className="header-left">
          <div className="avatar-placeholder">👤</div>
          <div>
            {editingName ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    placeholder="Ім'я"
                    value={nameForm.first_name}
                    onChange={e => setNameForm(p => ({ ...p, first_name: e.target.value }))}
                    style={inputStyle}
                  />
                  <input
                    placeholder="Прізвище"
                    value={nameForm.last_name}
                    onChange={e => setNameForm(p => ({ ...p, last_name: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="primary-btn" onClick={handleSaveName} disabled={savingName}
                    style={{ padding: '4px 12px', fontSize: 13 }}>
                    {savingName ? '…' : 'Зберегти'}
                  </button>
                  <button className="primary-btn" onClick={() => setEditingName(false)}
                    style={{ padding: '4px 12px', fontSize: 13, backgroundColor: '#aaa' }}>
                    Скасувати
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {displayName}
                  <button
                    onClick={handleEditName}
                    title="Редагувати ім'я"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0 }}
                  >✏️</button>
                </h1>
                <p className="subtitle">{currentUser?.email}</p>
              </>
            )}
          </div>
        </div>
        <div className="header-right">
          <button className="primary-btn" onClick={() => navigate('/')}>
            Home Page
          </button>
          <button className="primary-btn" onClick={handleLogout}
            style={{ backgroundColor: '#666' }}>
            Log out
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-header"><span>Total Paths</span></div>
          <div className="stat-value">
            {loading ? '…' : (stats?.total_routes ?? 0)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span>Total Time</span></div>
          <div className="stat-value">
            {loading ? '…' : formatTime(stats?.total_time_minutes)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span>Total Budget</span></div>
          <div className="stat-value">
            {loading ? '…' : `₴${stats?.total_budget ?? 0}`}
          </div>
        </div>
      </section>

      <section className="history-section">
        <div className="section-header">
          <h2>Path History</h2>
          <p className="subtitle">A complete record of all your paths and journeys</p>
        </div>

        {loading ? (
          <p style={{ color: '#888', fontSize: 14 }}>Loading…</p>
        ) : pathes.length === 0 ? (
          <p style={{ color: '#888', fontSize: 14 }}>No paths yet.</p>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Path</th>
                <th>Date</th>
                <th>Time</th>
                <th>Budget</th>
                <th>Review</th>
                <th>Comment</th>
              </tr>
            </thead>
            <PathesList pathes={pathes} />
          </table>
        )}
      </section>
    </div>
  )
}

const inputStyle = {
  padding: '6px 10px',
  border: '1px solid #ddd',
  borderRadius: 4,
  fontSize: 14,
  width: 130,
}
