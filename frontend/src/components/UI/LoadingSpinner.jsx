import React from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary',
  className = '',
  text = null,
  overlay = false 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const colorClasses = {
    primary: 'border-primary-600',
    secondary: 'border-secondary-600',
    accent: 'border-accent-600',
    gray: 'border-gray-600',
    white: 'border-white'
  }

  const spinner = (
    <div className={clsx(
      'flex flex-col items-center justify-center',
      overlay && 'absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50',
      className
    )}>
      <motion.div
        className={clsx(
          'border-2 border-t-transparent rounded-full',
          sizeClasses[size],
          colorClasses[color]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-2 text-sm text-gray-600 dark:text-gray-400"
        >
          {text}
        </motion.p>
      )}
    </div>
  )

  return spinner
}

export const LoadingDots = ({ className = '' }) => (
  <div className={clsx('flex space-x-1', className)}>
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 bg-current rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.5, 1]
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: i * 0.2
        }}
      />
    ))}
  </div>
)

export const LoadingPulse = ({ className = '', children }) => (
  <motion.div
    className={clsx('animate-pulse', className)}
    animate={{
      opacity: [1, 0.5, 1]
    }}
    transition={{
      duration: 1.5,
      repeat: Infinity
    }}
  >
    {children}
  </motion.div>
)

export const LoadingSkeleton = ({ 
  lines = 3, 
  className = '',
  animate = true 
}) => (
  <div className={clsx('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <motion.div
        key={i}
        className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
        style={{ width: `${Math.random() * 40 + 60}%` }}
        animate={animate ? {
          opacity: [1, 0.5, 1]
        } : {}}
        transition={animate ? {
          duration: 1.5,
          repeat: Infinity,
          delay: i * 0.1
        } : {}}
      />
    ))}
  </div>
)

export default LoadingSpinner