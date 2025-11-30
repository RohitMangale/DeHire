import { useState } from 'react';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers'; 
import contractABI from '../Web3/FreelanceMarketplace.json';
import { CONTRACT_ADDRESS } from '../config/web3';

// Set the app element for accessibility
Modal.setAppElement('#root');

const PostJob = ({ closeModal }) => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [detailedDescription, setDetailedDescription] = useState('');
    const [budget, setBudget] = useState('');
    const [deadline, setDeadline] = useState('');
    const [image, setImage] = useState('');
    const [workUrl, setWorkUrl] = useState('');

    const handleDescriptionChange = (e) => {
        const inputText = e.target.value;
        const wordCount = inputText.split(/\s+/).filter(Boolean).length;

        if (wordCount <= 15) {
            setShortDescription(inputText);
        }
    };

    const postJob = async (title, shortDescription, detailedDescription, budget, deadline, image, workUrl) => {
        try {
            if (typeof window.ethereum === 'undefined') {
                alert('Please install MetaMask!');
                return;
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // Check network (Ganache typically uses chainId 1337 or 5777)
            const network = await provider.getNetwork();
            console.log('Current network:', network.chainId);
            
            // Warn if not on a local network (but don't block)
            if (network.chainId !== 1337n && network.chainId !== 5777n && network.chainId !== 31337n) {
                const proceed = window.confirm(
                    `You are on network ${network.chainId}. Make sure this matches your deployed contract network. Continue?`
                );
                if (!proceed) return;
            }
            
            const signer = provider.getSigner();

            const contractAddress = CONTRACT_ADDRESS;
            if (!contractAddress) {
                alert('Smart contract address missing. Deploy via Truffle and set VITE_CONTRACT_ADDRESS.');
                return;
            }

            // Validate inputs
            if (!title || !shortDescription || !detailedDescription || !budget || !deadline || !image || !workUrl) {
                alert('Please fill in all fields');
                return;
            }

            // Validate budget is at least 0.001 ETH
            const budgetNum = parseFloat(budget);
            if (isNaN(budgetNum) || budgetNum < 0.001) {
                alert('Budget must be at least 0.001 ETH');
                return;
            }

            // Validate deadline is in the future
            const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);
            const currentTimestamp = Math.floor(Date.now() / 1000);
            if (deadlineTimestamp <= currentTimestamp) {
                alert('Deadline must be in the future');
                return;
            }

            const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);

            // Convert the budget from Ether to Wei
            const budgetInWei = ethers.utils.parseEther(budget.toString());

            console.log('Posting job with budget:', budgetInWei.toString());
            console.log('Deadline timestamp:', deadlineTimestamp);

            // Estimate gas first
            let gasEstimate;
            try {
                gasEstimate = await contract.estimateGas.postJob(
                    title, 
                    shortDescription, 
                    detailedDescription, 
                    budgetInWei,
                    deadlineTimestamp,
                    image, 
                    workUrl
                );
                console.log('Estimated gas:', gasEstimate.toString());
            } catch (estimateError) {
                console.error('Gas estimation error:', estimateError);
                // Continue with a default gas limit if estimation fails
            }

            const tx = await contract.postJob(
                title, 
                shortDescription, 
                detailedDescription, 
                budgetInWei,
                deadlineTimestamp,
                image, 
                workUrl,
                {
                    gasLimit: gasEstimate ? gasEstimate.mul(120).div(100) : 3000000, // Add 20% buffer or use default
                }
            );

            console.log('Transaction sent:', tx.hash);
            alert(`Transaction submitted! Hash: ${tx.hash.substring(0, 10)}...`);

            await tx.wait(); // Wait for the transaction to be mined

            console.log('Job posted successfully', tx);
            alert('Job posted successfully!');
            closeModal();
        } catch (error) {
            console.error('Error posting job:', error);
            
            let errorMessage = 'Failed to post job. ';
            
            if (error.code === 4001) {
                errorMessage += 'Transaction was rejected by user.';
            } else if (error.code === -32603) {
                errorMessage += 'Internal JSON-RPC error. Check if you have enough ETH for gas fees.';
            } else if (error.message) {
                if (error.message.includes('insufficient funds')) {
                    errorMessage += 'Insufficient funds for gas fees.';
                } else if (error.message.includes('revert')) {
                    errorMessage += 'Transaction reverted. Check your inputs (budget must be >= 0.001 ETH, deadline must be in future).';
                } else {
                    errorMessage += error.message;
                }
            } else {
                errorMessage += 'Please check the console for details.';
            }
            
            alert(errorMessage);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        postJob(title, shortDescription, detailedDescription, budget, deadline, image, workUrl);
        setTitle('');
        setShortDescription('');
        setDetailedDescription('');
        setBudget('');
        setDeadline(''); 
        setImage('');
        setWorkUrl('');
    };

    return (
        <div className="fixed p-12 inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-50">
            <div className="w-full max-w-lg p-8 bg-white rounded-lg shadow-lg relative h-[90vh] overflow-y-scroll hide-scrollbar">
                <button onClick={closeModal} className="absolute top-2 right-2 text-gray-600 hover:text-gray-800">✕</button>
                <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Post a New Job</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-600">Title:</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="p-2 border rounded-md focus:outline-none focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-600">Short Description:</label>
                        <textarea
                            value={shortDescription}
                            onChange={handleDescriptionChange}
                            className="p-2 border rounded-md focus:outline-none focus:border-indigo-500"
                            required
                        />
                        <p className='text-right text-sm font-semibold text-gray-600'>{15 - shortDescription.split(/\s+/).filter(Boolean).length} words remaining</p>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-600">Detailed Description:</label>
                        <textarea
                            value={detailedDescription}
                            onChange={(e) => setDetailedDescription(e.target.value)}
                            className="p-2 border rounded-md focus:outline-none focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div className="flex space-x-4">
                        <div className="flex flex-col w-1/2">
                            <label className="text-sm font-semibold text-gray-600">Budget (in Ether):</label>
                            <input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="p-2 border rounded-md focus:outline-none focus:border-indigo-500"
                                required
                            />
                        </div>
                        <div className="flex flex-col w-1/2">
                            <label className="text-sm font-semibold text-gray-600">Deadline:</label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="p-2 border rounded-md focus:outline-none focus:border-indigo-500"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-600">Image URL:</label>
                        <input
                            type="url"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            className="p-2 border rounded-md focus:outline-none focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-600">Work URL:</label>
                        <input
                            type="url"
                            value={workUrl}
                            onChange={(e) => setWorkUrl(e.target.value)}
                            className="p-2 border rounded-md focus:outline-none focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PostJob;
