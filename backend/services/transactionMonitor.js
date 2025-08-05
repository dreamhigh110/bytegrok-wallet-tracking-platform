const cron = require('node-cron');
const BlockchainService = require('./blockchainService');
const Transaction = require('../models/Transaction');
const WalletStats = require('../models/WalletStats');
const { ethers } = require('ethers');

class TransactionMonitor {
  constructor(io) {
    this.io = io;
    this.blockchainService = new BlockchainService();
    this.isRunning = false;
    this.lastProcessedBlock = 0;
    this.pollingInterval = process.env.POLLING_INTERVAL || 30000; // 30 seconds
    this.maxBlocksPerQuery = process.env.MAX_BLOCKS_PER_QUERY || 100;
  }

  // Start the monitoring service
  async start() {
    console.log('Starting Transaction Monitor...');
    
    try {
      // Initialize last processed block
      await this.initializeLastBlock();
      
      // Start periodic monitoring
      this.startPeriodicMonitoring();
      
      // Initial sync of recent transactions
      await this.syncRecentTransactions();
      
      this.isRunning = true;
      console.log('Transaction Monitor started successfully');
    } catch (error) {
      console.error('Error starting Transaction Monitor:', error);
    }
  }

  // Stop the monitoring service
  stop() {
    this.isRunning = false;
    console.log('Transaction Monitor stopped');
  }

  // Initialize the last processed block number
  async initializeLastBlock() {
    try {
      const latestTransaction = await Transaction.findOne().sort({ blockNumber: -1 });
      
      if (latestTransaction) {
        this.lastProcessedBlock = latestTransaction.blockNumber;
      } else {
        // If no transactions exist, start from a recent block
        const latestBlock = await this.blockchainService.getLatestBlockNumber();
        this.lastProcessedBlock = Math.max(0, latestBlock - 1000); // Start from 1000 blocks ago
      }
      
      console.log(`Initialized last processed block: ${this.lastProcessedBlock}`);
    } catch (error) {
      console.error('Error initializing last block:', error);
      // Fallback to recent block
      const latestBlock = await this.blockchainService.getLatestBlockNumber();
      this.lastProcessedBlock = Math.max(0, latestBlock - 100);
    }
  }

  // Start periodic monitoring using cron
  startPeriodicMonitoring() {
    // Check for new transactions every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
      if (this.isRunning) {
        await this.checkForNewTransactions();
      }
    });

    // Update wallet stats every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      if (this.isRunning) {
        await this.updateWalletStats();
      }
    });

    console.log('Periodic monitoring scheduled');
  }

  // Check for new transactions since last processed block
  async checkForNewTransactions() {
    try {
      const latestBlock = await this.blockchainService.getLatestBlockNumber();
      
      if (latestBlock <= this.lastProcessedBlock) {
        return; // No new blocks to process
      }

      const fromBlock = this.lastProcessedBlock + 1;
      const toBlock = Math.min(latestBlock, fromBlock + this.maxBlocksPerQuery - 1);

      console.log(`Checking blocks ${fromBlock} to ${toBlock} for new transactions...`);

      const transfers = await this.blockchainService.getTokenTransfers(fromBlock, toBlock);
      
      if (transfers.length > 0) {
        console.log(`Found ${transfers.length} new transfers`);
        await this.processTransfers(transfers);
        
        // Emit real-time updates to connected clients
        this.io.emit('newTransactions', {
          count: transfers.length,
          latestBlock: toBlock
        });
      }

      this.lastProcessedBlock = toBlock;
    } catch (error) {
      console.error('Error checking for new transactions:', error);
    }
  }

  // Process transfer events and save to database
  async processTransfers(transfers) {
    const processedTransactions = [];

    for (const transfer of transfers) {
      try {
        // Check if transaction already exists
        const existingTx = await Transaction.findOne({ 
          hash: transfer.transactionHash,
          tokenContract: transfer.tokenContract,
          from: transfer.from,
          to: transfer.to
        });

        if (existingTx) {
          continue; // Skip if already processed
        }

        // Get full transaction details
        const txDetails = await this.blockchainService.getTransaction(transfer.transactionHash);
        if (!txDetails) continue;

        // Get token information
        const tokenInfo = await this.blockchainService.getTokenInfo(transfer.tokenContract);
        
        // Calculate formatted value
        const valueFormatted = parseFloat(ethers.formatUnits(transfer.value, tokenInfo.decimals));

        // Determine transaction type
        const transactionType = this.determineTransactionType(transfer);

        // Check if this is a fee collection
        const isFeeCollection = this.blockchainService.isFeeCollection(transfer);

        // Calculate gas fee
        const gasFee = (BigInt(txDetails.gasUsed) * BigInt(txDetails.gasPrice)).toString();

        // Create transaction record
        const transaction = new Transaction({
          hash: transfer.transactionHash,
          blockNumber: transfer.blockNumber,
          blockHash: txDetails.blockHash,
          transactionIndex: txDetails.transactionIndex,
          timestamp: txDetails.timestamp,
          from: transfer.from,
          to: transfer.to,
          tokenContract: transfer.tokenContract,
          tokenSymbol: tokenInfo.symbol,
          tokenName: tokenInfo.name,
          tokenDecimals: tokenInfo.decimals,
          value: transfer.value,
          valueFormatted: valueFormatted,
          gasUsed: txDetails.gasUsed,
          gasPrice: txDetails.gasPrice,
          gasFee: gasFee,
          transactionType: transactionType,
          isFeeCollection: isFeeCollection,
          feeType: isFeeCollection ? 'LP_FEE' : null,
          status: txDetails.status === 1 ? 'success' : 'failed',
          rawData: {
            transfer: transfer,
            transaction: txDetails
          }
        });

        await transaction.save();
        processedTransactions.push(transaction);

        console.log(`Saved ${tokenInfo.symbol} transaction: ${transfer.transactionHash}`);

        // Emit real-time update for this specific transaction
        this.io.emit('newTransaction', transaction);

      } catch (error) {
        console.error(`Error processing transfer ${transfer.transactionHash}:`, error);
      }
    }

    return processedTransactions;
  }

  // Determine transaction type based on wallet involvement
  determineTransactionType(transfer) {
    const targetWallet = process.env.TARGET_WALLET.toLowerCase();
    const fromWallet = transfer.from.toLowerCase();
    const toWallet = transfer.to.toLowerCase();

    if (toWallet === targetWallet && fromWallet !== targetWallet) {
      return 'incoming';
    } else if (fromWallet === targetWallet && toWallet !== targetWallet) {
      return 'outgoing';
    } else {
      return 'internal';
    }
  }

  // Sync recent transactions on startup
  async syncRecentTransactions() {
    console.log('Syncing recent transactions...');
    
    try {
      const transactions = await this.blockchainService.getHistoricalTransactions(null, 50);
      
      if (transactions.length > 0) {
        console.log(`Found ${transactions.length} historical transactions to sync`);
        // Process historical transactions similar to real-time ones
        // This would need to be adapted based on the API response format
      }
    } catch (error) {
      console.error('Error syncing recent transactions:', error);
    }
  }

  // Update wallet statistics
  async updateWalletStats() {
    try {
      const targetWallet = process.env.TARGET_WALLET;
      let stats = await WalletStats.findOne({ walletAddress: targetWallet });
      
      if (!stats) {
        stats = new WalletStats({ walletAddress: targetWallet });
      }

      // Get current token balances
      const [byteBalance, wethBalance] = await Promise.all([
        this.blockchainService.getTokenBalance(process.env.BYTE_TOKEN_CONTRACT),
        this.blockchainService.getTokenBalance(process.env.WETH_CONTRACT)
      ]);

      // Update current balances
      stats.byteStats.currentBalance = byteBalance.raw;
      stats.byteStats.currentBalanceFormatted = byteBalance.formatted;
      stats.wethStats.currentBalance = wethBalance.raw;
      stats.wethStats.currentBalanceFormatted = wethBalance.formatted;

      stats.lastUpdated = new Date();
      await stats.save();

      // Emit updated stats to clients
      this.io.emit('walletStatsUpdate', {
        walletAddress: targetWallet,
        byteBalance: byteBalance.formatted,
        wethBalance: wethBalance.formatted,
        lastUpdated: stats.lastUpdated
      });

      console.log('Wallet stats updated successfully');
    } catch (error) {
      console.error('Error updating wallet stats:', error);
    }
  }

  // Get monitoring status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastProcessedBlock: this.lastProcessedBlock,
      pollingInterval: this.pollingInterval,
      targetWallet: process.env.TARGET_WALLET
    };
  }

  // Manual sync trigger
  async manualSync() {
    console.log('Manual sync triggered...');
    await this.checkForNewTransactions();
    await this.updateWalletStats();
  }
}

module.exports = TransactionMonitor;