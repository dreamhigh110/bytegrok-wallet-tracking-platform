const express = require('express');
const router = express.Router();
const WalletStats = require('../models/WalletStats');
const BlockchainService = require('../services/blockchainService');
const { ethers } = require('ethers');

// Initialize blockchain service
const blockchainService = new BlockchainService();

// GET /api/wallet/stats - Get wallet statistics
router.get('/stats', async (req, res) => {
  try {
    const targetWallet = process.env.TARGET_WALLET;
    
    let stats = await WalletStats.findOne({ walletAddress: targetWallet });
    
    if (!stats) {
      // Create initial stats if doesn't exist
      stats = new WalletStats({ walletAddress: targetWallet });
      await stats.save();
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching wallet stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet stats',
      message: error.message
    });
  }
});

// GET /api/wallet/balances - Get current token balances
router.get('/balances', async (req, res) => {
  try {
    const targetWallet = process.env.TARGET_WALLET;
    
    // Get current balances from blockchain
    const [byteBalance, wethBalance] = await Promise.all([
      blockchainService.getTokenBalance(process.env.BYTE_TOKEN_CONTRACT, targetWallet),
      blockchainService.getTokenBalance(process.env.WETH_CONTRACT, targetWallet)
    ]);

    // Get gas price for reference
    const gasPrice = await blockchainService.getGasPrice();

    res.json({
      success: true,
      data: {
        walletAddress: targetWallet,
        balances: {
          BYTE: {
            raw: byteBalance.raw,
            formatted: byteBalance.formatted,
            decimals: byteBalance.decimals,
            symbol: byteBalance.symbol
          },
          WETH: {
            raw: wethBalance.raw,
            formatted: wethBalance.formatted,
            decimals: wethBalance.decimals,
            symbol: wethBalance.symbol
          }
        },
        gasPrice,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching wallet balances:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet balances',
      message: error.message
    });
  }
});

// GET /api/wallet/balance/:token - Get balance for specific token
router.get('/balance/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { address } = req.query;
    
    const walletAddress = address || process.env.TARGET_WALLET;
    
    // Validate address format
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }

    let tokenContract;
    switch (token.toUpperCase()) {
      case 'BYTE':
        tokenContract = process.env.BYTE_TOKEN_CONTRACT;
        break;
      case 'WETH':
        tokenContract = process.env.WETH_CONTRACT;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported token. Supported tokens: BYTE, WETH'
        });
    }

    const balance = await blockchainService.getTokenBalance(tokenContract, walletAddress);

    res.json({
      success: true,
      data: {
        walletAddress,
        token: token.toUpperCase(),
        balance
      }
    });
  } catch (error) {
    console.error('Error fetching token balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token balance',
      message: error.message
    });
  }
});

// POST /api/wallet/recalculate-stats - Recalculate wallet statistics
router.post('/recalculate-stats', async (req, res) => {
  try {
    const targetWallet = process.env.TARGET_WALLET;
    
    // Recalculate stats from all transactions
    const stats = await WalletStats.recalculateStats(targetWallet);
    
    res.json({
      success: true,
      message: 'Wallet statistics recalculated successfully',
      data: stats
    });
  } catch (error) {
    console.error('Error recalculating wallet stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to recalculate wallet stats',
      message: error.message
    });
  }
});

// GET /api/wallet/daily-stats - Get daily statistics
router.get('/daily-stats', async (req, res) => {
  try {
    const { startDate, endDate, days = 30 } = req.query;
    const targetWallet = process.env.TARGET_WALLET;
    
    let stats = await WalletStats.findOne({ walletAddress: targetWallet });
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Wallet stats not found'
      });
    }

    let dailyStats;
    
    if (startDate && endDate) {
      // Get stats for specific date range
      dailyStats = stats.getDailyStats(new Date(startDate), new Date(endDate));
    } else {
      // Get last N days
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (parseInt(days) * 24 * 60 * 60 * 1000));
      dailyStats = stats.getDailyStats(startDate, endDate);
    }

    res.json({
      success: true,
      data: {
        walletAddress: targetWallet,
        dailyStats,
        period: {
          startDate: startDate || new Date(Date.now() - (parseInt(days) * 24 * 60 * 60 * 1000)),
          endDate: endDate || new Date(),
          days: parseInt(days)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch daily stats',
      message: error.message
    });
  }
});

// GET /api/wallet/performance - Get wallet performance metrics
router.get('/performance', async (req, res) => {
  try {
    const targetWallet = process.env.TARGET_WALLET;
    
    const stats = await WalletStats.findOne({ walletAddress: targetWallet });
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Wallet stats not found'
      });
    }

    // Calculate additional performance metrics
    const totalDays = stats.firstTransactionDate && stats.lastTransactionDate 
      ? Math.ceil((stats.lastTransactionDate - stats.firstTransactionDate) / (1000 * 60 * 60 * 24))
      : 0;

    const avgTransactionsPerDay = totalDays > 0 ? stats.totalTransactions / totalDays : 0;
    const avgFeesPerDay = totalDays > 0 ? stats.totalFeeCollections / totalDays : 0;

    // Calculate fee collection efficiency
    const byteEfficiency = stats.byteStats.transactionCount > 0 
      ? (stats.byteStats.feeCollectionCount / stats.byteStats.transactionCount) * 100 
      : 0;
    
    const wethEfficiency = stats.wethStats.transactionCount > 0 
      ? (stats.wethStats.feeCollectionCount / stats.wethStats.transactionCount) * 100 
      : 0;

    const performance = {
      totalDays,
      avgTransactionsPerDay,
      avgFeesPerDay,
      avgCollectionInterval: stats.averageCollectionInterval,
      feeCollectionEfficiency: {
        byte: byteEfficiency,
        weth: wethEfficiency,
        overall: stats.totalTransactions > 0 ? (stats.totalFeeCollections / stats.totalTransactions) * 100 : 0
      },
      avgFeeSize: stats.averageFeeSize,
      avgTransactionGas: stats.averageTransactionGas
    };

    res.json({
      success: true,
      data: {
        walletAddress: targetWallet,
        performance,
        stats: {
          firstTransaction: stats.firstTransactionDate,
          lastTransaction: stats.lastTransactionDate,
          lastUpdated: stats.lastUpdated
        }
      }
    });
  } catch (error) {
    console.error('Error fetching wallet performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet performance',
      message: error.message
    });
  }
});

// GET /api/wallet/info/:address - Get information about any wallet address
router.get('/info/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Validate address format
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }

    // Get token balances for this address
    const [byteBalance, wethBalance] = await Promise.all([
      blockchainService.getTokenBalance(process.env.BYTE_TOKEN_CONTRACT, address).catch(() => null),
      blockchainService.getTokenBalance(process.env.WETH_CONTRACT, address).catch(() => null)
    ]);

    // Check if we have stats for this wallet
    let stats = await WalletStats.findOne({ walletAddress: address });

    res.json({
      success: true,
      data: {
        address,
        balances: {
          BYTE: byteBalance,
          WETH: wethBalance
        },
        hasStats: !!stats,
        stats: stats || null,
        isTrackedWallet: address.toLowerCase() === process.env.TARGET_WALLET.toLowerCase()
      }
    });
  } catch (error) {
    console.error('Error fetching wallet info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet info',
      message: error.message
    });
  }
});

module.exports = router;