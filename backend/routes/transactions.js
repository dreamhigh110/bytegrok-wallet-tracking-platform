const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { ethers } = require('ethers');

// GET /api/transactions - Get all transactions with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      tokenSymbol,
      transactionType,
      isFeeCollection,
      startDate,
      endDate,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    // Build query object
    const query = {};
    
    if (tokenSymbol) {
      query.tokenSymbol = tokenSymbol.toUpperCase();
    }
    
    if (transactionType) {
      query.transactionType = transactionType;
    }
    
    if (isFeeCollection !== undefined) {
      query.isFeeCollection = isFeeCollection === 'true';
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Transaction.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTransactions: total,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions',
      message: error.message
    });
  }
});

// GET /api/transactions/recent - Get recent transactions
router.get('/recent', async (req, res) => {
  try {
    const { limit = 10, tokenSymbol } = req.query;
    
    const query = {};
    if (tokenSymbol) {
      query.tokenSymbol = tokenSymbol.toUpperCase();
    }

    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent transactions',
      message: error.message
    });
  }
});

// GET /api/transactions/fees - Get fee collection transactions
router.get('/fees', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      tokenSymbol,
      startDate,
      endDate
    } = req.query;

    const query = { isFeeCollection: true };
    
    if (tokenSymbol) {
      query.tokenSymbol = tokenSymbol.toUpperCase();
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [feeTransactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Transaction.countDocuments(query)
    ]);

    // Calculate total fees collected
    const feeStats = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$tokenSymbol',
          totalFees: { $sum: '$valueFormatted' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        feeTransactions,
        feeStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalTransactions: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching fee transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fee transactions',
      message: error.message
    });
  }
});

// GET /api/transactions/summary - Get transaction summary statistics
router.get('/summary', async (req, res) => {
  try {
    const { tokenSymbol, period = '24h' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
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
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const query = { timestamp: { $gte: startDate } };
    if (tokenSymbol) {
      query.tokenSymbol = tokenSymbol.toUpperCase();
    }

    const [summary] = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalValue: { $sum: '$valueFormatted' },
          totalFees: {
            $sum: {
              $cond: [{ $eq: ['$isFeeCollection', true] }, '$valueFormatted', 0]
            }
          },
          feeCollections: {
            $sum: {
              $cond: [{ $eq: ['$isFeeCollection', true] }, 1, 0]
            }
          },
          incomingTransactions: {
            $sum: {
              $cond: [{ $eq: ['$transactionType', 'incoming'] }, 1, 0]
            }
          },
          outgoingTransactions: {
            $sum: {
              $cond: [{ $eq: ['$transactionType', 'outgoing'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get token-specific breakdown
    const tokenBreakdown = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$tokenSymbol',
          transactions: { $sum: 1 },
          totalValue: { $sum: '$valueFormatted' },
          fees: {
            $sum: {
              $cond: [{ $eq: ['$isFeeCollection', true] }, '$valueFormatted', 0]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        summary: summary || {
          totalTransactions: 0,
          totalValue: 0,
          totalFees: 0,
          feeCollections: 0,
          incomingTransactions: 0,
          outgoingTransactions: 0
        },
        tokenBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching transaction summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction summary',
      message: error.message
    });
  }
});

// GET /api/transactions/:hash - Get specific transaction details
router.get('/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    const transaction = await Transaction.findOne({ hash }).lean();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction',
      message: error.message
    });
  }
});

// GET /api/transactions/address/:address - Get transactions for specific address
router.get('/address/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 20, tokenSymbol } = req.query;

    // Validate address format
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    const query = {
      $or: [
        { from: address },
        { to: address }
      ]
    };

    if (tokenSymbol) {
      query.tokenSymbol = tokenSymbol.toUpperCase();
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Transaction.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        address,
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalTransactions: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching address transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch address transactions',
      message: error.message
    });
  }
});

module.exports = router;