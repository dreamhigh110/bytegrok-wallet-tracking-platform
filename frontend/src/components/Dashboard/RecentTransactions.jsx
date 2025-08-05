import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function RecentTransactions({ transactions = [], loading = false }) {
  // Ensure transactions is always an array
  const transactionList = Array.isArray(transactions) ? transactions : []
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const formatAmount = (value, decimals = 18) => {
    const amount = parseFloat(value) / Math.pow(10, decimals)
    return amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 4 
    })
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const txTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now - txTime) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Transactions
        </h3>
        <Link
          to="/transactions"
          className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          View all
        </Link>
      </div>

      {transactionList.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No recent transactions found
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactionList.slice(0, 5).map((tx, index) => (
            <motion.div
              key={tx.hash}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {/* Transaction Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                tx.tokenSymbol === 'BYTE' 
                  ? 'bg-blue-100 dark:bg-blue-900' 
                  : 'bg-purple-100 dark:bg-purple-900'
              }`}>
                <div className={`w-4 h-4 rounded-full ${
                  tx.tokenSymbol === 'BYTE' ? 'bg-blue-500' : 'bg-purple-500'
                }`} />
              </div>

              {/* Transaction Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {tx.tokenSymbol}
                  </p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    tx.transactionType === 'incoming'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {tx.transactionType === 'incoming' ? 'Received' : 'Sent'}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <a
                    href={`https://basescan.org/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-mono"
                  >
                    {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                  </a>
                  <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(tx.timestamp)}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div className="flex-shrink-0 text-right">
                <p className={`text-sm font-medium ${
                  tx.transactionType === 'incoming'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {tx.transactionType === 'incoming' ? '+' : '-'}{tx.valueFormatted?.toFixed(4) || '0.0000'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {tx.tokenSymbol}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {transactionList.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/transactions"
            className="block w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 py-2"
          >
            View {transactionList.length - 5} more transactions
          </Link>
        </div>
      )}
    </motion.div>
  )
}