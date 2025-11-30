import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import contractABI from '../Web3/FreelanceMarketplace.json';
import { CONTRACT_ADDRESS } from '../config/web3';

const AppliedJobs = () => {
    const [appliedJobs, setAppliedJobs] = useState([]);
    const [account, setAccount] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const contractAddress = CONTRACT_ADDRESS;

    // Request access to the user's Ethereum account
    const requestAccount = async () => {
        if (window.ethereum) {
            const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAccount(account);
        } else {
            console.error("Ethereum provider not found. Install MetaMask.");
        }
    };

    // Fetch jobs the user has applied for, including review/accept status
    const fetchAppliedJobs = async () => {
        setIsLoading(true);
        if (!contractAddress) {
            console.error('VITE_CONTRACT_ADDRESS is missing. Deploy the contract and set it in your .env file.');
            setIsLoading(false);
            return;
        }
        if (typeof window.ethereum !== 'undefined' && account) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const contract = new ethers.Contract(contractAddress, contractABI.abi, provider);

            try {
                // Check if contract has the new function by trying to call it
                // Use new helper: returns (jobs[], reviewed[], accepted[], jobIds[])
                let result;
                try {
                    result = await contract.getAppliedJobsWithStatus(account);
                } catch (funcError) {
                    // If function doesn't exist, fall back to old method
                    console.warn('getAppliedJobsWithStatus not available, using fallback method:', funcError);
                    const jobsArray = await contract.getAppliedJobs(account);
                    const formattedJobs = jobsArray.map((job, index) => ({
                        jobId: index,
                        title: job.title || job[1] || 'N/A',
                        projectLink: job.workUrl || job[7] || 'N/A',
                        isReviewed: false, // Can't determine from old function
                        isAccepted: false, // Can't determine from old function
                    }));
                    setAppliedJobs(formattedJobs);
                    setIsLoading(false);
                    return;
                }

                const jobsArray = result[0];
                const reviewedArray = result[1];
                const acceptedArray = result[2];
                const jobIdsArray = result[3];

                console.log('Fetched applied jobs with status:', jobsArray, reviewedArray, acceptedArray);

                // Safety check: ensure arrays have same length
                if (!jobsArray || jobsArray.length === 0) {
                    setAppliedJobs([]);
                    setIsLoading(false);
                    return;
                }

                const formattedJobs = jobsArray.map((job, index) => {
                    // `job` is a Job struct; destructure with safety
                    const title = job.title || job[1];
                    const shortDescription = job.shortDescription || job[2];
                    const budget = job.budget ? ethers.utils.formatEther(job.budget.toString()) : '0';
                    const workUrl = job.workUrl || job[7];
                    const image = job.image || job[6];
                    const deadline = job.deadline ? job.deadline.toNumber() : null;
                    const jobIdOnChain = jobIdsArray && jobIdsArray[index] 
                        ? (typeof jobIdsArray[index].toNumber === 'function' 
                            ? jobIdsArray[index].toNumber() 
                            : Number(jobIdsArray[index]))
                        : index;

                    // Load submitted work URL if exists
                    const submittedWorkKey = `submittedWork_${jobIdOnChain}_${account}`;
                    const submittedWorkUrl = localStorage.getItem(submittedWorkKey) || '';

                    return {
                        jobId: jobIdOnChain,
                        title: title || 'N/A',
                        shortDescription: shortDescription || '',
                        budget: budget,
                        projectLink: workUrl || 'N/A',
                        image: image || '',
                        deadline: deadline,
                        isReviewed: reviewedArray && reviewedArray[index] ? reviewedArray[index] : false,
                        isAccepted: acceptedArray && acceptedArray[index] ? acceptedArray[index] : false,
                        submittedWorkUrl: submittedWorkUrl,
                        // Check if work has actually been submitted
                        hasWorkSubmitted: submittedWorkUrl && submittedWorkUrl.trim() !== '',
                    };
                });

                setAppliedJobs(formattedJobs);
            } catch (error) {
                console.error("Error fetching applied jobs:", error);
                // Show user-friendly error
                if (error.message && error.message.includes('revert')) {
                    console.warn('Contract call reverted. This might mean the contract address is outdated or the function is not available.');
                    console.warn('Please ensure VITE_CONTRACT_ADDRESS in .env matches the latest deployed contract.');
                }
                setAppliedJobs([]); // Set empty array on error to prevent crashes
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        requestAccount()
            .then(fetchAppliedJobs)
            .catch(error => {
                console.error("Error during account request or job fetching:", error);
                setIsLoading(false);
            });
    }, [account]);

    const getStatusBadge = (isReviewed, isAccepted) => {
        if (isAccepted) {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Accepted
                </span>
            );
        } else if (isReviewed) {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Not Accepted
                </span>
            );
        } else {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 flex items-center gap-1">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                    Pending Review
                </span>
            );
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    return (
        <div className="pt-24 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="max-w-[1250px] mx-auto px-6 pb-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">My Applications</h1>
                    <p className="text-gray-600 text-lg">Track the status of all your job applications</p>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-gray-600">Loading your applications...</p>
                        </div>
                    </div>
                ) : appliedJobs.length === 0 ? (
                    /* Empty State */
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Applications Yet</h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            You haven't applied to any jobs yet. Start exploring opportunities and submit your first application!
                        </p>
                        <button
                            onClick={() => navigate('/find-job')}
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                        >
                            Explore Jobs
                        </button>
                    </div>
                ) : (
                    /* Jobs Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {appliedJobs.map(job => (
                            <div 
                                key={job.jobId} 
                                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                            >
                                {/* Job Image */}
                                {job.image && (
                                    <div className="h-48 overflow-hidden bg-gray-200">
                                        <img 
                                            src={job.image} 
                                            alt={job.title}
                                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                        />
                                    </div>
                                )}

                                {/* Card Content */}
                                <div className="p-6">
                                    {/* Status Badge */}
                                    <div className="mb-4">
                                        {getStatusBadge(job.isReviewed, job.isAccepted)}
                                    </div>

                                    {/* Job Title */}
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/job/${job.jobId}`)}
                                    >
                                        {job.title}
                                    </h3>

                                    {/* Short Description */}
                                    {job.shortDescription && (
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                            {job.shortDescription}
                                        </p>
                                    )}

                                    {/* Job Details */}
                                    <div className="space-y-2 mb-4">
                                        {job.budget && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-500">💰</span>
                                                <span className="text-gray-700">
                                                    <strong>Budget:</strong> {job.budget} ETH
                                                </span>
                                            </div>
                                        )}
                                        {job.deadline && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-500">📅</span>
                                                <span className="text-gray-700">
                                                    <strong>Deadline:</strong> {formatDate(job.deadline)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Submit Work Section for Accepted Jobs - Show if accepted but work not submitted, or if work submitted but not reviewed yet */}
                                    {job.isAccepted && (!job.hasWorkSubmitted || (job.hasWorkSubmitted && !job.isReviewed)) && (
                                        <>
                                            <div className="border-t border-gray-200 my-4"></div>
                                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-lg border-2 border-green-300 shadow-md">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="text-2xl">📤</span>
                                                    <h4 className="font-bold text-gray-900 text-lg">
                                                        Submit Your Completed Work
                                                    </h4>
                                                </div>
                                                
                                                {job.submittedWorkUrl ? (
                                                    <div className="bg-white p-4 rounded-lg border-2 border-green-400 mb-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-green-600 text-xl">✅</span>
                                                            <p className="font-semibold text-green-800">Work Already Submitted!</p>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mb-2">Your submitted work link:</p>
                                                        <a
                                                            href={job.submittedWorkUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-blue-600 hover:underline break-all font-medium block mb-2"
                                                        >
                                                            {job.submittedWorkUrl}
                                                        </a>
                                                        <p className="text-xs text-gray-500 italic">
                                                            You can update it below if needed.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4">
                                                        <p className="text-sm text-yellow-800">
                                                            <strong>⚠️ No work submitted yet.</strong> Please submit your completed work below.
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            Work Submission Link:
                                                        </label>
                                                        <input
                                                            type="url"
                                                            id={`work-url-${job.jobId}`}
                                                            defaultValue={job.submittedWorkUrl}
                                                            placeholder="https://your-completed-work-link.com or https://drive.google.com/..."
                                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                                        />
                                                        <p className="text-xs text-gray-600 mt-2">
                                                            💡 <strong>Tip:</strong> You can submit a link to:
                                                            <br />• Google Drive / Dropbox folder
                                                            <br />• GitHub repository
                                                            <br />• Your portfolio/project page
                                                            <br />• Any publicly accessible link to your work
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const input = document.getElementById(`work-url-${job.jobId}`);
                                                            const workUrl = input.value.trim();
                                                            
                                                            if (!workUrl) {
                                                                alert('Please enter a work submission URL.');
                                                                return;
                                                            }
                                                            
                                                            // Basic URL validation
                                                            try {
                                                                new URL(workUrl);
                                                            } catch (e) {
                                                                alert('Please enter a valid URL (must start with http:// or https://)');
                                                                return;
                                                            }
                                                            
                                                            const submittedKey = `submittedWork_${job.jobId}_${account}`;
                                                            localStorage.setItem(submittedKey, workUrl);
                                                            
                                                            // Dispatch custom event to notify other components
                                                            window.dispatchEvent(new CustomEvent('workSubmitted', {
                                                                detail: { jobId: job.jobId, applicant: account, workUrl }
                                                            }));
                                                            
                                                            // Update local state
                                                            setAppliedJobs(prev => prev.map(j => 
                                                                j.jobId === job.jobId 
                                                                    ? { ...j, submittedWorkUrl: workUrl }
                                                                    : j
                                                            ));
                                                            
                                                            alert('✅ Work submitted successfully! The client will be notified and can review it.');
                                                        }}
                                                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                                    >
                                                        <span>📤</span>
                                                        <span>{job.submittedWorkUrl ? 'Update Submission' : 'Submit Work'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Divider */}
                                    <div className="border-t border-gray-200 my-4"></div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => navigate(`/job/${job.jobId}`)}
                                            className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            View Job Details
                                        </button>
                                        {job.projectLink && job.projectLink !== 'N/A' && (
                                            <a
                                                href={job.projectLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm text-center"
                                            >
                                                View Project Link
                                            </a>
                                        )}
                                    </div>

                                    {/* Status Info */}
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <div className="flex justify-between items-center text-xs text-gray-500">
                                            <span>Job ID: {job.jobId}</span>
                                            <span>
                                                {job.isReviewed ? 'Reviewed' : 'Awaiting Review'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Summary Stats */}
                {appliedJobs.length > 0 && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
                            <div className="text-3xl font-bold text-blue-600 mb-1">
                                {appliedJobs.length}
                            </div>
                            <div className="text-gray-600 text-sm">Total Applications</div>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
                            <div className="text-3xl font-bold text-green-600 mb-1">
                                {appliedJobs.filter(job => job.isAccepted).length}
                            </div>
                            <div className="text-gray-600 text-sm">Accepted</div>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
                            <div className="text-3xl font-bold text-yellow-600 mb-1">
                                {appliedJobs.filter(job => !job.isReviewed).length}
                            </div>
                            <div className="text-gray-600 text-sm">Pending Review</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppliedJobs;
