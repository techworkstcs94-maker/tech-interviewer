import axios from 'axios'

const apiUrl = import.meta.env.VITE_API_URL || ''

const recruiterClient = axios.create({
  baseURL: apiUrl,
  headers: { 'Content-Type': 'application/json' },
})

recruiterClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('recruiterToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401/403 clear recruiter session and return to login — never touch candidate token
recruiterClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('recruiterToken')
      window.location.href = '/recruiter'
    }
    return Promise.reject(err)
  }
)

export default recruiterClient
