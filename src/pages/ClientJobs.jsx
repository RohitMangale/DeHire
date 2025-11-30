import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import contractABI from '../Web3/FreelanceMarketplace.json';
import JobCard_FC from '../components/JobCard_FC';
import PostJob from './PostJob';
import { CONTRACT_ADDRESS } from '../config/web3';

const ClientJobs = ({ account: accountProp }) => {
    const [jobs, setJobs] = useState([]);
    const [account, setAccount] = useState(accountProp || '');
    const [isLoading, setIsLoading] = useState(false);
    const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
    const contractAddress = CONTRACT_ADDRESS;

    // Update account when prop changes
    useEffect(() => {
        if (accountProp) {
            setAccount(accountProp);
        }
    }, [accountProp]);

    const requestAccount = useCallback(async () => {
        if (accountProp) {
            setAccount(accountProp);
            return;
        }
        if (window.ethereum) {
            const [selectedAccount] = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAccount(selectedAccount);
        } else {
            console.error('Ethereum provider not found. Please install MetaMask.');
        }
    }, [accountProp]);

    const fetchJobs = useCallback(async () => {
        if (!account) return;
        if (!contractAddress) {
            console.error('VITE_CONTRACT_ADDRESS is missing. Deploy the contract and set it in your .env file.');
            return;
        }
        if (typeof window.ethereum === 'undefined') {
            console.error('Ethereum provider not found.');
            return;
        }

        setIsLoading(true);
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const contract = new ethers.Contract(contractAddress, contractABI.abi, provider);
            const jobsArray = await contract.getJobs();

            const jobsWithDetails = await Promise.all(
                jobsArray.map(async (job, index) => {
                    const jobPoster = job.jobPoster || job[0];
                    if (!jobPoster) {
                        return null;
                    }

                    // Only include jobs posted by this account
                    if (jobPoster.toLowerCase() !== account.toLowerCase()) {
                        return null;
                    }

                    // Fetch applications for this job to find accepted one
                    let acceptedApplication = null;
                    try {
                        const applicationsArray = await contract.getApplications(index);
                        const acceptedApp = applicationsArray.find(
                            app => app.isAccepted === true
                        );
                        
                        if (acceptedApp) {
                            // Load profile and submitted work for accepted applicant
                            const savedProfile = localStorage.getItem(`profile_${acceptedApp.applicant}`);
                            const profile = savedProfile ? JSON.parse(savedProfile) : null;
                            
                            // Try both key formats to ensure we find the submitted work
                            // Format 1: submittedWork_${jobId}_${applicant}
                            const submittedWorkKey1 = `submittedWork_${index}_${acceptedApp.applicant}`;
                            // Format 2: Also check with jobId from contract if available
                            const jobIdFromContract = job.jobId ? (typeof job.jobId.toNumber === 'function' ? job.jobId.toNumber() : Number(job.jobId)) : index;
                            const submittedWorkKey2 = `submittedWork_${jobIdFromContract}_${acceptedApp.applicant}`;
                            
                            // Try both keys
                            let submittedWorkUrl = localStorage.getItem(submittedWorkKey1) || '';
                            if (!submittedWorkUrl) {
                                submittedWorkUrl = localStorage.getItem(submittedWorkKey2) || '';
                            }
                            
                            // Also check all localStorage keys that match the pattern (for debugging)
                            if (!submittedWorkUrl) {
                                for (let i = 0; i < localStorage.length; i++) {
                                    const key = localStorage.key(i);
                                    if (key && key.startsWith('submittedWork_') && key.includes(acceptedApp.applicant)) {
                                        // Extract jobId from key and check if it matches
                                        const keyParts = key.split('_');
                                        if (keyParts.length >= 3) {
                                            const keyJobId = keyParts[1];
                                            if (keyJobId === String(index) || keyJobId === String(jobIdFromContract)) {
                                                submittedWorkUrl = localStorage.getItem(key) || '';
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            
                            acceptedApplication = {
                                applicant: acceptedApp.applicant,
                                name: acceptedApp.name,
                                previousWorkLink: acceptedApp.previousWorkLink,
                                projectLink: acceptedApp.projectLink,
                                isReviewed: acceptedApp.isReviewed,
                                isAccepted: acceptedApp.isAccepted,
                                profile,
                                submittedWorkUrl,
                            };
                        }
                    } catch (err) {
                        console.error(`Error fetching applications for job ${index}:`, err);
                    }

                    return {
                        jobId: index,
                        jobPoster,
                        title: job.title || job[1],
                        shortDescription: job.shortDescription || job[2],
                        detailedDescription: job.detailedDescription || job[3],
                        budget: job.budget ? ethers.utils.formatEther(job.budget.toString()) : '0',
                        deadline: job.deadline ? job.deadline.toNumber() : 'N/A',
                        image: job.image || job[6],
                        isCompleted: job.isCompleted || job[8],
                        isApproved: job.isApproved || job[9],
                        acceptedApplication,
                    };
                })
            );

            // Filter out nulls after Promise.all resolves
            const formattedJobs = jobsWithDetails.filter(job => job !== null);

            setJobs(formattedJobs);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setIsLoading(false);
        }
    }, [account, contractAddress]);

    useEffect(() => {
        requestAccount();
    }, [requestAccount]);

    useEffect(() => {
        fetchJobs();
        
        // Listen for storage events (when work is submitted in another tab)
        const handleStorageChange = (e) => {
            if (e.key && e.key.startsWith('submittedWork_')) {
                // Refresh jobs when submitted work is updated
                fetchJobs();
            }
        };
        
        // Listen for custom event (when work is submitted in same tab)
        const handleWorkSubmitted = () => {
            fetchJobs();
        };
        
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('workSubmitted', handleWorkSubmitted);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('workSubmitted', handleWorkSubmitted);
        };
    }, [fetchJobs]);

    const handlePostJobClose = () => {
        setIsPostJobModalOpen(false);
        // Refresh jobs after posting
        fetchJobs();
    };

    return (
        <div className="pt-24 max-w-[1250px] m-auto px-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Your Posted Jobs</h2>
                <button
                    onClick={fetchJobs}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Refresh to see latest submitted work"
                >
                    <span>{isLoading ? '⏳' : '🔄'}</span>
                    <span>Refresh</span>
                </button>
            </div>
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                        <p className="text-gray-600">Loading your jobs...</p>
                    </div>
                </div>
            ) : jobs.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                    {jobs.map(job => (
                        <JobCard_FC 
                            key={job.jobId} 
                            job={job} 
                            account={account}
                            onFeedbackSubmitted={fetchJobs}
                            onJobUpdated={fetchJobs}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-gray-600 text-lg mb-6">No jobs posted for this account.</p>
                    <button
                        onClick={() => setIsPostJobModalOpen(true)}
                        className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors shadow-md"
                    >
                        Post Your First Job
                    </button>
                </div>
            )}
            {isPostJobModalOpen && <PostJob closeModal={handlePostJobClose} />}
        </div>
    );
};

export default ClientJobs;
