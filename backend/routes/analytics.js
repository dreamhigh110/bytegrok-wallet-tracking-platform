const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const WalletStats = require('../models/WalletStats');

// GET /api/analytics/overview - Get analytics overview
router.get('/overview', async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get transaction counts and values
    const [byteStats, wethStats, recentActivity] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            tokenSymbol: 'BYTE',
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalValue: { $sum: '$valueFormatted' },
            feeCollections: {
              $sum: { $cond: [{ $eq: ['$isFeeCollection', true] }, 1, 0] }
            },
            totalFees: {
              $sum: { $cond: [{ $eq: ['$isFeeCollection', true] }, '$valueFormatted', 0] }
            }
          }
        }
      ]),
      Transaction.aggregate([
        {
          $match: {
            tokenSymbol: 'WETH',
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalValue: { $sum: '$valueFormatted' },
            feeCollections: {
              $sum: { $cond: [{ $eq: ['$isFeeCollection', true] }, 1, 0] }
            },
            totalFees: {
              $sum: { $cond: [{ $eq: ['$isFeeCollection', true] }, '$valueFormatted', 0] }
            }
          }
        }
      ]),
      Transaction.find({
        timestamp: { $gte: startDate }
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean()
    ]);

    res.json({
      success: true,
      data: {
        period,
        overview: {
          BYTE: byteStats[0] || {
            totalTransactions: 0,
            totalValue: 0,
            feeCollections: 0,
            totalFees: 0
          },
          WETH: wethStats[0] || {
            totalTransactions: 0,
            totalValue: 0,
            feeCollections: 0,
            totalFees: 0
          }
        },
        recentActivity,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics overview',
      message: error.message
    });
  }
});

// GET /api/analytics/timeline - Get transaction timeline data
router.get('/timeline', async (req, res) => {
  try {
    const { 
      period = '7d', 
      interval = 'hour',
      tokenSymbol 
    } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate, groupBy;
    
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        groupBy = interval === 'minute' ? {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' },
          minute: { $minute: '$timestamp' }
        } : {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' }
        };
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        };
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        };
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        };
    }

    const matchQuery = {
      timestamp: { $gte: startDate }
    };

    if (tokenSymbol) {
      matchQuery.tokenSymbol = tokenSymbol.toUpperCase();
    }

    const timeline = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupBy,
          transactions: { $sum: 1 },
          totalValue: { $sum: '$valueFormatted' },
          feeCollections: {
            $sum: { $cond: [{ $eq: ['$isFeeCollection', true] }, 1, 0] }
          },
          totalFees: {
            $sum: { $cond: [{ $eq: ['$isFeeCollection', true] }, '$valueFormatted', 0] }
          },
          byteTransactions: {
            $sum: { $cond: [{ $eq: ['$tokenSymbol', 'BYTE'] }, 1, 0] }
          },
          wethTransactions: {
            $sum: { $cond: [{ $eq: ['$tokenSymbol', 'WETH'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1, '_id.minute': 1 } }
    ]);

    // Format timeline data for frontend
    const formattedTimeline = timeline.map(item => {
      let date;
      if (item._id.minute !== undefined) {
        date = new Date(item._id.year, item._id.month - 1, item._id.day, item._id.hour, item._id.minute);
      } else if (item._id.hour !== undefined) {
        date = new Date(item._id.year, item._id.month - 1, item._id.day, item._id.hour);
      } else {
        date = new Date(item._id.year, item._id.month - 1, item._id.day);
      }

      return {
        timestamp: date.toISOString(),
        date: date.toISOString().split('T')[0],
        ...item,
        _id: undefined
      };
    });

    res.json({
      success: true,
      data: {
        period,
        interval,
        timeline: formattedTimeline,
        summary: {
          totalDataPoints: formattedTimeline.length,
          dateRange: {
            start: startDate.toISOString(),
            end: now.toISOString()
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching timeline analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch timeline analytics',
      message: error.message
    });
  }
});

// GET /api/analytics/fee-analysis - Analyze fee collection patterns
router.get('/fee-analysis', async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get fee collection analysis
    const [feeDistribution, avgFeeSize, feeFrequency, topFeeCollections] = await Promise.all([
      // Fee distribution by token
      Transaction.aggregate([
        {
          $match: {
            isFeeCollection: true,
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$tokenSymbol',
            count: { $sum: 1 },
            totalFees: { $sum: '$valueFormatted' },
            avgFee: { $avg: '$valueFormatted' },
            minFee: { $min: '$valueFormatted' },
            maxFee: { $max: '$valueFormatted' }
          }
        }
      ]),

      // Average fee size over time
      Transaction.aggregate([
        {
          $match: {
            isFeeCollection: true,
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              token: '$tokenSymbol',
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$timestamp'
                }
              }
            },
            avgFee: { $avg: '$valueFormatted' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]),

      // Fee collection frequency analysis
      Transaction.aggregate([
        {
          $match: {
            isFeeCollection: true,
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$timestamp'
              }
            },
            feeCollections: { $sum: 1 },
            totalFees: { $sum: '$valueFormatted' }
          }
        },
        { $sort: { '_id': 1 } }
      ]),

      // Top fee collections
      Transaction.find({
        isFeeCollection: true,
        timestamp: { $gte: startDate }
      })
      .sort({ valueFormatted: -1 })
      .limit(10)
      .lean()
    ]);

    // Calculate fee collection intervals
    const feeCollections = await Transaction.find({
      isFeeCollection: true,
      timestamp: { $gte: startDate }
    })
    .sort({ timestamp: 1 })
    .lean();

    const intervals = [];
    for (let i = 1; i < feeCollections.length; i++) {
      const interval = (feeCollections[i].timestamp - feeCollections[i-1].timestamp) / (1000 * 60); // minutes
      intervals.push(interval);
    }

    const avgInterval = intervals.length > 0 
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length 
      : 0;

    res.json({
      success: true,
      data: {
        period,
        feeDistribution,
        avgFeeSize,
        feeFrequency,
        topFeeCollections,
        intervals: {
          average: avgInterval,
          min: intervals.length > 0 ? Math.min(...intervals) : 0,
          max: intervals.length > 0 ? Math.max(...intervals) : 0,
          count: intervals.length
        },
        summary: {
          totalFeeCollections: feeCollections.length,
          dateRange: {
            start: startDate.toISOString(),
            end: now.toISOString()
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching fee analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fee analysis',
      message: error.message
    });
  }
});

// GET /api/analytics/comparison - Compare different periods
router.get('/comparison', async (req, res) => {
  try {
    const { tokenSymbol } = req.query;

    const now = new Date();
    const periods = {
      current24h: {
        start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        end: now
      },
      previous24h: {
        start: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        end: new Date(now.getTime() - 24 * 60 * 60 * 1000)
      },
      current7d: {
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: now
      },
      previous7d: {
        start: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        end: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      }
    };

    const results = {};

    for (const [periodName, { start, end }] of Object.entries(periods)) {
      const query = {
        timestamp: { $gte: start, $lte: end }
      };

      if (tokenSymbol) {
        query.tokenSymbol = tokenSymbol.toUpperCase();
      }

      const [stats] = await Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalValue: { $sum: '$valueFormatted' },
            feeCollections: {
              $sum: { $cond: [{ $eq: ['$isFeeCollection', true] }, 1, 0] }
            },
            totalFees: {
              $sum: { $cond: [{ $eq: ['$isFeeCollection', true] }, '$valueFormatted', 0] }
            },
            avgTransactionValue: { $avg: '$valueFormatted' }
          }
        }
      ]);

      results[periodName] = stats || {
        totalTransactions: 0,
        totalValue: 0,
        feeCollections: 0,
        totalFees: 0,
        avgTransactionValue: 0
      };
    }

    // Calculate percentage changes
    const changes = {
      transactions24h: results.current24h.totalTransactions > 0 && results.previous24h.totalTransactions > 0
        ? ((results.current24h.totalTransactions - results.previous24h.totalTransactions) / results.previous24h.totalTransactions) * 100
        : 0,
      fees24h: results.current24h.totalFees > 0 && results.previous24h.totalFees > 0
        ? ((results.current24h.totalFees - results.previous24h.totalFees) / results.previous24h.totalFees) * 100
        : 0,
      transactions7d: results.current7d.totalTransactions > 0 && results.previous7d.totalTransactions > 0
        ? ((results.current7d.totalTransactions - results.previous7d.totalTransactions) / results.previous7d.totalTransactions) * 100
        : 0,
      fees7d: results.current7d.totalFees > 0 && results.previous7d.totalFees > 0
        ? ((results.current7d.totalFees - results.previous7d.totalFees) / results.previous7d.totalFees) * 100
        : 0
    };

    res.json({
      success: true,
      data: {
        periods: results,
        changes,
        tokenSymbol: tokenSymbol || 'ALL'
      }
    });
  } catch (error) {
    console.error('Error fetching comparison analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comparison analytics',
      message: error.message
    });
  }
});

// GET /api/analytics/export - Export analytics data
router.get('/export', async (req, res) => {
  try {
    const { 
      format = 'json',
      period = '30d',
      tokenSymbol,
      includeRawData = false
    } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const query = {
      timestamp: { $gte: startDate }
    };

    if (tokenSymbol) {
      query.tokenSymbol = tokenSymbol.toUpperCase();
    }

    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .lean();

    const exportData = {
      exportDate: new Date().toISOString(),
      period,
      tokenSymbol: tokenSymbol || 'ALL',
      totalTransactions: transactions.length,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      transactions: includeRawData === 'true' ? transactions : transactions.map(tx => ({
        hash: tx.hash,
        timestamp: tx.timestamp,
        tokenSymbol: tx.tokenSymbol,
        from: tx.from,
        to: tx.to,
        valueFormatted: tx.valueFormatted,
        isFeeCollection: tx.isFeeCollection,
        transactionType: tx.transactionType
      }))
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(exportData.transactions);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="byte-tracker-${period}-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      if (format === 'download') {
        res.setHeader('Content-Disposition', `attachment; filename="byte-tracker-${period}-${Date.now()}.json"`);
      }
      res.json({
        success: true,
        data: exportData
      });
    }
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics data',
      message: error.message
    });
  }
});

// GET /api/analytics/balance-history - Get balance history over time
router.get('/balance-history', async (req, res) => {
  try {
    const { period = '7d', interval = 'day' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate, groupBy;
    
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' }
        };
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        };
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        };
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        };
    }

    // Get all transactions for the target wallet, sorted by timestamp
    const TARGET_WALLET = process.env.TARGET_WALLET;
    const transactions = await Transaction.find({
      $or: [
        { from: TARGET_WALLET.toLowerCase() },
        { to: TARGET_WALLET.toLowerCase() }
      ],
      timestamp: { $gte: startDate },
      $or: [
        { tokenSymbol: 'BYTE' },
        { tokenSymbol: 'WETH' }
      ]
    }).sort({ timestamp: 1 }).lean();

    // Calculate running balance for each day
    const balanceHistory = [];
    let byteBalance = 0;
    let wethBalance = 0;
    
    // Group transactions by time period
    const grouped = {};
    
    transactions.forEach(tx => {
      const date = new Date(tx.timestamp);
      let key;
      
      if (period === '24h') {
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
      } else {
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      }
      
      if (!grouped[key]) {
        grouped[key] = { transactions: [], date };
      }
      grouped[key].transactions.push(tx);
    });

    // Process each time period
    const sortedKeys = Object.keys(grouped).sort();
    
    for (const key of sortedKeys) {
      const { transactions: periodTxs, date } = grouped[key];
      
      // Process transactions in this period
      periodTxs.forEach(tx => {
        const isIncoming = tx.to.toLowerCase() === TARGET_WALLET.toLowerCase();
        const value = tx.valueFormatted;
        
        if (tx.tokenSymbol === 'BYTE') {
          byteBalance += isIncoming ? value : -value;
        } else if (tx.tokenSymbol === 'WETH') {
          wethBalance += isIncoming ? value : -value;
        }
      });
      
      balanceHistory.push({
        date: date.toISOString().split('T')[0],
        timestamp: date.toISOString(),
        byte: Math.max(0, byteBalance), // Ensure non-negative
        weth: Math.max(0, wethBalance), // Ensure non-negative
        transactions: periodTxs.length
      });
    }

    // If no data, create at least current point
    if (balanceHistory.length === 0) {
      const walletStats = await require('../models/WalletStats').findOne({ 
        walletAddress: TARGET_WALLET 
      });
      
      balanceHistory.push({
        date: now.toISOString().split('T')[0],
        timestamp: now.toISOString(),
        byte: walletStats?.byteBalance || 0,
        weth: walletStats?.wethBalance || 0,
        transactions: 0
      });
    }

    res.json({
      success: true,
      data: {
        period,
        interval,
        history: balanceHistory,
        summary: {
          dataPoints: balanceHistory.length,
          currentBalance: {
            byte: balanceHistory[balanceHistory.length - 1]?.byte || 0,
            weth: balanceHistory[balanceHistory.length - 1]?.weth || 0
          },
          dateRange: {
            start: startDate.toISOString(),
            end: now.toISOString()
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching balance history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch balance history',
      message: error.message
    });
  }
});

// Helper function to convert JSON to CSV
function convertToCSV(transactions) {
  if (transactions.length === 0) return '';

  const headers = Object.keys(transactions[0]).join(',');
  const rows = transactions.map(tx => 
    Object.values(tx).map(value => 
      typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value
    ).join(',')
  );

  return [headers, ...rows].join('\n');
}

module.exports = router;