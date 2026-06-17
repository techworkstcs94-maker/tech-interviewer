import axios from 'axios'

const apiUrl = import.meta.env.VITE_API_URL || ''

const client = axios.create({
  baseURL: apiUrl,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('sessionId')
      localStorage.removeItem('candidateName')
      window.location.href = '/start'
    }
    return Promise.reject(err)
  }
)

export default client
