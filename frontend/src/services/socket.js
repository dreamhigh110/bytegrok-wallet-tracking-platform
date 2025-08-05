import { io } from 'socket.io-client'
import toast from 'react-hot-toast'

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.listeners = new Map()
  }

  // Initialize socket connection
  connect() {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin

    this.socket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 20000,
      transports: ['websocket', 'polling'],
    })

    this.setupEventListeners()
    
    return this.socket
  }

  // Setup socket event listeners
  setupEventListeners() {
    if (!this.socket) return

    // Connection events
    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server')
      this.isConnected = true
      this.reconnectAttempts = 0
      
      // Notify listeners
      this.notifyListeners('connection', { connected: true })
      
      // Show success toast only after reconnection
      if (this.reconnectAttempts > 0) {
        toast.success('Reconnected to server')
      }
    })

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason)
      this.isConnected = false
      
      // Notify listeners
      this.notifyListeners('connection', { connected: false, reason })
      
      // Show disconnection toast
      if (reason === 'io server disconnect') {
        toast.error('Server disconnected')
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error)
      this.reconnectAttempts++
      
      // Notify listeners
      this.notifyListeners('connection', { 
        connected: false, 
        error: error.message,
        attempts: this.reconnectAttempts 
      })
      
      // Show error toast after max attempts
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast.error('Failed to connect to server')
      }
    })

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`[Socket] Reconnected after ${attemptNumber} attempts`)
      toast.success('Connection restored')
    })

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`[Socket] Reconnection attempt ${attemptNumber}`)
    })

    // Transaction events
    this.socket.on('newTransaction', (transaction) => {
      console.log('[Socket] New transaction:', transaction)
      this.notifyListeners('newTransaction', transaction)
      
      // Show notification for fee collections
      if (transaction.isFeeCollection) {
        toast.success(
          `New ${transaction.tokenSymbol} fee: ${transaction.valueFormatted}`,
          {
            icon: '💰',
            duration: 6000,
          }
        )
      }
    })

    this.socket.on('newTransactions', (data) => {
      console.log('[Socket] New transactions batch:', data)
      this.notifyListeners('newTransactions', data)
      
      if (data.count > 0) {
        toast(`${data.count} new transactions`, {
          icon: '📊',
          duration: 4000,
        })
      }
    })

    // Wallet events
    this.socket.on('walletStatsUpdate', (stats) => {
      console.log('[Socket] Wallet stats updated:', stats)
      this.notifyListeners('walletStatsUpdate', stats)
    })

    // System events
    this.socket.on('systemAlert', (alert) => {
      console.log('[Socket] System alert:', alert)
      this.notifyListeners('systemAlert', alert)
      
      switch (alert.type) {
        case 'error':
          toast.error(alert.message)
          break
        case 'warning':
          toast(alert.message, { icon: '⚠️' })
          break
        case 'info':
          toast(alert.message, { icon: 'ℹ️' })
          break
        default:
          toast(alert.message)
      }
    })

    // Monitoring events
    this.socket.on('monitoringUpdate', (data) => {
      console.log('[Socket] Monitoring update:', data)
      this.notifyListeners('monitoringUpdate', data)
    })
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      console.log('[Socket] Manually disconnected')
    }
  }

  // Subscribe to events
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)

    // Return unsubscribe function
    return () => {
      this.off(event, callback)
    }
  }

  // Unsubscribe from events
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback)
      if (this.listeners.get(event).size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  // Emit event to server
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data)
    } else {
      console.warn('[Socket] Cannot emit event - not connected')
    }
  }

  // Notify all listeners for an event
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`[Socket] Error in listener for ${event}:`, error)
        }
      })
    }
  }

  // Get connection status
  getStatus() {
    return {
      connected: this.isConnected,
      socket: this.socket?.connected || false,
      attempts: this.reconnectAttempts,
      id: this.socket?.id || null,
    }
  }

  // Request manual sync
  requestSync() {
    this.emit('requestSync', { timestamp: Date.now() })
  }

  // Subscribe to specific wallet updates
  subscribeToWallet(address) {
    this.emit('subscribeWallet', { address })
  }

  // Unsubscribe from wallet updates
  unsubscribeFromWallet(address) {
    this.emit('unsubscribeWallet', { address })
  }

  // Request specific data refresh
  requestRefresh(type) {
    this.emit('requestRefresh', { type, timestamp: Date.now() })
  }
}

// Create singleton instance
const socketService = new SocketService()

// Auto-connect when module loads
if (typeof window !== 'undefined') {
  socketService.connect()
}

export default socketService