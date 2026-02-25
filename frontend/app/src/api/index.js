import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth
export const auth = {
  register: ({ first_name, last_name, email, password1, password2 }) =>
    api.post('/api/auth/registration/', { first_name, last_name, email, password1, password2 }),

  login: ({ email, password }) =>
    api.post('/api/auth/login/', { email, password }),

  googleLogin: (credential) =>
    api.post('/api/auth/google/', { credential }),

  logout: () =>
    api.post('/api/auth/logout/', {
      refresh: localStorage.getItem('refresh_token'),
    }),
}

//User
export const user = {
  getMe: () => api.get('/api/users/me/'),
  updateMe: (data) => api.patch('/api/users/me/', data),
  // Повертає: total_routes, completed_routes, total_time_minutes, total_budget
  getStats: () => api.get('/api/users/me/stats/'),
}

// Routes
export const routes = {
  getList: (filters = {}) => api.get('/api/routes/', { params: filters }),
  getDetail: (id) => api.get(`/api/routes/${id}/`),
}

//User saved routes
export const userRoutes = {
  getList: (filters = {}) => api.get('/api/user/routes/', { params: filters }),
  save: (route_id) => api.post('/api/user/routes/', { route_id }),
  update: (id, data) => api.patch(`/api/user/routes/${id}/`, data),
  remove: (id) => api.delete(`/api/user/routes/${id}/`),
}

//Weather
export const weather = {
  get: (city = 'Lviv') => api.get('/api/weather/', { params: { city } }),
}


// Ratings
export const ratings = {
  create: (routeId, data) => api.post(`/api/routes/${routeId}/ratings/`, data),
  update: (routeId, ratingId, data) => api.put(`/api/routes/${routeId}/ratings/${ratingId}/`, data),
}

export default api
