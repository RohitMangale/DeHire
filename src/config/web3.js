export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

export const assertContractAddress = () => {
  if (!CONTRACT_ADDRESS) {
    throw new Error('VITE_CONTRACT_ADDRESS is not set. Deploy the contract and update your .env file.');
  }
  return CONTRACT_ADDRESS;
};

