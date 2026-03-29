# VoiceVault

**Own Your Voice. Earn Forever.**

VoiceVault is a decentralized Web3 platform for creating, owning, and monetizing AI voice models on the Sui blockchain. 

Users can train custom AI voice models, mint on-chain ownership NFTs, and earn crypto every time someone uses their voice for text-to-speech generation. It bridges the gap between voice creators and consumers by providing a transparent, decentralized marketplace with cryptographic proof of rights and automated payment distribution.

![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-active-brightgreen)

## 🌟 Features

### Core Features
- **Voice Registration**: Train and register custom AI voice models on-chain
- **Voice NFTs**: Mint unique voice NFTs representing ownership and creator rights
- **Voice Marketplace**: Browse, search, and license voices from creators worldwide
- **TTS Generation**: Generate speech using registered voices with automated payment distribution
- **Dashboard Analytics**: Track voice usage, earnings, and performance metrics
- **Creator Dashboard**: Manage voice models, view earnings, and access analytics

### Technical Features
- **Blockchain Integration**: Smart contracts on Sui blockchain for immutable voice ownership
- **Web3 Wallet**: Native Sui wallet integration for authentication and transactions
- **AI Voice Models**: Integration with Shelby voice AI for model training and TTS
- **Real-time Data**: Live usage tracking and earnings calculation
- **Responsive UI**: Mobile-first design with dark theme and glassmorphic components
- **Payment Processing**: Automated SUI token handling for voice licensing

## 🏗️ Tech Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui + Radix UI
- **Web3**: @mysten/sui, @mysten/dapp-kit
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **HTTP Client**: Axios
- **State Management**: React Context + TanStack Query

### Backend
- **Language**: Python 3.8+
- **API Framework**: FastAPI
- **Voice AI**: Shelby API integration
- **Database**: PostgreSQL (optional)
- **Task Queue**: Celery (optional for async tasks)

### Blockchain (Sui)
- **Language**: Move
- **Contracts**: Voice ownership, payment distribution, NFT minting
- **Network**: Sui mainnet/testnet
- **SDK**: Sui TypeScript SDK

## 📋 Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Python**: 3.8 or higher (for backend)
- **Sui Wallet**: Installed browser extension or CLI
- **Sui CLI**: Optional, for contract deployment

## 🚀 Installation

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/voice-vault-sui.git
cd voice-vault-sui/frontend

# Install dependencies
npm install

# Build UI components
npm run build:ui

# Install Python backend
cd ../backend
pip install -r requirements.txt
```

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Run the server
python server.py
```

### Smart Contracts (Optional Deployment)

```bash
cd voice_vault_sui

# Install Sui CLI
curl -fsSL https://sui-releases.s3-us-west-2.amazonaws.com/sui-linux | tar -xz

# Publish contracts
sui client publish

```

## 📁 Project Structure

```
voice-vault-sui/
├── frontend/                   # React TypeScript frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── dashboard/     # Dashboard components
│   │   │   ├── landing/       # Landing page sections
│   │   │   ├── voice/         # Voice-specific components
│   │   │   ├── wallet/        # Wallet integration
│   │   │   ├── marketplace/   # Marketplace components
│   │   │   ├── ui/            # Base UI elements
│   │   │   └── layout/        # Layout components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utility functions
│   │   │   ├── api.ts         # API client
│   │   │   ├── contracts.ts   # Contract interactions
│   │   │   ├── sui.ts         # Sui blockchain helpers
│   │   │   └── voiceRegistry.ts # Voice registration logic
│   │   ├── contexts/          # React Context providers
│   │   └── App.tsx            # Main app component
│   ├── vite.config.ts         # Vite configuration
│   ├── tailwind.config.ts     # Tailwind CSS config
│   └── package.json
│
├── backend/                    # Python FastAPI backend
│   ├── server.py              # Main application entry
│   ├── shelby.py              # Shelby AI integration
│   ├── voice_model.py         # Voice model logic
│   ├── deploy/                # Deployment service
│   │   ├── main.py            # FastAPI app
│   │   ├── config.py          # Configuration
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication
│   │   ├── database/          # Database models
│   │   └── realtime/          # Real-time features
│   ├── scripts/               # Utility scripts
│   └── requirements.txt       # Python dependencies
│
├── voice_vault_sui/           # Sui Move smart contracts
│   ├── sources/
│   │   ├── voice_identity.move    # Voice NFT contract
│   │   └── payment.move           # Payment distribution
│   ├── tests/
│   │   └── voice_vault_tests.move
│   └── Move.toml
│
└── docs/                       # Documentation
    ├── README.md
    └── sui.md
```

## 🎯 Usage

### Running the Application

```bash
# Terminal 1: Start backend
cd backend
python server.py

# Terminal 2: Start frontend dev server
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`

### Creating a Voice

1. Connect your Sui wallet
2. Navigate to "Create Voice"
3. Upload your voice sample
4. Train the AI model using Shelby
5. Register the voice on-chain
6. View your voice in the Dashboard

### Using a Voice

1. Browse the Marketplace
2. Select a voice
3. Enter text to generate
4. Pay the creator in SUI tokens
5. Download or play the generated audio

## 🏃 Development

### Development Commands

```bash
# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Backend
python server.py    # Run development server
pytest              # Run tests (if configured)
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/voicevault

# Shelby API
SHELBY_API_KEY=your_shelby_api_key
SHELBY_API_URL=https://api.shelby.ai

# Sui Configuration
SUI_NETWORK=testnet  # or mainnet
SUI_RPC_URL=https://fullnode.testnet.sui.io:9000

# API Keys
API_SECRET_KEY=your_secret_key
```

## 🔐 Smart Contracts

The Sui Move smart contracts handle:

- **voice_identity.move**: Voice ownership NFTs and metadata storage
- **payment.move**: Automated payment distribution to voice creators

To deploy:

```bash
cd voice_vault_sui
sui client publish --gas-budget 10000000
```

## 📊 API Endpoints

### Voice Management
- `POST /api/voices/register` - Register a new voice
- `GET /api/voices/:id` - Get voice details
- `GET /api/voices/user/:address` - Get user's voices
- `DELETE /api/voices/:id` - Delete a voice

### Marketplace
- `GET /api/voices/marketplace` - List marketplace voices
- `GET /api/voices/search?q=query` - Search voices
- `GET /api/voices/trending` - Get trending voices

### Generation & Payments
- `POST /api/generate` - Generate speech
- `GET /api/users/:address/earnings` - Get creator earnings
- `POST /api/payments/process` - Process payment

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/usage` - Get usage analytics

## 🧪 Testing

```bash
# Frontend (if configured)
npm run test

# Backend
cd backend
pytest tests/
```

## 📦 Building for Production

```bash
# Frontend
npm run build

# Backend
# Use a production ASGI server like Gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.deploy.main:app

# Or with Docker
docker build -t voice-vault-backend .
docker run -p 8000:8000 voice-vault-backend
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- **Frontend**: Follow ESLint configuration
- **Backend**: Follow PEP 8
- **Contracts**: Follow Move style guide

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Sui Documentation**: https://docs.sui.io
- **Shelby AI**: https://shelby.ai
- **dApp Kit**: https://github.com/MystenLabs/sui

## 💬 Support

For support, email support@voicevault.io or open an issue in the repository.

## 🙏 Acknowledgments

- Built with Sui blockchain
- Voice AI powered by Shelby
- UI components from Shadcn/ui
- Thanks to all contributors and testers


