# Docker Setup Guide for DeHire

This guide will help you run DeHire using Docker and Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed (usually included with Docker Desktop)

## Quick Start

### 1. Create Environment File

```bash
cp example.env .env
```

### 2. Start All Services

```bash
docker-compose up --build
```

This will:
- Start Ganache blockchain on port `7545`
- Build and start the frontend on port `3000`
- Wait for Ganache to be healthy before starting the frontend

### 3. Deploy Smart Contracts

In a new terminal, run:

```bash
docker-compose --profile deploy run --rm contract-deployer
```

After deployment, you'll see the contract address in the output. Update your `.env` file:

```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

Then restart the frontend:

```bash
docker-compose restart frontend
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Ganache RPC**: http://localhost:7545

## Development Mode

For development with hot-reload and live updates:

```bash
docker-compose --profile dev up frontend-dev ganache
```

The frontend will be available at http://localhost:5173 with Vite's hot module replacement enabled.

## Common Commands

### Start services in background
```bash
docker-compose up -d
```

### View logs
```bash
docker-compose logs -f
```

### View logs for specific service
```bash
docker-compose logs -f frontend
docker-compose logs -f ganache
```

### Stop services
```bash
docker-compose down
```

### Stop and remove volumes (clean slate)
```bash
docker-compose down -v
```

### Rebuild containers
```bash
docker-compose up --build
```

### Execute commands in a container
```bash
# Access frontend container shell
docker-compose exec frontend sh

# Access contract deployer container
docker-compose run --rm contract-deployer sh
```

## MetaMask Configuration

To connect MetaMask to the Dockerized Ganache:

1. Open MetaMask and click the network dropdown
2. Click "Add Network" → "Add a network manually"
3. Enter the following details:
   - **Network Name**: Ganache Local
   - **RPC URL**: http://localhost:7545
   - **Chain ID**: 1337 (or check Ganache logs)
   - **Currency Symbol**: ETH
   - **Block Explorer URL**: (leave empty)

4. Import an account:
   - Check Ganache logs: `docker-compose logs ganache`
   - Copy a private key from the output
   - In MetaMask: Account menu → Import Account → Paste private key

## Troubleshooting

### Port Already in Use

If port 7545 or 3000 is already in use:

1. Edit `docker-compose.yml`
2. Change the port mapping (e.g., `"8545:8545"` for Ganache)
3. Update MetaMask RPC URL accordingly

### Contract Deployment Fails

1. Ensure Ganache is running and healthy:
   ```bash
   docker-compose ps
   ```

2. Check Ganache logs:
   ```bash
   docker-compose logs ganache
   ```

3. Try redeploying:
   ```bash
   docker-compose --profile deploy run --rm contract-deployer
   ```

### Frontend Not Loading

1. Check if the frontend container is running:
   ```bash
   docker-compose ps
   ```

2. Check frontend logs:
   ```bash
   docker-compose logs frontend
   ```

3. Verify the contract address in `.env` matches the deployed contract

### Changes Not Reflecting

In production mode, rebuild the container:
```bash
docker-compose up --build frontend
```

In development mode, changes should reflect automatically with hot-reload.

## Production Deployment

For production deployment:

1. Build the production image:
   ```bash
   docker build -t dehire-frontend:latest .
   ```

2. Run with production settings:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

3. Configure environment variables in `.env` or use Docker secrets

## Architecture

The Docker setup includes:

- **Ganache**: Local Ethereum blockchain (port 7545)
- **Frontend**: React application served via Nginx (port 3000)
- **Contract Deployer**: One-time service to deploy smart contracts

All services communicate through a Docker bridge network (`dehire-network`).

