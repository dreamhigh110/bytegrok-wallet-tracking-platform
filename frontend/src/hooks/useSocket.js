import { useState, useEffect, useCallback } from 'react'
import socketService from '../services/socket'

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [lastActivity, setLastActivity] = useState(null)

  useEffect(() => {
    // Update initial state
    const status = socketService.getStatus()
    setIsConnected(status.connected)
    setConnectionStatus(status.connected ? 'connected' : 'disconnected')

    // Subscribe to connection changes
    const unsubscribe = socketService.on('connection', (data) => {
      setIsConnected(data.connected)
      setConnectionStatus(data.connected ? 'connected' : 'disconnected')
      
      if (data.connected) {
        setLastActivity(new Date())
      }
    })

    return unsubscribe
  }, [])

  const requestSync = useCallback(() => {
    socketService.requestSync()
  }, [])

  const requestRefresh = useCallback((type) => {
    socketService.requestRefresh(type)
  }, [])

  return {
    isConnected,
    connectionStatus,
    lastActivity,
    requestSync,
    requestRefresh,
  }
}

export const useSocketEvent = (event, callback, deps = []) => {
  useEffect(() => {
    const unsubscribe = socketService.on(event, callback)
    return unsubscribe
  }, deps)
}

export const useNewTransactions = (callback) => {
  useSocketEvent('newTransaction', callback)
  useSocketEvent('newTransactions', callback)
}

export const useWalletUpdates = (callback) => {
  useSocketEvent('walletStatsUpdate', callback)
}