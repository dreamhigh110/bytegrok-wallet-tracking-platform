import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../hooks/useTheme'

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  const [notifications, setNotifications] = useState({
    newTransactions: true,
    largeTrades: true,
    systemAlerts: false,
    email: false
  })
  const [refreshInterval, setRefreshInterval] = useState('30')
  const [displayCurrency, setDisplayCurrency] = useState('USD')

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleExportData = (format) => {
    // This would typically call an API endpoint
    console.log(`Exporting data in ${format} format`)
    // For now, just show an alert
    alert(`Exporting data in ${format} format... (Feature coming soon)`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Customize your BYTE Tracker experience
        </p>
      </div>

      {/* Appearance Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Appearance
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Theme Mode
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose between light and dark mode
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                theme === 'dark' ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Display Currency
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Currency for displaying values
              </p>
            </div>
            <select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              className="form-select rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="ETH">ETH</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Data & Monitoring Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Data & Monitoring
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Refresh Interval
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                How often to check for new transactions
              </p>
            </div>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(e.target.value)}
              className="form-select rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
              <option value="300">5 minutes</option>
            </select>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Tracked Wallets
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <code className="text-sm font-mono text-gray-900 dark:text-white">
                    0x4fbF8C4C3404e5C093bc17bb57361D1D7384fBDF
                  </code>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    LP Fee Collection Wallet
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Notifications
        </h3>
        
        <div className="space-y-4">
          {[
            { key: 'newTransactions', label: 'New Transactions', desc: 'Get notified when new transactions are detected' },
            { key: 'largeTrades', label: 'Large Trades', desc: 'Alert for transactions above a certain threshold' },
            { key: 'systemAlerts', label: 'System Alerts', desc: 'Important system messages and updates' },
            { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' }
          ].map((notification) => (
            <div key={notification.key} className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {notification.label}
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {notification.desc}
                </p>
              </div>
              <button
                onClick={() => handleNotificationChange(notification.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  notifications[notification.key] ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications[notification.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Data Export */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Data Export
        </h3>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Export your transaction data for external analysis or backup purposes.
          </p>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleExportData('CSV')}
              className="btn-secondary"
            >
              Export as CSV
            </button>
            <button
              onClick={() => handleExportData('JSON')}
              className="btn-secondary"
            >
              Export as JSON
            </button>
            <button
              onClick={() => handleExportData('Excel')}
              className="btn-secondary"
            >
              Export as Excel
            </button>
          </div>
        </div>
      </motion.div>

      {/* Advanced Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Advanced
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                RPC Endpoint
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Base chain RPC endpoint being used
              </p>
            </div>
            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              https://1rpc.io/base
            </code>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                API Version
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current API version
              </p>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              v1.0.0
            </span>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
              Clear All Data
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}