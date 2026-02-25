import { createContext, useContext, useState, useEffect } from 'react'
import { auth, user as userApi } from '../api/index.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!currentUser

  // Завантажити поточного юзера
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      return
    }
    userApi.getMe()
      .then((res) => setCurrentUser(res.data))
      .catch(() => {
        // Токен невалідний — очистити
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async ({ email, password }) => {
    const res = await auth.login({ email, password })
    const { access, refresh } = res.data
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    const meRes = await userApi.getMe()
    setCurrentUser(meRes.data)
  }

  const updateUser = async (data) => {
    await userApi.updateMe(data)
    const meRes = await userApi.getMe()
    setCurrentUser(meRes.data)
  }

  const googleLogin = async (credential) => {
    const res = await auth.googleLogin(credential)
    const { access, refresh } = res.data
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    const meRes = await userApi.getMe()
    setCurrentUser(meRes.data)
  }

  const logout = async () => {
    try {
      await auth.logout()
    } catch {

    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setCurrentUser(null)
  }

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, loading, login, googleLogin, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
