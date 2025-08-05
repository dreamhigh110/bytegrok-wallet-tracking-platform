const { ethers } = require('ethers');
const axios = require('axios');

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.BASE_RPC_URL || 'https://mainnet.base.org'
    );
    
    this.TARGET_WALLET = process.env.TARGET_WALLET;
    this.BYTE_TOKEN_CONTRACT = process.env.BYTE_TOKEN_CONTRACT;
    this.WETH_CONTRACT = process.env.WETH_CONTRACT;
    
    // ERC-20 ABI for token transfers
    this.ERC20_ABI = [
      "event Transfer(address indexed from, address indexed to, uint256 value)",
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",
      "function name() view returns (string)"
    ];
    
    // Initialize contracts
    this.byteContract = new ethers.Contract(
      this.BYTE_TOKEN_CONTRACT,
      this.ERC20_ABI,
      this.provider
    );
    
    this.wethContract = new ethers.Contract(
      this.WETH_CONTRACT,
      this.ERC20_ABI,
      this.provider
    );
  }

  // Get the latest block number
  async getLatestBlockNumber() {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      console.error('Error getting latest block number:', error);
      throw error;
    }
  }

  // Get token balance for the target wallet
  async getTokenBalance(tokenContract, walletAddress = null) {
    try {
      const address = walletAddress || this.TARGET_WALLET;
      const contract = tokenContract === this.BYTE_TOKEN_CONTRACT 
        ? this.byteContract 
        : this.wethContract;
      
      const balance = await contract.balanceOf(address);
      const decimals = await contract.decimals();
      const symbol = await contract.symbol();
      
      return {
        raw: balance.toString(),
        formatted: parseFloat(ethers.formatUnits(balance, decimals)),
        decimals: Number(decimals),
        symbol
      };
    } catch (error) {
      console.error(`Error getting token balance for ${tokenContract}:`, error);
      throw error;
    }
  }

  // Get token information
  async getTokenInfo(tokenContract) {
    try {
      const contract = new ethers.Contract(tokenContract, this.ERC20_ABI, this.provider);
      
      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals()
      ]);
      
      return {
        address: tokenContract,
        name,
        symbol,
        decimals: Number(decimals)
      };
    } catch (error) {
      console.error(`Error getting token info for ${tokenContract}:`, error);
      throw error;
    }
  }

  // Get transaction receipt with retry logic
  async getTransactionReceipt(txHash, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const receipt = await this.provider.getTransactionReceipt(txHash);
        if (receipt) return receipt;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        console.warn(`Retry ${i + 1}/${maxRetries} for transaction ${txHash}`);
      }
    }
    return null;
  }

  // Get transaction details
  async getTransaction(txHash) {
    try {
      const [tx, receipt] = await Promise.all([
        this.provider.getTransaction(txHash),
        this.getTransactionReceipt(txHash)
      ]);
      
      if (!tx || !receipt) return null;
      
      const block = await this.provider.getBlock(tx.blockNumber);
      
      return {
        hash: tx.hash,
        blockNumber: tx.blockNumber,
        blockHash: tx.blockHash,
        transactionIndex: tx.index,
        timestamp: new Date(block.timestamp * 1000),
        from: tx.from,
        to: tx.to,
        value: tx.value.toString(),
        gasLimit: tx.gasLimit.toString(),
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: tx.gasPrice.toString(),
        status: receipt.status,
        logs: receipt.logs
      };
    } catch (error) {
      console.error(`Error getting transaction ${txHash}:`, error);
      throw error;
    }
  }

  // Parse transfer events from transaction logs
  parseTransferEvents(logs, targetWallet) {
    const transfers = [];
    
    for (const log of logs) {
      try {
        // Check if this is a token transfer event
        if (log.topics[0] === ethers.id("Transfer(address,address,uint256)")) {
          const fromAddress = ethers.getAddress("0x" + log.topics[1].slice(26));
          const toAddress = ethers.getAddress("0x" + log.topics[2].slice(26));
          const value = BigInt(log.data);
          
          // Check if this transfer involves our target wallet
          if (fromAddress.toLowerCase() === targetWallet.toLowerCase() || 
              toAddress.toLowerCase() === targetWallet.toLowerCase()) {
            
            transfers.push({
              tokenContract: log.address,
              from: fromAddress,
              to: toAddress,
              value: value.toString(),
              logIndex: log.index
            });
          }
        }
      } catch (error) {
        console.warn('Error parsing log:', error);
      }
    }
    
    return transfers;
  }

  // Helper method to get logs for a specific range
  async getLogsForRange(fromBlock, toBlock) {
    const byteFilter = {
      address: this.BYTE_TOKEN_CONTRACT,
      topics: [
        ethers.id("Transfer(address,address,uint256)"),
        null, // from (any address)
        null  // to (any address)
      ],
      fromBlock,
      toBlock
    };
    
    const wethFilter = {
      address: this.WETH_CONTRACT,
      topics: [
        ethers.id("Transfer(address,address,uint256)"),
        null,
        null
      ],
      fromBlock,
      toBlock
    };
    
    return await Promise.all([
      this.provider.getLogs(byteFilter),
      this.provider.getLogs(wethFilter)
    ]);
  }

  // Helper method to process logs into transfer objects
  processLogs(logs, tokenSymbol, tokenContract, targetAddress) {
    const transfers = [];
    
    for (const log of logs) {
      const fromAddress = ethers.getAddress("0x" + log.topics[1].slice(26));
      const toAddress = ethers.getAddress("0x" + log.topics[2].slice(26));
      
      // Only include transfers involving the target wallet
      if (fromAddress.toLowerCase() === targetAddress.toLowerCase() || 
          toAddress.toLowerCase() === targetAddress.toLowerCase()) {
        
        const value = BigInt(log.data);
        transfers.push({
          ...log,
          tokenContract: tokenContract,
          tokenSymbol: tokenSymbol,
          from: fromAddress,
          to: toAddress,
          value: value.toString()
        });
      }
    }
    
    return transfers;
  }

  // Get token transfers for a specific block range (with adaptive chunking)
  async getTokenTransfers(fromBlock, toBlock, walletAddress = null) {
    try {
      const address = walletAddress || this.TARGET_WALLET;
      const transfers = [];
      
      console.log(`Getting token transfers from block ${fromBlock} to ${toBlock} (${toBlock - fromBlock} blocks)`);
      
      // Use adaptive chunking
      const chunks = await this.getAdaptiveChunks(fromBlock, toBlock);
      
      for (const chunk of chunks) {
        console.log(`Processing chunk: blocks ${chunk.start} to ${chunk.end}`);
        
        try {
          const [byteLogs, wethLogs] = await this.getLogsForRange(chunk.start, chunk.end);
          transfers.push(...this.processLogs(byteLogs, 'BYTE', this.BYTE_TOKEN_CONTRACT, address));
          transfers.push(...this.processLogs(wethLogs, 'WETH', this.WETH_CONTRACT, address));
          
          // Add small delay between chunks to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (chunkError) {
          console.error(`Error processing chunk ${chunk.start}-${chunk.end}:`, chunkError.message);
          
          // Try to parse suggested range from error message
          const suggestedRange = this.parseSuggestedRange(chunkError.message);
          if (suggestedRange) {
            console.log(`Retrying with suggested range: ${suggestedRange.start}-${suggestedRange.end}`);
            try {
              const [byteLogs, wethLogs] = await this.getLogsForRange(suggestedRange.start, suggestedRange.end);
              transfers.push(...this.processLogs(byteLogs, 'BYTE', this.BYTE_TOKEN_CONTRACT, address));
              transfers.push(...this.processLogs(wethLogs, 'WETH', this.WETH_CONTRACT, address));
            } catch (retryError) {
              console.error(`Retry also failed for ${suggestedRange.start}-${suggestedRange.end}:`, retryError.message);
            }
          }
        }
      }
      
      return transfers.sort((a, b) => a.blockNumber - b.blockNumber);
    } catch (error) {
      console.error('Error getting token transfers:', error);
      throw error;
    }
  }

  // Generate adaptive chunks based on block range and expected transaction density
  async getAdaptiveChunks(fromBlock, toBlock) {
    const chunks = [];
    const totalRange = toBlock - fromBlock;
    
    // Start with smaller chunks for better compatibility
    let chunkSize = Math.min(100, totalRange); // Start with 100 blocks
    
    // For larger ranges, use progressively smaller chunks
    if (totalRange > 1000) {
      chunkSize = 50;
    } else if (totalRange > 500) {
      chunkSize = 100;
    } else if (totalRange > 200) {
      chunkSize = 150;
    }
    
    let current = fromBlock;
    while (current <= toBlock) {
      const end = Math.min(current + chunkSize - 1, toBlock);
      chunks.push({ start: current, end });
      current = end + 1;
    }
    
    return chunks;
  }

  // Parse suggested range from RPC error messages
  parseSuggestedRange(errorMessage) {
    try {
      // Look for patterns like "retry with the range 33772881-33773212"
      const rangeMatch = errorMessage.match(/retry with the range (\d+)-(\d+)/);
      if (rangeMatch) {
        return {
          start: parseInt(rangeMatch[1]),
          end: parseInt(rangeMatch[2])
        };
      }
      
      // Look for hex patterns in the error
      const hexMatch = errorMessage.match(/0x([a-fA-F0-9]+)-0x([a-fA-F0-9]+)/);
      if (hexMatch) {
        return {
          start: parseInt(hexMatch[1], 16),
          end: parseInt(hexMatch[2], 16)
        };
      }
    } catch (parseError) {
      console.warn('Could not parse suggested range from error:', parseError.message);
    }
    
    return null;
  }

  // Get historical transactions using Alchemy or Moralis API
  async getHistoricalTransactions(walletAddress = null, limit = 100) {
    try {
      const address = walletAddress || this.TARGET_WALLET;
      
      // If Alchemy API key is available, use it
      if (process.env.ALCHEMY_API_KEY) {
        return await this.getAlchemyTransactions(address, limit);
      }
      
      // If Moralis API key is available, use it
      if (process.env.MORALIS_API_KEY) {
        return await this.getMoralisTransactions(address, limit);
      }
      
      // Fallback to direct RPC calls (slower but free)
      return await this.getTransactionsFromRPC(address, limit);
    } catch (error) {
      console.error('Error getting historical transactions:', error);
      throw error;
    }
  }

  // Get transactions using Alchemy API
  async getAlchemyTransactions(address, limit) {
    try {
      const url = `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
      
      const response = await axios.post(url, {
        jsonrpc: "2.0",
        method: "alchemy_getAssetTransfers",
        params: [{
          fromBlock: "0x0",
          toBlock: "latest",
          fromAddress: address,
          toAddress: address,
          contractAddresses: [this.BYTE_TOKEN_CONTRACT, this.WETH_CONTRACT],
          category: ["erc20"],
          maxCount: limit
        }],
        id: 1
      });
      
      return response.data.result?.transfers || [];
    } catch (error) {
      console.error('Alchemy API error:', error);
      throw error;
    }
  }

  // Get transactions using Moralis API
  async getMoralisTransactions(address, limit) {
    try {
      const response = await axios.get(`https://deep-index.moralis.io/api/v2/${address}/erc20/transfers`, {
        headers: {
          'X-API-Key': process.env.MORALIS_API_KEY
        },
        params: {
          chain: 'base',
          limit: limit
        }
      });
      
      return response.data.result || [];
    } catch (error) {
      console.error('Moralis API error:', error);
      throw error;
    }
  }

  // Fallback method using direct RPC calls
  async getTransactionsFromRPC(address, limit) {
    try {
      const latestBlock = await this.getLatestBlockNumber();
      const fromBlock = Math.max(0, latestBlock - 10000); // Last ~10k blocks
      
      return await this.getTokenTransfers(fromBlock, latestBlock, address);
    } catch (error) {
      console.error('RPC fallback error:', error);
      throw error;
    }
  }

  // Check if a transaction is a fee collection
  isFeeCollection(transfer) {
    const targetWallet = this.TARGET_WALLET.toLowerCase();
    return transfer.to.toLowerCase() === targetWallet;
  }

  // Get current gas price
  async getGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      return {
        gasPrice: feeData.gasPrice.toString(),
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString()
      };
    } catch (error) {
      console.error('Error getting gas price:', error);
      throw error;
    }
  }
}

module.exports = BlockchainService;