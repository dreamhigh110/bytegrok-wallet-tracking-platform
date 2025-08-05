# BYTE Wallet Tracker

A real-time transaction tracking platform for monitoring BYTE token and WETH transactions from the wallet address `0x4fbF8C4C3404e5C093bc17bb57361D1D7384fBDF` on Base chain.

![BYTE Tracker Dashboard](https://via.placeholder.com/800x400?text=BYTE+Tracker+Dashboard)

## 🚀 Features

- **Real-time Transaction Monitoring** - Live tracking of BYTE and WETH transactions
- **Interactive Dashboard** - Comprehensive overview with charts and statistics  
- **Fee Collection Analysis** - Detailed tracking of LP fee collections
- **Advanced Analytics** - Timeline analysis, comparisons, and export capabilities
- **Responsive Design** - Works perfectly on desktop and mobile devices
- **Dark/Light Mode** - Toggle between themes for comfortable viewing
- **WebSocket Integration** - Real-time updates without page refresh

## 🏗️ Tech Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** for data storage
- **Web3/Ethers.js** for blockchain interaction
- **Socket.IO** for real-time communication
- **Cron Jobs** for automated monitoring

### Frontend  
- **React 18** with Vite build tool
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **Recharts** for data visualization
- **Framer Motion** for animations
- **Socket.IO Client** for real-time updates

### Blockchain
- **Base Chain** (Layer 2 Ethereum)
- **Uniswap V3** pool monitoring
- **ERC-20 Token** tracking (BYTE & WETH)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **MongoDB** (v5.0 or higher)
- **Git**

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd byte-wallet-tracker
```

### 2. Install Dependencies

Install all dependencies for both backend and frontend:

```bash
npm run setup
```

Or install manually:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies  
cd ../frontend && npm install
```

### 3. Environment Configuration

#### Backend Environment

Create a `.env` file in the `backend` directory:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your configuration:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/byte-tracker

# Server Configuration
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Base Chain Configuration
BASE_RPC_URL=https://1rpc.io/base
BASE_CHAIN_ID=8453

# API Keys (Optional - for enhanced performance)
ALCHEMY_API_KEY=your_alchemy_api_key_here
MORALIS_API_KEY=your_moralis_api_key_here

# Wallet to Track
TARGET_WALLET=0x4fbF8C4C3404e5C093bc17bb57361D1D7384fBDF

# Token Contracts on Base Chain
BYTE_TOKEN_CONTRACT=0x03cEac3c28E353F5E4626c1242A6C7A41d004354
WETH_CONTRACT=0x4200000000000000000000000000000000000006

# Monitoring Configuration
POLLING_INTERVAL=30000
MAX_BLOCKS_PER_QUERY=100
```

#### Frontend Environment (Optional)

Create a `.env` file in the `frontend` directory if needed:

```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

## 🚀 Running the Application

### Development Mode

Start both backend and frontend in development mode:

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5001`
- Frontend development server on `http://localhost:3000`

### Individual Services

Run backend only:
```bash
npm run server:dev
```

Run frontend only:
```bash
npm run client:dev
```

### Production Mode

Build and start in production:

```bash
# Build frontend
npm run build

# Start backend in production
npm start
```

## 📊 API Endpoints

### Transactions
- `GET /api/transactions` - Get all transactions with filtering
- `GET /api/transactions/recent` - Get recent transactions
- `GET /api/transactions/fees` - Get fee collection transactions
- `GET /api/transactions/summary` - Get transaction summary statistics

### Wallet
- `GET /api/wallet/stats` - Get wallet statistics
- `GET /api/wallet/balances` - Get current token balances
- `GET /api/wallet/performance` - Get performance metrics

### Analytics
- `GET /api/analytics/overview` - Get analytics overview
- `GET /api/analytics/timeline` - Get timeline data for charts
- `GET /api/analytics/fee-analysis` - Get fee collection analysis
- `GET /api/analytics/export` - Export data (JSON/CSV)

## 🔧 Configuration

### Monitoring Settings

The application monitors transactions every 30 seconds by default. You can adjust this in the environment variables:

```env
POLLING_INTERVAL=30000  # 30 seconds
MAX_BLOCKS_PER_QUERY=1000  # Maximum blocks to query at once
```

### Database Configuration

MongoDB connection can be configured via:

```env
MONGODB_URI=mongodb://localhost:27017/byte-tracker
```

For MongoDB Atlas (cloud):
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/byte-tracker
```

## 📱 Features Overview

### Dashboard
- Real-time balance display for BYTE and WETH
- Transaction statistics and counters
- Recent transaction feed
- Interactive charts showing trends

### Transactions Page  
- Complete transaction history
- Advanced filtering (token type, date range, transaction type)
- Pagination and sorting
- Transaction details modal

### Analytics Page
- Timeline charts showing transaction patterns
- Fee collection analysis
- Comparative analytics
- Data export functionality

### Wallet Details
- Comprehensive wallet statistics
- Performance metrics
- Daily/weekly/monthly breakdowns
- Balance history

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```
   Error: MongoNetworkError: failed to connect to server
   ```
   - Make sure MongoDB is running
   - Check the connection string in `.env`

2. **Blockchain RPC Errors**
   ```
   Error: could not detect network
   ```
   - Verify BASE_RPC_URL is correct
   - Consider using Alchemy or Infura RPC endpoint

3. **Port Already in Use**
   ```
   Error: listen EADDRINUSE: address already in use :::5001
   ```
   - Change the PORT in backend/.env
   - Kill the process using the port: `lsof -ti:5001 | xargs kill -9`

4. **Block Range or Result Limit Errors**
   ```
   Error: eth_getLogs range is too large, max is 1k blocks
   Error: query exceeds max results 20000
   ```
   - The system uses adaptive chunking starting with 50-100 blocks
   - It automatically parses suggested ranges from error messages
   - Reduce `MAX_BLOCKS_PER_QUERY` in your .env file if needed (try 25-50 for very dense networks)
   - Different RPC providers have different limits - the system adapts automatically

### Performance Optimization

1. **Use API Keys**: Add Alchemy or Moralis API keys for better performance
2. **Adjust Polling**: Increase POLLING_INTERVAL for less frequent updates
3. **Database Indexing**: MongoDB will automatically create indexes for better query performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Base Chain](https://base.org/) for the Layer 2 infrastructure
- [Uniswap V3](https://uniswap.org/) for the decentralized exchange protocol
- [cliza.ai](https://cliza.ai/) for the BYTE token

## 📞 Support

If you have any questions or need help, please:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

**Happy Tracking! 🚀**