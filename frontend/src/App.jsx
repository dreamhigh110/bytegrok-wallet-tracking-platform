import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { motion, AnimatePresence } from 'framer-motion'

// Layout components
import Sidebar from './components/Layout/Sidebar'
import Header from './components/Layout/Header'
import Footer from './components/Layout/Footer'
import LoadingSpinner from './components/UI/LoadingSpinner'
import ErrorBoundary from './components/ErrorBoundary'

// Page components
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Analytics from './pages/Analytics'
import WalletDetails from './pages/WalletDetails'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

// Hooks and utilities
import { useSocket } from './hooks/useSocket'
import { useTheme } from './hooks/useTheme'
import { apiService } from './services/api'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { isConnected, connectionStatus } = useSocket()

  // Fetch initial app data
  const { data: appStatus, isLoading: statusLoading, error: statusError } = useQuery(
    'app-status',
    apiService.getHealthCheck,
    {
      refetchInterval: 30000, // Check every 30 seconds
      retry: 3,
    }
  )

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // Show loading screen while initializing
  if (statusLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Initializing BYTE Tracker...
          </p>
        </div>
      </div>
    )
  }

  // Show error if app failed to initialize
  if (statusError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 dark:bg-red-900 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Connection Failed
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Unable to connect to the BYTE Tracker backend. Please check your connection and try again.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mobile sidebar backdrop */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <Sidebar 
          open={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          connectionStatus={connectionStatus}
          isSocketConnected={isConnected}
        />

        {/* Main content */}
        <div className="lg:pl-64 flex flex-col min-h-screen">
          {/* Header */}
          <Header 
            onMenuClick={() => setSidebarOpen(true)}
            theme={theme}
            onThemeToggle={toggleTheme}
            connectionStatus={connectionStatus}
          />

          {/* Main content area */}
          <main className="flex-1 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route 
                    path="/" 
                    element={
                      <motion.div
                        key="dashboard"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Dashboard />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/transactions" 
                    element={
                      <motion.div
                        key="transactions"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Transactions />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/analytics" 
                    element={
                      <motion.div
                        key="analytics"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Analytics />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/wallet" 
                    element={
                      <motion.div
                        key="wallet"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <WalletDetails />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/settings" 
                    element={
                      <motion.div
                        key="settings"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Settings />
                      </motion.div>
                    } 
                  />
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </AnimatePresence>
            </div>
          </main>

          {/* Footer */}
          <Footer appStatus={appStatus} />
        </div>

        {/* Connection status indicator */}
        <AnimatePresence>
          {!isConnected && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Reconnecting...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  )
}

export default App