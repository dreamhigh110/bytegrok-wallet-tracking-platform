import React from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function BalanceChart({ data = [], loading = false, timeRange = '7d' }) {
  // Mock data for demonstration
  const mockData = [
    { date: '2024-01-01', byte: 1200, weth: 0.45 },
    { date: '2024-01-02', byte: 1350, weth: 0.52 },
    { date: '2024-01-03', byte: 1180, weth: 0.48 },
    { date: '2024-01-04', byte: 1450, weth: 0.55 },
    { date: '2024-01-05', byte: 1320, weth: 0.51 },
    { date: '2024-01-06', byte: 1580, weth: 0.58 },
    { date: '2024-01-07', byte: 1650, weth: 0.62 },
  ]

  const chartData = data.length > 0 ? data : mockData

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {new Date(label).toLocaleDateString()}
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {entry.dataKey.toUpperCase()}: {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
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
          Balance History
        </h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-300">BYTE</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-300">WETH</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
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
              yAxisId="byte"
              orientation="left"
              stroke="#6B7280" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <YAxis 
              yAxisId="weth"
              orientation="right"
              stroke="#6B7280" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toFixed(2)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              yAxisId="byte"
              type="monotone" 
              dataKey="byte" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
            />
            <Line 
              yAxisId="weth"
              type="monotone" 
              dataKey="weth" 
              stroke="#8B5CF6" 
              strokeWidth={2}
              dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Current BYTE</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {chartData[chartData.length - 1]?.byte?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Current WETH</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {chartData[chartData.length - 1]?.weth?.toFixed(4) || '0.0000'}
          </p>
        </div>
      </div>
    </motion.div>
  )
}