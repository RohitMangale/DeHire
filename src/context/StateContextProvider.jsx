import { useContext, createContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import FreelanceMarketplaceABI from '../Web3/FreelanceMarketplace.json';
import { CONTRACT_ADDRESS } from '../config/web3';
const StateContext = createContext();
// Create the Context


// Provider Component
export const StateContextProvider = ({ children }) => {
    const [address, setAddress] = useState("");
    const [jobs, setJobs] = useState([]);
    const contractAddress = CONTRACT_ADDRESS;

    // Setup Provider and Contract
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, FreelanceMarketplaceABI.abi, signer);

    // Connect to MetaMask
    const connectToMetaMask = async () => {
        try {
            await provider.send('eth_requestAccounts', []);
            const userAddress = await signer.getAddress();
            setAddress(userAddress);
        } catch (error) {
            console.error('Error connecting to MetaMask:', error);
        }
    };

    // Retrieve All Jobs
    const retrieveAllJobs = async () => {
        try {
            const jobList = await contract.retrieveAllJobs();
            const parsedJobs = jobList.map((job, index) => ({
                jobId: job.jobId,
                client: job.client,
                description: job.description,
                budget: ethers.utils.formatEther(job.budget.toString()),
                freelancer: job.freelancer,
                isCompleted: job.isCompleted,
                submittedWork: job.submittedWork,
                index,
            }));
            setJobs(parsedJobs);
            return parsedJobs;
        } catch (error) {
            console.error("Error retrieving jobs:", error);
        }
    };

    // Create Job Post
    const postJob = async (description, budget) => {
        try {
            const budgetInWei = ethers.utils.parseUnits(budget.toString(), 'ether');
            const transaction = await contract.postJob(description, budgetInWei, { from: address });
            await transaction.wait();
            console.log("Job posted successfully!");
            await retrieveAllJobs(); // Refresh jobs list after posting
        } catch (error) {
            console.error("Error posting job:", error);
        }
    };

    // Submit Work
    const submitWork = async (jobId, workUrl) => {
        try {
            const transaction = await contract.submitWork(jobId, workUrl, { from: address });
            await transaction.wait();
            console.log("Work submitted successfully!");
            await retrieveAllJobs(); // Refresh jobs list after submission
        } catch (error) {
            console.error("Error submitting work:", error);
        }
    };

    // Get Submitted Work (only visible to the job poster)
    const getSubmittedWork = async (jobId) => {
        const job = jobs.find(job => job.jobId === jobId);
        if (job && job.client === address && job.isCompleted) {
            return job.submittedWork;
        } else {
            console.log("Not authorized to view this work or job is incomplete.");
            return null;
        }
    };

    // Fetch all jobs on initial load
    useEffect(() => {
        if (address) {
            retrieveAllJobs();
        }
    }, [address]);

    return (
        <StateContext.Provider value={{
            address,
            connectToMetaMask,
            retrieveAllJobs,
            postJob,
            submitWork,
            getSubmittedWork,
            jobs,
        }}>
            {children}
        </StateContext.Provider>
    );
};

// Hook to use context
export const useStateContext = () => useContext(StateContext);
