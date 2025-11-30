#!/bin/sh

# Script to deploy contracts to Ganache
# This script waits for Ganache to be ready and then deploys the contracts

echo "Waiting for Ganache to be ready..."
sleep 5

# Check if Ganache is accessible
until nc -z ganache 8545 2>/dev/null; do
  echo "Waiting for Ganache..."
  sleep 2
done

echo "Ganache is ready. Compiling contracts..."
npm run truffle:compile

echo "Deploying contracts..."
npm run truffle:migrate

echo "Contract deployment completed!"
echo "Note: Update VITE_CONTRACT_ADDRESS in your .env file with the deployed contract address."

