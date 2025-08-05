import axios from 'axios'

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    // const token = localStorage.getItem('authToken')
    // if (token) {
    //   config.headers.authorization = `Bearer ${token}`
    // }
    
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('[API] Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('[API] Response error:', error)
    
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          console.error('[API] Bad request:', data.message || 'Bad request')
          break
        case 401:
          console.error('[API] Unauthorized access')
          // Handle auth redirect if needed
          break
        case 403:
          console.error('[API] Access forbidden')
          break
        case 404:
          console.error('[API] Resource not found')
          break
        case 429:
          console.error('[API] Too many requests. Please slow down.')
          break
        case 500:
          console.error('[API] Server error. Please try again later.')
          break
        default:
          console.error('[API] Error:', data.message || `Error: ${status}`)
      }
    } else if (error.request) {
      // Network error
      console.error('[API] Network error. Please check your connection.')
    } else {
      // Other error
      console.error('[API] Something went wrong:', error.message)
    }
    
    return Promise.reject(error)
  }
)

// API service methods
export const apiService = {
  // Health check
  getHealthCheck: async () => {
    const response = await api.get('/health')
    return response.data
  },

  // Top-level convenience methods for dashboard
  getWalletStats: async () => {
    const response = await api.get('/wallet/stats')
    return response.data
  },

  getTransactions: async (params = {}) => {
    const response = await api.get('/transactions', { params })
    return response.data
  },

  getAnalytics: async (timeRange = '7d') => {
    const response = await api.get('/analytics/overview', { params: { timeRange } })
    return response.data
  },

  // Transaction endpoints
  transactions: {
    getAll: async (params = {}) => {
      const response = await api.get('/transactions', { params })
      return response.data
    },

    getRecent: async (params = {}) => {
      const response = await api.get('/transactions/recent', { params })
      return response.data
    },

    getFees: async (params = {}) => {
      const response = await api.get('/transactions/fees', { params })
      return response.data
    },

    getSummary: async (params = {}) => {
      const response = await api.get('/transactions/summary', { params })
      return response.data
    },

    getById: async (hash) => {
      const response = await api.get(`/transactions/${hash}`)
      return response.data
    },

    getByAddress: async (address, params = {}) => {
      const response = await api.get(`/transactions/address/${address}`, { params })
      return response.data
    },
  },

  // Wallet endpoints
  wallet: {
    getStats: async () => {
      const response = await api.get('/wallet/stats')
      return response.data
    },

    getBalances: async () => {
      const response = await api.get('/wallet/balances')
      return response.data
    },

    getBalance: async (token, address = null) => {
      const params = address ? { address } : {}
      const response = await api.get(`/wallet/balance/${token}`, { params })
      return response.data
    },

    recalculateStats: async () => {
      const response = await api.post('/wallet/recalculate-stats')
      return response.data
    },

    getDailyStats: async (params = {}) => {
      const response = await api.get('/wallet/daily-stats', { params })
      return response.data
    },

    getPerformance: async () => {
      const response = await api.get('/wallet/performance')
      return response.data
    },

    getInfo: async (address) => {
      const response = await api.get(`/wallet/info/${address}`)
      return response.data
    },
  },

  // Analytics endpoints
  analytics: {
    getOverview: async (params = {}) => {
      const response = await api.get('/analytics/overview', { params })
      return response.data
    },

    getTimeline: async (params = {}) => {
      const response = await api.get('/analytics/timeline', { params })
      return response.data
    },

    getFeeAnalysis: async (params = {}) => {
      const response = await api.get('/analytics/fee-analysis', { params })
      return response.data
    },

    getBalanceHistory: async (params = {}) => {
      const response = await api.get('/analytics/balance-history', { params })
      return response.data
    },

    getComparison: async (params = {}) => {
      const response = await api.get('/analytics/comparison', { params })
      return response.data
    },

    exportData: async (params = {}) => {
      const response = await api.get('/analytics/export', { 
        params,
        responseType: params.format === 'csv' ? 'blob' : 'json'
      })
      return response.data
    },
  },
}

// Utility functions for common operations
export const apiUtils = {
  // Format error message for display
  formatError: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message
    }
    if (error.message) {
      return error.message
    }
    return 'An unexpected error occurred'
  },

  // Create download from blob response
  downloadFile: (blob, filename) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },

  // Format query parameters
  formatParams: (params) => {
    const formatted = {}
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formatted[key] = value
      }
    })
    return formatted
  },

  // Retry failed request
  retryRequest: async (requestFn, maxRetries = 3, delay = 1000) => {
    let lastError
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn()
      } catch (error) {
        lastError = error
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
        }
      }
    }
    
    throw lastError
  },
}

// Export axios instance for direct use if needed
export { api }
export default apiService