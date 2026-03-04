import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { user as userApi, userRoutes } from '../api/index.js'
import PathesList from '../components/PathesList.jsx'
import './AccountPage.css'

export default function AccountPage() {
  const { currentUser, updateUser, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
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
          <button className="theme-toggle-account" onClick={toggleTheme} title={theme === 'light' ? 'Темна тема' : 'Світла тема'}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="primary-btn" onClick={() => navigate('/')}>
            Головна
          </button>
          <button className="primary-btn" onClick={handleLogout}
            style={{ backgroundColor: '#666' }}>
            Вийти
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-header"><span>Всього маршрутів</span></div>
          <div className="stat-value">
            {loading ? '…' : (stats?.total_routes ?? 0)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span>Загальний час</span></div>
          <div className="stat-value">
            {loading ? '…' : formatTime(stats?.total_time_minutes)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span>Загальний бюджет</span></div>
          <div className="stat-value">
            {loading ? '…' : `₴${stats?.total_budget ?? 0}`}
          </div>
        </div>
      </section>

      <section className="history-section">
        <div className="section-header">
          <h2>Історія маршрутів</h2>
          <p className="subtitle">Повний список ваших маршрутів і подорожей</p>
        </div>

        {loading ? (
          <p style={{ color: '#888', fontSize: 14 }}>Завантаження…</p>
        ) : pathes.length === 0 ? (
          <p style={{ color: '#888', fontSize: 14 }}>Ще немає маршрутів.</p>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Маршрут</th>
                <th>Дата</th>
                <th>Час</th>
                <th>Бюджет</th>
                <th>Оцінка</th>
                <th>Коментар</th>
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
