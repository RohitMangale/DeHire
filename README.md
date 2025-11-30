# DeHire - Decentralized Freelance Marketplace

A blockchain-based freelance marketplace built on Ethereum that connects freelancers and clients in a transparent, trustless environment with instant payments and no intermediary fees.

![DeHire](https://img.shields.io/badge/DeHire-Decentralized%20Marketplace-blue)
![Ethereum](https://img.shields.io/badge/Ethereum-Smart%20Contracts-627EEA)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB)
![Solidity](https://img.shields.io/badge/Solidity-0.8.17-363636)

## 🌟 Features

### For Clients
- **Post Jobs**: Create detailed job listings with budget, deadline, and requirements
- **Review Applications**: View freelancer profiles, portfolios, and previous work
- **Accept & Pay**: Instantly approve work and release payment in ETH
- **Manage Jobs**: Edit job details, track applications, and review submitted work
- **Provide Feedback**: Rate and review freelancers after job completion

### For Freelancers
- **Browse Jobs**: Explore available opportunities with detailed descriptions
- **Apply Easily**: Submit applications with pre-filled profile information
- **Track Status**: Monitor application status (Pending, Accepted, Not Accepted)
- **Submit Work**: Upload completed work via URL for client review
- **Get Paid Instantly**: Receive ETH payment automatically upon approval
- **Build Reputation**: Collect ratings and feedback from clients

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MetaMask** browser extension
- **Ganache** (GUI or CLI) for local blockchain
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:RohitMangale/DeHire.git
   cd DeHire
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp example.env .env
   ```

4. **Start Ganache**
   - Open Ganache GUI
   - Create a new workspace on port `7545`
   - Note the account addresses and private keys

5. **Deploy smart contracts**
   ```bash
   npm run truffle:compile
   npm run truffle:migrate
   ```

6. **Update contract address**
   - Copy the deployed contract address from the migration output
   - Update `VITE_CONTRACT_ADDRESS` in your `.env` file

7. **Start development server**
   ```bash
   npm run dev
   ```

8. **Configure MetaMask**
   - Add custom network:
     - Network Name: `Ganache Local`
     - RPC URL: `http://localhost:7545`
     - Chain ID: `1337`
     - Currency Symbol: `ETH`
   - Import a Ganache account using a private key

9. **Access the application**
   - Open `http://localhost:5173` in your browser
   - Connect your MetaMask wallet

## 🐳 Docker Setup (Alternative)

### Prerequisites
- Docker Desktop installed

### Quick Start with Pre-built Image

Pull and run the pre-built image from Docker Hub:

```bash
docker pull rohitmangale/dehire:latest
docker run -d -p 3000:80 rohitmangale/dehire:latest
```

Access the application at `http://localhost:3000`

**Docker Hub Repository:** [rohitmangale/dehire](https://hub.docker.com/r/rohitmangale/dehire)

### Quick Start with Docker Compose

1. **Create environment file**
   ```bash
   cp example.env .env
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

3. **Deploy contracts**
   ```bash
   docker-compose --profile deploy run --rm contract-deployer
   ```

4. **Update contract address in `.env` and restart**
   ```bash
   docker-compose restart frontend
   ```

5. **Access the application**
   - Frontend: `http://localhost:3000`
   - Ganache RPC: `http://localhost:7545`

### Development Mode with Docker
```bash
docker-compose --profile dev up frontend-dev ganache
```
Frontend available at `http://localhost:5173` with hot-reload.

## 📁 Project Structure

```
DeHire/
├── contracts/              # Solidity smart contracts
│   └── FreelanceMarketplace.sol
├── migrations/             # Truffle migration scripts
│   └── 1_deploy_freelance_marketplace.js
├── src/
│   ├── components/        # Reusable React components
│   ├── pages/              # Page components
│   ├── config/             # Configuration files
│   ├── context/            # React context providers
│   ├── Web3/               # Contract ABIs
│   └── assets/             # Static assets
├── public/                 # Public assets
├── docker-compose.yml      # Docker orchestration
├── Dockerfile              # Production Docker image
├── Dockerfile.dev          # Development Docker image
├── truffle-config.cjs      # Truffle configuration
└── vite.config.js          # Vite configuration
```

## 🔧 Available Scripts

- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run truffle:compile` - Compile smart contracts
- `npm run truffle:migrate` - Deploy contracts to network
- `npm run truffle:reset` - Reset and redeploy contracts

## 💻 Technology Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Ethers.js** - Ethereum interaction
- **React Router** - Client-side routing

### Blockchain
- **Solidity 0.8.17** - Smart contract language
- **Truffle** - Development framework
- **Ganache** - Local blockchain
- **MetaMask** - Wallet integration

### Infrastructure
- **Docker** - Containerization
- **Nginx** - Production web server

## 🔐 Smart Contract Functions

### Core Functions
- `postJob()` - Create a new job listing
- `applyForJob()` - Submit application for a job
- `reviewWork()` - Review and accept/deny application, release payment
- `editJob()` - Update job details (before completion)
- `getJobs()` - Retrieve all jobs
- `getJobsByPoster()` - Get jobs posted by a specific address
- `getAppliedJobsWithStatus()` - Get jobs a freelancer applied to with status

### Security Features
- Minimum budget requirement (0.001 ETH)
- Deadline validation
- Access control (only job poster can review)
- Payment verification
- Reentrancy protection

## 🎯 Usage Guide

### For Clients

1. **Create Profile**: Set up your profile with company details
2. **Post Job**: Click "Post Job" and fill in job details
3. **Review Applications**: Go to "My Jobs" to see applications
4. **Accept Application**: Review freelancer profile and accept
5. **Review Work**: Once work is submitted, review and approve
6. **Provide Feedback**: Rate and review the freelancer

### For Freelancers

1. **Create Profile**: Add your skills, experience, and portfolio
2. **Browse Jobs**: Explore available jobs on "Find Job" page
3. **Apply**: Click on a job and submit your application
4. **Track Applications**: Check "Applied Jobs" for status updates
5. **Submit Work**: For accepted jobs, submit completed work
6. **Get Paid**: Receive ETH automatically upon approval

## 🔒 Security Considerations

- Smart contracts use Solidity 0.8.17 with built-in overflow protection
- Access control implemented for sensitive operations
- Input validation for all user inputs
- Payment verification before transfers
- Reentrancy protection patterns

## 🐛 Troubleshooting

### Balance Shows 0
- Ensure MetaMask is connected to Ganache network (Chain ID 1337)
- Import a Ganache account with funds
- Check browser console for errors

### Contract Not Found
- Verify contract is deployed: `npm run truffle:migrate`
- Check `VITE_CONTRACT_ADDRESS` in `.env` matches deployed address
- Ensure Ganache is running

### Transaction Fails
- Check you have enough ETH for gas fees
- Verify you're on the correct network
- Check contract has sufficient balance (for payments)

### Docker Issues
- Ensure Docker Desktop is running
- Check ports 3000 and 7545 are not in use
- View logs: `docker-compose logs -f`

## 📝 Environment Variables

Create a `.env` file from `example.env`:

```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Rohit Mangale**

- GitHub: [@RohitMangale](https://github.com/RohitMangale)
- Repository: [DeHire](https://github.com/RohitMangale/DeHire)

## 🙏 Acknowledgments

- Ethereum Foundation
- Truffle Suite
- MetaMask Team
- React Community

