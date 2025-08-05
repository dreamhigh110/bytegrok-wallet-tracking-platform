import React from 'react'

export default function Footer({ appStatus }) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          {/* Left side - Copyright */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            © {currentYear} BYTE Wallet Tracker. Built for Base Chain.
          </div>

          {/* Right side - Status and links */}
          <div className="flex items-center space-x-4 text-sm">
            {/* App status */}
            {appStatus && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-600 dark:text-gray-400">
                  API Online
                </span>
              </div>
            )}

            {/* Links */}
            <div className="flex items-center space-x-3">
              <a
                href="https://basescan.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
              >
                BaseScan
              </a>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <a
                href="https://base.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
              >
                Base Network
              </a>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="text-gray-500 dark:text-gray-400 font-mono text-xs">
                v1.0.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}