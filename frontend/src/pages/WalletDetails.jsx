import React from 'react'
import { useQuery } from 'react-query'
import { motion } from 'framer-motion'
import { apiService } from '../services/api'
import LoadingSpinner from '../components/UI/LoadingSpinner'

export default function WalletDetails() {
  const targetWallet = '0x4fbF8C4C3404e5C093bc17bb57361D1D7384fBDF'

  const { data: walletStats, isLoading, error } = useQuery(
    'wallet-stats',
    apiService.getWalletStats,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Failed to load wallet details
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {error.message || 'An error occurred while fetching wallet information'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Wallet Details
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Detailed information about the tracked wallet and its activities
        </p>
      </div>

      {/* Wallet Address Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tracked Wallet Address
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Active
          </span>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <code className="text-sm font-mono text-gray-900 dark:text-white break-all">
              {targetWallet}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(targetWallet)}
              className="ml-3 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Copy address"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          
          <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <a
              href={`https://basescan.org/address/${targetWallet}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>View on BaseScan</span>
            </a>
          </div>
        </div>
      </motion.div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BYTE Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-500 rounded-full" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                BYTE Balance
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {walletStats?.data?.byteStats?.currentBalanceFormatted ? 
                  walletStats.data.byteStats.currentBalanceFormatted.toLocaleString(undefined, { maximumFractionDigits: 2 })
                  : '0.00'
                }
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Contract: 0x03cE...4354
            </div>
          </div>
        </motion.div>

        {/* WETH Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-purple-500 rounded-full" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                WETH Balance
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {walletStats?.data?.wethStats?.currentBalanceFormatted ? 
                  walletStats.data.wethStats.currentBalanceFormatted.toFixed(4)
                  : '0.0000'
                }
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Contract: 0x4200...0006
            </div>
          </div>
        </motion.div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center"
        >
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {walletStats?.data?.totalTransactions || '0'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Transactions
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center"
        >
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {walletStats?.data?.byteStats?.totalFeesCollectedFormatted ? 
              walletStats.data.byteStats.totalFeesCollectedFormatted.toLocaleString(undefined, { maximumFractionDigits: 0 })
              : '0'
            }
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            BYTE Collected
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center"
        >
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {walletStats?.data?.wethStats?.totalFeesCollectedFormatted ? 
              walletStats.data.wethStats.totalFeesCollectedFormatted.toFixed(2)
              : '0.00'
            }
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            WETH Collected
          </div>
        </motion.div>
      </div>

      {/* Wallet Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Wallet Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              Monitoring Status
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Status:</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Last Block:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {walletStats?.data?.lastBlockMonitored || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Last Update:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {walletStats?.data?.lastUpdated ? 
                  new Date(walletStats.data.lastUpdated).toLocaleString() 
                  : 'Never'
                }
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              Tracked Assets
            </h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm text-gray-600 dark:text-gray-300">BYTE Token</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Wrapped ETH (WETH)</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}