import React, { useState, useMemo } from 'react'
import { useQuery } from 'react-query'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { motion } from 'framer-motion'
import { apiService } from '../services/api'
import LoadingSpinner from '../components/UI/LoadingSpinner'

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B']

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7d') // 24h, 7d, 30d, 90d

  const { data: analytics, isLoading, error } = useQuery(
    ['analytics', timeRange],
    () => apiService.analytics.getOverview({ period: timeRange }),
    {
      refetchInterval: 60000, // Refetch every minute
    }
  )

  const { data: timeline, isLoading: timelineLoading } = useQuery(
    ['analytics-timeline', timeRange],
    () => apiService.analytics.getTimeline({ period: timeRange }),
    {
      refetchInterval: 120000, // Refetch every 2 minutes
    }
  )

  const { data: recentTransactions } = useQuery(
    'recent-transactions-analytics',
    () => apiService.transactions.getRecent({ limit: 8 }),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  )

  // Process real data for charts - MOVED BEFORE EARLY RETURNS
  const processedData = useMemo(() => {
    if (!analytics?.data || !timeline?.data) {
      return {
        metrics: { totalTx: 0, byteVolume: 0, wethVolume: 0, activePeriods: 0 },
        trends: [],
        distribution: [],
        volume: [],
        hasData: false
      }
    }

    const { overview } = analytics.data
    const { timeline: timelineData } = timeline.data

    // Calculate metrics
    const totalTx = (overview.BYTE?.totalTransactions || 0) + (overview.WETH?.totalTransactions || 0)
    const byteVolume = overview.BYTE?.totalValue || 0
    const wethVolume = overview.WETH?.totalValue || 0
    const activePeriods = timelineData?.filter(item => item.transactions > 0).length || 0

    // Process timeline for trends
    const trends = timelineData?.map(item => ({
      date: item.date || item.timestamp?.split('T')[0],
      byte: item.byteTransactions || 0,
      weth: item.wethTransactions || 0,
      volume: item.totalValue || 0
    })) || []

    // Calculate token distribution
    const byteCount = overview.BYTE?.totalTransactions || 0
    const wethCount = overview.WETH?.totalTransactions || 0
    const total = byteCount + wethCount
    
    const distribution = total > 0 ? [
      { name: 'BYTE', value: Math.round((byteCount / total) * 100), color: '#3B82F6' },
      { name: 'WETH', value: Math.round((wethCount / total) * 100), color: '#8B5CF6' },
    ] : []

    // Process hourly volume (group timeline by hour if available)
    const volume = trends.length > 0 ? trends.slice(0, 6).map((item, index) => ({
      time: `${String(index * 4).padStart(2, '0')}:00`,
      volume: item.volume
    })) : []

    const hasData = totalTx > 0 || trends.length > 0

    return {
      metrics: { totalTx, byteVolume, wethVolume, activePeriods },
      trends,
      distribution,
      volume,
      hasData
    }
  }, [analytics, timeline])

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
          Failed to load analytics
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {error.message || 'An error occurred while fetching analytics data'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Comprehensive analysis of BYTE and WETH token activities
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mt-4 sm:mt-0">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            {[
              { key: '24h', label: '24H' },
              { key: '7d', label: '7D' },
              { key: '30d', label: '30D' },
              { key: '90d', label: '90D' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setTimeRange(item.key)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  timeRange === item.key
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            title: 'Total Transactions', 
            value: processedData.metrics.totalTx.toLocaleString(), 
            color: 'blue',
            subtext: `${timeRange.toUpperCase()} period`
          },
          { 
            title: 'BYTE Volume', 
            value: processedData.metrics.byteVolume.toFixed(2), 
            color: 'green',
            subtext: 'Total value processed'
          },
          { 
            title: 'WETH Volume', 
            value: processedData.metrics.wethVolume.toFixed(4), 
            color: 'purple',
            subtext: 'Total value processed'
          },
          { 
            title: 'Active Periods', 
            value: `${processedData.metrics.activePeriods}/${timeline?.data?.timeline?.length || 0}`, 
            color: 'orange',
            subtext: 'Periods with activity'
          },
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {metric.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {metric.subtext}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                metric.color === 'blue' ? 'bg-blue-500' :
                metric.color === 'green' ? 'bg-green-500' :
                metric.color === 'purple' ? 'bg-purple-500' : 'bg-orange-500'
              }`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Transaction Trends
          </h3>
          {processedData.trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={processedData.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6B7280"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="byte" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="BYTE"
                />
                <Line 
                  type="monotone" 
                  dataKey="weth" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  name="WETH"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Transaction Data
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Transaction trends will appear here once activity begins
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Token Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Token Distribution
          </h3>
          {processedData.distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={processedData.distribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {processedData.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Distribution Data
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Token distribution will show once transactions are processed
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Volume Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Volume Analysis
          </h3>
          {processedData.volume.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={processedData.volume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  stroke="#6B7280"
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value) => [value.toFixed(4), 'Volume']}
                />
                <Bar dataKey="volume" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Volume Data
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Volume analysis will appear here once transactions occur
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentTransactions?.data && recentTransactions.data.length > 0 ? (
              recentTransactions.data.slice(0, 4).map((tx, index) => (
                <div key={tx.hash} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      tx.tokenSymbol === 'BYTE' ? 'bg-blue-500' : 'bg-purple-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {tx.valueFormatted?.toFixed(4) || '0.0000'} {tx.tokenSymbol}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {tx.transactionType === 'incoming' ? 'received' : 'sent'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString() : 'Unknown'}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  No Recent Activity
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Recent transactions will appear here
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}