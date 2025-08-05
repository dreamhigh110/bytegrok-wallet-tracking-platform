const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Transaction basics
  hash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  blockNumber: {
    type: Number,
    required: true,
    index: true
  },
  blockHash: {
    type: String,
    required: true
  },
  transactionIndex: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  
  // Transaction participants
  from: {
    type: String,
    required: true,
    index: true
  },
  to: {
    type: String,
    required: true,
    index: true
  },
  
  // Token information
  tokenContract: {
    type: String,
    required: true,
    index: true
  },
  tokenSymbol: {
    type: String,
    required: true,
    enum: ['BYTE', 'WETH']
  },
  tokenName: {
    type: String,
    required: true
  },
  tokenDecimals: {
    type: Number,
    required: true
  },
  
  // Amount information
  value: {
    type: String, // Using string to avoid precision issues with large numbers
    required: true
  },
  valueFormatted: {
    type: Number, // Human readable format
    required: true
  },
  
  // Gas information
  gasUsed: {
    type: String,
    required: true
  },
  gasPrice: {
    type: String,
    required: true
  },
  gasFee: {
    type: String,
    required: true
  },
  
  // Transaction type and method
  method: {
    type: String,
    default: 'transfer'
  },
  transactionType: {
    type: String,
    enum: ['incoming', 'outgoing', 'internal'],
    required: true
  },
  
  // Fee collection specific
  isFeeCollection: {
    type: Boolean,
    default: false,
    index: true
  },
  feeType: {
    type: String,
    enum: ['LP_FEE', 'PROTOCOL_FEE', 'OTHER'],
    default: null
  },
  
  // USD values (if available)
  usdValue: {
    type: Number,
    default: null
  },
  tokenPriceUSD: {
    type: Number,
    default: null
  },
  
  // Status and confirmation
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success'
  },
  confirmations: {
    type: Number,
    default: 0
  },
  
  // Metadata
  tags: [{
    type: String
  }],
  notes: {
    type: String,
    default: ''
  },
  
  // System fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Additional data
  rawData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  indexes: [
    { timestamp: -1 },
    { tokenSymbol: 1, timestamp: -1 },
    { isFeeCollection: 1, timestamp: -1 },
    { from: 1, timestamp: -1 },
    { to: 1, timestamp: -1 }
  ]
});

// Virtual for transaction age
transactionSchema.virtual('age').get(function() {
  return Date.now() - this.timestamp.getTime();
});

// Method to format transaction for API response
transactionSchema.methods.toJSON = function() {
  const transaction = this.toObject();
  transaction.age = this.age;
  return transaction;
};

// Static method to get fee collection transactions
transactionSchema.statics.getFeeCollections = function(tokenSymbol = null, limit = 100) {
  const query = { isFeeCollection: true };
  if (tokenSymbol) {
    query.tokenSymbol = tokenSymbol;
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get transactions by date range
transactionSchema.statics.getByDateRange = function(startDate, endDate, tokenSymbol = null) {
  const query = {
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (tokenSymbol) {
    query.tokenSymbol = tokenSymbol;
  }
  
  return this.find(query).sort({ timestamp: -1 });
};

// Index for efficient queries
transactionSchema.index({ tokenSymbol: 1, timestamp: -1 });
transactionSchema.index({ isFeeCollection: 1, tokenSymbol: 1, timestamp: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);