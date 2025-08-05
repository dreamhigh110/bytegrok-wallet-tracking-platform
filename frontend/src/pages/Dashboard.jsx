import React from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'

import { apiService } from '../services/api'
import { useSocket, useWalletUpdates } from '../hooks/useSocket'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import StatsCard from '../components/Dashboard/StatsCard'
import RecentTransactions from '../components/Dashboard/RecentTransactions'
import BalanceChart from '../components/Dashboard/BalanceChart'
import FeeCollectionChart from '../components/Dashboard/FeeCollectionChart'

const Dashboard = () => {
  const queryClient = useQueryClient()

  // Fetch dashboard data
  const { 
    data: walletStats, 
    isLoading: statsLoading, 
    refetch: refetchStats 
  } = useQuery(
    'wallet-stats',
    apiService.getWalletStats,
    { refetchInterval: 60000 }
  )

  const { 
    data: recentTxs, 
    isLoading: txsLoading,
    refetch: refetchTxs 
  } = useQuery(
    'recent-transactions',
    () => apiService.transactions.getRecent({ limit: 10 }),
    { refetchInterval: 30000 }
  )

  const { 
    data: summary, 
    isLoading: summaryLoading 
  } = useQuery(
    'transaction-summary',
    () => apiService.getAnalytics('24h'),
    { refetchInterval: 60000 }
  )

  const { 
    data: balanceHistory, 
    isLoading: balanceLoading 
  } = useQuery(
    'balance-history',
    () => apiService.analytics.getBalanceHistory({ period: '7d' }),
    { refetchInterval: 120000 } // Refresh every 2 minutes
  )

  const { 
    data: feeCollectionData, 
    isLoading: feeLoading 
  } = useQuery(
    'fee-collection-data',
    () => apiService.analytics.getTimeline({ period: '7d' }),
    { refetchInterval: 120000 } // Refresh every 2 minutes
  )

  // Listen for real-time updates via WebSocket
  const { isConnected } = useSocket()
  
  // Handle wallet stats updates from WebSocket
  useWalletUpdates((updatedStats) => {
    console.log('Received wallet stats update:', updatedStats)
    // Update the React Query cache with fresh data
    // WebSocket sends raw wallet stats, but API wraps in { success: true, data: ... }
    queryClient.setQueryData('wallet-stats', { 
      success: true, 
      data: {
        byteStats: {
          currentBalanceFormatted: updatedStats.byteBalance || 0,
          totalFeesCollectedFormatted: updatedStats.totalByteCollected || 0
        },
        wethStats: {
          currentBalanceFormatted: updatedStats.wethBalance || 0,
          totalFeesCollectedFormatted: updatedStats.totalWethCollected || 0
        },
        totalTransactions: updatedStats.totalTransactions || 0
      }
    })
  })
  
  // Refetch transactions when connected
  React.useEffect(() => {
    if (isConnected) {
      refetchTxs()
    }
  }, [isConnected, refetchTxs])

  const isLoading = statsLoading || txsLoading || summaryLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <StatsCard key={i} loading={true} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BalanceChart loading={true} />
          <FeeCollectionChart loading={true} />
        </div>
        <RecentTransactions loading={true} />
      </div>
    )
  }

  // Calculate stats for cards (using real data from API/socket)
  const byteBalance = walletStats?.data?.byteStats?.currentBalanceFormatted || 0
  const wethBalance = walletStats?.data?.wethStats?.currentBalanceFormatted || 0
  const totalTransactions = walletStats?.data?.totalTransactions || 0
  const totalByteCollected = walletStats?.data?.byteStats?.totalFeesCollectedFormatted || 0

  const walletIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )

  const trendingIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )

  const clockIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )

  const dollarIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  )

  const stats = [
    {
      title: 'BYTE Balance',
      value: byteBalance.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      icon: walletIcon,
      color: 'blue',
      change: null, // Real-time data, no change calculation yet
      changeType: 'neutral'
    },
    {
      title: 'WETH Balance',
      value: wethBalance.toFixed(4),
      icon: dollarIcon,
      color: 'purple',
      change: null,
      changeType: 'neutral'
    },
    {
      title: 'Total Transactions',
      value: totalTransactions.toLocaleString(),
      icon: trendingIcon,
      color: 'green',
      change: null,
      changeType: 'neutral'
    },
    {
      title: 'BYTE Collected',
      value: totalByteCollected.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      icon: clockIcon,
      color: 'orange',
      change: null,
      changeType: 'neutral'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor BYTE token and WETH fee collections in real-time
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live monitoring active</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <BalanceChart 
            data={balanceHistory?.data?.history || []}
            loading={balanceLoading}
            timeRange="7d"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <FeeCollectionChart 
            data={feeCollectionData?.data?.timeline || []}
            loading={feeLoading}
            timeRange="7d"
          />
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <RecentTransactions 
          transactions={recentTxs?.data || []}
          loading={txsLoading}
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="card"
      >
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Quick Actions
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button 
            onClick={() => window.location.href = '/transactions'}
            className="btn-primary text-center"
          >
            View All Transactions
          </button>
          <button 
            onClick={() => window.location.href = '/analytics'}
            className="btn-secondary text-center"
          >
            View Analytics
          </button>
          <button 
            onClick={() => window.location.href = '/wallet'}
            className="btn-secondary text-center"
          >
            Wallet Details
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Dashboard