import React from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function FeeCollectionChart({ data = [], loading = false, timeRange = '7d' }) {
  // Transform timeline data to chart format
  const transformData = (timelineData) => {
    return timelineData.map(item => ({
      date: item.date || item.timestamp,
      fees: item.totalFees || 0,
      transactions: item.feeCollections || 0
    }))
  }

  const chartData = data.length > 0 ? transformData(data) : []
  const hasData = chartData.length > 0 && chartData.some(item => item.fees > 0 || item.transactions > 0)

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    )
  }

  // Show "no data" state when there are no fee collections
  if (!hasData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Fee Collection
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full" />
            <span className="text-sm text-gray-600 dark:text-gray-300">No Data</span>
          </div>
        </div>

        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Fee Collections Yet
            </h4>
            <p className="text-gray-600 dark:text-gray-400 max-w-sm">
              Fee collection data will appear here once transactions start being processed and fees are collected.
            </p>
          </div>
        </div>

        {/* Summary Stats - All zeros */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Fees</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">0.0000</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total TXs</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">0</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Fee/TX</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">0.0000</p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-4 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-gray-600 dark:text-gray-300">
              Waiting for fee collections
            </span>
          </div>
        </div>
      </motion.div>
    )
  }

  const totalFees = chartData.reduce((sum, item) => sum + item.fees, 0)
  const totalTransactions = chartData.reduce((sum, item) => sum + item.transactions, 0)
  const avgFeePerTx = totalTransactions > 0 ? totalFees / totalTransactions : 0

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {new Date(label).toLocaleDateString()}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">Fees Collected:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {data.fees.toFixed(4)} tokens
              </span>
            </div>
            <div className="flex items-center justify-between space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">Transactions:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {data.transactions}
              </span>
            </div>
            <div className="flex items-center justify-between space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">Avg per TX:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {data.transactions > 0 ? (data.fees / data.transactions).toFixed(4) : '0.0000'} tokens
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Fee Collection
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="text-sm text-gray-600 dark:text-gray-300">Daily Fees</span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              opacity={0.3}
            />
            <XAxis 
              dataKey="date" 
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              stroke="#6B7280" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toFixed(2)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="fees" 
              fill="#10B981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Fees</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {totalFees.toFixed(4)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total TXs</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {totalTransactions}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg Fee/TX</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {avgFeePerTx.toFixed(4)}
          </p>
        </div>
      </div>

      {/* Performance Indicator */}
      <div className="mt-4 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-gray-600 dark:text-gray-300">
            Active fee collection
          </span>
        </div>
      </div>
    </motion.div>
  )
}