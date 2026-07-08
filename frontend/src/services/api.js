import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
const ACCESS_TOKEN_KEY = 'salon_access'
const REFRESH_TOKEN_KEY = 'salon_refresh'
const LEGACY_TOKEN_KEY = 'salon_token'

function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY) || null
}

function setStoredAccessToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
  localStorage.setItem(LEGACY_TOKEN_KEY, token)
}

function clearStoredTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

// attach access token to requests
api.interceptors.request.use((config) => {
  const token = getStoredAccessToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type']
  }
  return config
})

// response interceptor to handle token refresh
let isRefreshing = false
let refreshQueue = []

function processQueue(error, token = null) {
  refreshQueue.forEach((p) => {
    if (error) p.reject(error)
    else p.resolve(token)
  })
  refreshQueue = []
}

api.interceptors.response.use(undefined, async (error) => {
  const originalRequest = error.config
  if (error.response && error.response.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) {
      // no refresh token, give up
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise(function (resolve, reject) {
        refreshQueue.push({ resolve, reject })
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    isRefreshing = true
    try {
      const resp = await axios.post(API_BASE_URL + '/auth/refresh', {}, {
        headers: { Authorization: `Bearer ${refreshToken}` },
      })
      const newAccess = resp.data.access_token
      setStoredAccessToken(newAccess)
      processQueue(null, newAccess)
      originalRequest.headers.Authorization = `Bearer ${newAccess}`
      return api(originalRequest)
    } catch (err) {
      processQueue(err, null)
      clearStoredTokens()
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  }
  return Promise.reject(error)
})

export default api
