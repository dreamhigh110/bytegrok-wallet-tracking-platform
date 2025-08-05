const mongoose = require('mongoose');

const walletStatsSchema = new mongoose.Schema({
  // Wallet identifier
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Overall statistics
  totalTransactions: {
    type: Number,
    default: 0
  },
  totalFeeCollections: {
    type: Number,
    default: 0
  },
  
  // BYTE token statistics
  byteStats: {
    totalReceived: {
      type: String, // Using string for precision
      default: '0'
    },
    totalReceivedFormatted: {
      type: Number,
      default: 0
    },
    totalSent: {
      type: String,
      default: '0'
    },
    totalSentFormatted: {
      type: Number,
      default: 0
    },
    currentBalance: {
      type: String,
      default: '0'
    },
    currentBalanceFormatted: {
      type: Number,
      default: 0
    },
    transactionCount: {
      type: Number,
      default: 0
    },
    feeCollectionCount: {
      type: Number,
      default: 0
    },
    totalFeesCollected: {
      type: String,
      default: '0'
    },
    totalFeesCollectedFormatted: {
      type: Number,
      default: 0
    }
  },
  
  // WETH statistics
  wethStats: {
    totalReceived: {
      type: String,
      default: '0'
    },
    totalReceivedFormatted: {
      type: Number,
      default: 0
    },
    totalSent: {
      type: String,
      default: '0'
    },
    totalSentFormatted: {
      type: Number,
      default: 0
    },
    currentBalance: {
      type: String,
      default: '0'
    },
    currentBalanceFormatted: {
      type: Number,
      default: 0
    },
    transactionCount: {
      type: Number,
      default: 0
    },
    feeCollectionCount: {
      type: Number,
      default: 0
    },
    totalFeesCollected: {
      type: String,
      default: '0'
    },
    totalFeesCollectedFormatted: {
      type: Number,
      default: 0
    }
  },
  
  // Time-based analytics
  dailyStats: [{
    date: {
      type: Date,
      required: true
    },
    byteTransactions: {
      type: Number,
      default: 0
    },
    wethTransactions: {
      type: Number,
      default: 0
    },
    byteFees: {
      type: Number,
      default: 0
    },
    wethFees: {
      type: Number,
      default: 0
    },
    totalUSDValue: {
      type: Number,
      default: 0
    }
  }],
  
  // First and last transaction dates
  firstTransactionDate: {
    type: Date,
    default: null
  },
  lastTransactionDate: {
    type: Date,
    default: null
  },
  
  // Performance metrics
  averageFeeSize: {
    byte: {
      type: Number,
      default: 0
    },
    weth: {
      type: Number,
      default: 0
    }
  },
  
  averageTransactionGas: {
    type: Number,
    default: 0
  },
  
  // Collection frequency (in minutes)
  averageCollectionInterval: {
    type: Number,
    default: 0
  },
  
  // Last update timestamp
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Method to update stats with new transaction
walletStatsSchema.methods.updateWithTransaction = function(transaction) {
  const tokenSymbol = transaction.tokenSymbol.toLowerCase();
  const isIncoming = transaction.to.toLowerCase() === this.walletAddress.toLowerCase();
  const valueFormatted = transaction.valueFormatted;
  const value = transaction.value;
  
  // Update overall stats
  this.totalTransactions += 1;
  if (transaction.isFeeCollection) {
    this.totalFeeCollections += 1;
  }
  
  // Update token-specific stats
  const tokenStats = tokenSymbol === 'byte' ? this.byteStats : this.wethStats;
  
  tokenStats.transactionCount += 1;
  
  if (isIncoming) {
    tokenStats.totalReceived = (BigInt(tokenStats.totalReceived) + BigInt(value)).toString();
    tokenStats.totalReceivedFormatted += valueFormatted;
    tokenStats.currentBalanceFormatted += valueFormatted;
  } else {
    tokenStats.totalSent = (BigInt(tokenStats.totalSent) + BigInt(value)).toString();
    tokenStats.totalSentFormatted += valueFormatted;
    tokenStats.currentBalanceFormatted -= valueFormatted;
  }
  
  if (transaction.isFeeCollection) {
    tokenStats.feeCollectionCount += 1;
    tokenStats.totalFeesCollected = (BigInt(tokenStats.totalFeesCollected) + BigInt(value)).toString();
    tokenStats.totalFeesCollectedFormatted += valueFormatted;
  }
  
  // Update dates
  if (!this.firstTransactionDate || transaction.timestamp < this.firstTransactionDate) {
    this.firstTransactionDate = transaction.timestamp;
  }
  if (!this.lastTransactionDate || transaction.timestamp > this.lastTransactionDate) {
    this.lastTransactionDate = transaction.timestamp;
  }
  
  this.lastUpdated = new Date();
  
  return this.save();
};

// Method to get daily stats for a date range
walletStatsSchema.methods.getDailyStats = function(startDate, endDate) {
  return this.dailyStats.filter(stat => {
    return stat.date >= startDate && stat.date <= endDate;
  }).sort((a, b) => a.date - b.date);
};

// Static method to recalculate stats for a wallet
walletStatsSchema.statics.recalculateStats = async function(walletAddress) {
  const Transaction = mongoose.model('Transaction');
  
  // Get all transactions for this wallet
  const transactions = await Transaction.find({
    $or: [
      { from: walletAddress },
      { to: walletAddress }
    ]
  }).sort({ timestamp: 1 });
  
  // Initialize or get existing stats
  let stats = await this.findOne({ walletAddress });
  if (!stats) {
    stats = new this({ walletAddress });
  }
  
  // Reset stats
  stats.totalTransactions = 0;
  stats.totalFeeCollections = 0;
  stats.byteStats = {
    totalReceived: '0',
    totalReceivedFormatted: 0,
    totalSent: '0',
    totalSentFormatted: 0,
    currentBalance: '0',
    currentBalanceFormatted: 0,
    transactionCount: 0,
    feeCollectionCount: 0,
    totalFeesCollected: '0',
    totalFeesCollectedFormatted: 0
  };
  stats.wethStats = { ...stats.byteStats };
  
  // Process each transaction
  for (const transaction of transactions) {
    await stats.updateWithTransaction(transaction);
  }
  
  return stats;
};

module.exports = mongoose.model('WalletStats', walletStatsSchema);