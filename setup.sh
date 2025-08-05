#!/bin/bash

# BYTE Wallet Tracker Setup Script
# This script helps set up the BYTE tracker project quickly

set -e

echo "🚀 Setting up BYTE Wallet Tracker..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js v18 or higher."
        print_status "Visit: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
    
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        print_error "Node.js version $NODE_VERSION detected. Please upgrade to v18 or higher."
        exit 1
    fi
    
    print_success "Node.js v$NODE_VERSION detected"
}

# Check if MongoDB is running
check_mongodb() {
    if command -v mongod &> /dev/null; then
        if pgrep -x "mongod" > /dev/null; then
            print_success "MongoDB is running"
        else
            print_warning "MongoDB is installed but not running"
            print_status "You can start MongoDB with: sudo systemctl start mongod"
        fi
    else
        print_warning "MongoDB not found. You can:"
        print_status "1. Install MongoDB locally: https://docs.mongodb.com/manual/installation/"
        print_status "2. Use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd backend && npm install && cd ..
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    
    print_success "All dependencies installed"
}

# Setup environment files
setup_env() {
    print_status "Setting up environment files..."
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        print_success "Created backend/.env from example"
        print_warning "Please edit backend/.env with your configuration"
    else
        print_warning "backend/.env already exists, skipping..."
    fi
    
    print_status "Environment setup complete"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p uploads
    mkdir -p temp
    
    print_success "Directories created"
}

# Display next steps
show_next_steps() {
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Edit backend/.env with your configuration"
    echo "2. Start MongoDB if not already running"
    echo "3. Run the development server:"
    echo "   npm run dev"
    echo ""
    echo "The application will be available at:"
    echo "- Frontend: http://localhost:5173"
    echo "- Backend:  http://localhost:5000"
    echo ""
    echo "For more information, see README.md"
}

# Main setup process
main() {
    echo "🔍 Checking prerequisites..."
    check_node
    check_mongodb
    
    echo ""
    echo "📦 Installing dependencies..."
    install_dependencies
    
    echo ""
    echo "⚙️  Setting up configuration..."
    setup_env
    create_directories
    
    echo ""
    show_next_steps
}

# Run main function
main "$@"